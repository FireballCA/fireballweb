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

  const cleanInline = (value) => String(value || '').replace(/[\r\n]+/g, '').trim()
  const toResendTagToken = (value, fallback = 'unknown') => {
    const normalized = String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9_-]+/g, '_')
      .replace(/^_+|_+$/g, '')
    return normalized || fallback
  }
  const extractEmailDomain = (value) => {
    const cleaned = cleanInline(value)
    const bracketMatch = cleaned.match(/<([^>]+)>/)
    const emailValue = (bracketMatch ? bracketMatch[1] : cleaned).toLowerCase()
    const atIndex = emailValue.lastIndexOf('@')
    return atIndex === -1 ? '' : emailValue.slice(atIndex + 1)
  }
  const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])

  const to = cleanInline(payload.to || '')
  const subject = String(payload.subject || '').trim()
  const message = String(payload.message || '').trim()
  const html = String(payload.html || '').trim()
  const companyName = String(payload.companyName || '').trim()
  const flowTag = String(payload.flowTag || 'partner_approval').trim() || 'partner_approval'
  const safeFlowTag = toResendTagToken(flowTag, 'partner_flow')
  const safeCompanyTag = toResendTagToken(companyName, 'unknown')

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' })
  }

  const normalizeEnvSecret = (value) =>
    String(value || '')
      .trim()
      .replace(/^['"]|['"]$/g, '')

  const RESEND_API_KEY = normalizeEnvSecret(
    process.env.RESEND_API_KEY || process.env.RESEND_KEY || '',
  )
  const FIREBALL_FROM_EMAIL = cleanInline(
    process.env.FIREBALL_FROM_EMAIL || 'Fireball Canada <no-reply@fireballcanada.com>',
  )
  const fromDomain = extractEmailDomain(FIREBALL_FROM_EMAIL)

  if (!fromDomain) {
    return res.status(400).json({
      error: 'Invalid FIREBALL_FROM_EMAIL format. Use e.g. Fireball Canada <partners@yourdomain.com>.',
    })
  }

  if (PUBLIC_EMAIL_DOMAINS.has(fromDomain)) {
    return res.status(400).json({
      error:
        'Invalid sender domain for Resend. Public domains (gmail/outlook/yahoo/icloud) cannot be used as FROM. Verify your own domain in Resend and set FIREBALL_FROM_EMAIL with that domain.',
      debug: { from: FIREBALL_FROM_EMAIL, fromDomain },
    })
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({
      error: 'Missing RESEND_API_KEY on server. Configure this env var to enable official email sending.',
      debug: {
        runtime: process.env.VERCEL ? 'vercel' : 'node',
        vercelEnv: process.env.VERCEL_ENV || 'local',
        hasResendApiKey: Boolean(process.env.RESEND_API_KEY),
        hasResendKeyAlias: Boolean(process.env.RESEND_KEY),
      },
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
          { name: 'flow', value: safeFlowTag },
          { name: 'company', value: safeCompanyTag },
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
