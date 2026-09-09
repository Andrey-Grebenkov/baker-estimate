import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { randomInt } from 'node:crypto'

const OTP_TTL_MS = 15 * 60 * 1000 // 15 minutes

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

function generateOtp() {
  // 6-digit string, left-padded with zeros just in case.
  return randomInt(0, 1_000_000).toString().padStart(6, '0')
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
    const { email } = req.body ?? {}

    if (!token || !email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email and authorization token are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()

    const supabase = getSupabaseServiceClient()

    // Verify the bearer token belongs to the requested email.
    // This prevents one authenticated user from sending OTPs to other users' addresses.
    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user || userData.user.email?.toLowerCase() !== normalizedEmail) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + OTP_TTL_MS).toISOString()
    const lastSentAt = now.toISOString()

    // Rate-limiting: inspect the existing row before generating a new code.
    const { data: existing, error: selectError } = await supabase
      .from('otp_codes')
      .select('resend_count, last_sent_at, expires_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (selectError) throw selectError

    let resendCount = 0

    if (existing) {
      const isExpired = new Date(existing.expires_at) < now

      // Expired codes are treated as a fresh rate-limit window.
      if (!isExpired) {
        resendCount = existing.resend_count ?? 0
        const lastSent = new Date(existing.last_sent_at)
        const timeSinceLastSend = now.getTime() - lastSent.getTime()

        // 60-second cooldown between resends.
        if (timeSinceLastSend < 60_000) {
          return res.status(429).json({
            error: 'Подождите минуту перед следующей отправкой',
          })
        }
      }

      // Max 3 sends per code window (industry standard cap).
      if (resendCount >= 3) {
        return res.status(429).json({
          error: 'Превышен лимит отправки писем. Попробуйте позже.',
        })
      }
    }

    resendCount += 1
    const code = generateOtp()

    // Upsert so resending before expiry overwrites the old code and resets attempts.
    const { error: upsertError } = await supabase
      .from('otp_codes')
      .upsert(
        {
          email: normalizedEmail,
          code,
          expires_at: expiresAt,
          attempts: 0,
          resend_count: resendCount,
          last_sent_at: lastSentAt,
        },
        { onConflict: 'email' },
      )

    if (upsertError) {
      throw upsertError
    }

    const resendApiKey = process.env.RESEND_API_KEY
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'

    if (!resendApiKey) {
      throw new Error('Resend API key is not configured')
    }

    const resend = new Resend(resendApiKey)
    const { error: sendError } = await resend.emails.send({
      from: fromAddress,
      to: normalizedEmail,
      subject: 'Код подтверждения',
      html: `<p>Ваш код подтверждения: <strong>${code}</strong></p><p>Код действителен 15 минут.</p>`,
    })

    if (sendError) {
      throw new Error(typeof sendError === 'string' ? sendError : sendError.message)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    // Never leak the OTP or the service key to the client.
    console.error('[send-otp]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to send OTP',
    })
  }
}
