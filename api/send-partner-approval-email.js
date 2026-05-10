import { requireAuth } from './_auth.js'
import { cleanInline, isValidEmail, parseJsonBody, rateLimit } from './_security.js'

const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'icloud.com'])
const ADMIN_NOTIFICATION_EMAIL = 'info@fireballcanada.com'

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

function stripUnsafeHtml(value) {
  return String(value || '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '')
    .replace(/\s(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi, '')
    .trim()
    .slice(0, 25_000)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'send-partner-approval-email', windowMs: 60_000, max: 12 })) return

  const auth = await requireAuth(req)
  if (auth.error) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const payload = parseJsonBody(req)
  const to = cleanInline(payload.to || '', 254).toLowerCase()
  const subject = cleanInline(payload.subject || '', 180)
  const message = String(payload.message || '').trim().slice(0, 10_000)
  const html = stripUnsafeHtml(payload.html)
  const companyName = cleanInline(payload.companyName || '', 120)
  const flowTag = String(payload.flowTag || 'partner_approval').trim() || 'partner_approval'
  const safeFlowTag = toResendTagToken(flowTag, 'partner_flow')
  const safeCompanyTag = toResendTagToken(companyName, 'unknown')

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' })
  }

  if (!isValidEmail(to)) {
    return res.status(400).json({ error: 'Invalid recipient email address' })
  }

  const { data: profile, error: profileError } = await auth.supabase
    .from('profiles')
    .select('role')
    .eq('id', auth.user.id)
    .maybeSingle()
  const role = String(profile?.role || '').toLowerCase()
  const isAdmin = !profileError && role === 'admin'
  const isTrainingConfirmation =
    safeFlowTag === 'academy_training_registration' &&
    auth.user.email?.toLowerCase() === to
  const isEventRsvp =
    safeFlowTag.startsWith('event_rsvp_') &&
    to === ADMIN_NOTIFICATION_EMAIL

  if (!isAdmin && !isTrainingConfirmation && !isEventRsvp) {
    return res.status(403).json({ error: 'Forbidden' })
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
    return res.status(500).json({ error: 'Invalid sender email configuration' })
  }

  if (PUBLIC_EMAIL_DOMAINS.has(fromDomain)) {
    return res.status(500).json({ error: 'Invalid sender domain configuration' })
  }

  if (!RESEND_API_KEY) {
    return res.status(500).json({ error: 'Email service not configured' })
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
      return res.status(400).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({
      success: true,
      provider: 'resend',
      id: data?.id || null,
    })
  } catch {
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
