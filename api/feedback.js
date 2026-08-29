export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, message } = req.body ?? {}

  if (
    !email ||
    typeof email !== 'string' ||
    !message ||
    typeof message !== 'string' ||
    !message.trim()
  ) {
    return res.status(400).json({ error: 'Email and message are required' })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    return res.status(500).json({ error: 'Feedback service is not configured' })
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Новый отзыв от: ${email}\n\n${message.trim()}`,
        }),
      },
    )

    const data = await response.json().catch(() => ({}))

    if (!response.ok || !data.ok) {
      throw new Error(data.description || `Telegram error ${response.status}`)
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    return res.status(500).json({
      error:
        err instanceof Error ? err.message : 'Failed to send feedback',
    })
  }
}
