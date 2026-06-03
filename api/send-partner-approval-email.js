import { requireAuth } from './_auth.js'
import {
  assertEmailServiceReady,
  getResendApiKey,
  isValidRecipientEmail,
  resolveOutboundEmail,
  resolveTeamInbox,
} from './_email.js'
import { cleanInline, parseJsonBody, rateLimit } from './_security.js'

const toResendTagToken = (value, fallback = 'unknown') => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
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
  const teamInbox = resolveTeamInbox()

  if (!to || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: to, subject, message' })
  }

  if (!isValidRecipientEmail(to)) {
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
  const isEventRsvp = safeFlowTag.startsWith('event_rsvp_') && to === teamInbox

  if (!isAdmin && !isTrainingConfirmation && !isEventRsvp) {
    return res.status(403).json({ error: 'Forbidden' })
  }

  const emailConfig = assertEmailServiceReady(res)
  if (!emailConfig) return

  const { from, replyTo } = resolveOutboundEmail()
  const replyToAddress = to === teamInbox ? undefined : replyTo

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getResendApiKey()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: replyToAddress,
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
      console.error('Resend partner/training email failed:', data)
      return res.status(400).json({ error: 'Failed to send email' })
    }

    return res.status(200).json({
      success: true,
      provider: 'resend',
      id: data?.id || null,
    })
  } catch (error) {
    console.error('Partner/training email error:', error)
    return res.status(500).json({ error: 'Failed to send email' })
  }
}
