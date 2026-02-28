export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const payload =
    typeof req.body === 'string'
      ? (() => {
          try {
            return JSON.parse(req.body)
          } catch {
            return {}
          }
        })()
      : (req.body || {})

  const to = String(payload.to || '').trim()
  const subject = String(payload.subject || '').trim()
  const message = String(payload.message || '').trim()
  const html = String(payload.html || '').trim()
  const companyName = String(payload.companyName || '').trim()
  const flowTag = String(payload.flowTag || 'partner_approval').trim() || 'partner_approval'

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' })
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
  const FIREBALL_FROM_EMAIL = process.env.FIREBALL_FROM_EMAIL || 'Fireball Canada <no-reply@fireballcanada.com>'

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error: 'Missing RESEND_API_KEY on server. Configure this env var to enable official email sending.',
    })
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FIREBALL_FROM_EMAIL,
        to: [to],
        subject,
        text: message,
        html: html || undefined,
        tags: [
          { name: 'flow', value: flowTag },
          { name: 'company', value: companyName || 'unknown' },
        ],
      }),
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
      return res.status(400).json({
        error: 'Resend rejected the email request.',
        details: data,
      })
    }

    return res.status(200).json({
      success: true,
      provider: 'resend',
      id: data?.id || null,
    })
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to send email',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
