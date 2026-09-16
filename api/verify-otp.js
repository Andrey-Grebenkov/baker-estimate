import { createClient } from '@supabase/supabase-js'

function getSupabaseServiceClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('Supabase service client is not configured')
  }

  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

function extractBearerToken(req) {
  const header = req.headers?.authorization ?? ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
}

export default async function handler(req, res) {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const token = extractBearerToken(req)
    const { email, code } = req.body ?? {}

    if (!token || !email || typeof email !== 'string' || !code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Email, code and authorization token are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const normalizedCode = code.trim()

    const supabase = getSupabaseServiceClient()

    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user || userData.user.email?.toLowerCase() !== normalizedEmail) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Fetch the existing code. RLS is fully denied for anon/authenticated,
    // so this only works because we are using the service role key.
    const { data: row, error: selectError } = await supabase
      .from('otp_codes')
      .select('code, expires_at, attempts')
      .eq('email', normalizedEmail)
      .single()

    if (selectError || !row) {
      return res.status(400).json({ error: 'Code not found or already used' })
    }

    // Expired codes are destroyed immediately.
    if (new Date(row.expires_at) < new Date()) {
      await supabase.from('otp_codes').delete().eq('email', normalizedEmail)
      return res.status(400).json({ error: 'Code expired' })
    }

    // Brute-force counter: if we already recorded 3 or more attempts, wipe the row.
    if (row.attempts >= 3) {
      await supabase.from('otp_codes').delete().eq('email', normalizedEmail)
      return res.status(400).json({ error: 'Too many attempts' })
    }

    // Wrong code: increment the counter and reject without revealing the code.
    if (row.code !== normalizedCode) {
      await supabase
        .from('otp_codes')
        .update({ attempts: row.attempts + 1 })
        .eq('email', normalizedEmail)

      return res.status(400).json({ error: 'Invalid code' })
    }

    // Success: mark the email as verified and delete the consumed OTP row.
    const verifiedAt = new Date().toISOString()

    // Preserve an existing trial_ends_at (e.g. an admin-granted premium
    // override with a far-future date); otherwise start a fresh 60-day trial.
    const { data: existingVerification } = await supabase
      .from('verified_emails')
      .select('trial_ends_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    const trialEndsAt =
      existingVerification?.trial_ends_at ??
      new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

    const { error: verifiedError } = await supabase
      .from('verified_emails')
      .upsert(
        {
          email: normalizedEmail,
          verified_at: verifiedAt,
          trial_ends_at: trialEndsAt,
        },
        { onConflict: 'email' },
      )

    if (verifiedError) {
      throw verifiedError
    }

    await supabase.from('otp_codes').delete().eq('email', normalizedEmail)

    return res.status(200).json({ verified: true, trial_ends_at: trialEndsAt })
  } catch (err) {
    console.error('[verify-otp]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to verify OTP',
    })
  }
}
