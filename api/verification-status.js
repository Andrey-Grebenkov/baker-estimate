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
    const { email } = req.body ?? {}

    if (!token || !email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Email and authorization token are required' })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const supabase = getSupabaseServiceClient()

    const { data: userData, error: userError } = await supabase.auth.getUser(token)

    if (userError || !userData?.user || userData.user.email?.toLowerCase() !== normalizedEmail) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const { data, error } = await supabase
      .from('verified_emails')
      .select('email, trial_ends_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      throw error
    }

    return res
      .status(200)
      .json({ verified: Boolean(data), trial_ends_at: data?.trial_ends_at ?? null })
  } catch (err) {
    console.error('[verification-status]', err)
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to check verification status',
    })
  }
}
