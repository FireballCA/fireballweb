import { cleanInline, isValidEmail } from './_security.js'

export const PUBLIC_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'outlook.com',
  'hotmail.com',
  'yahoo.com',
  'icloud.com',
])

export const DEFAULT_TEAM_INBOX = 'fireballcarcarecanada@gmail.com'
export const RESEND_FALLBACK_FROM = 'Fireball Canada <noreply@fireball-canada.com>'

export const extractEmailDomain = (value) => {
  const cleaned = cleanInline(value)
  const bracketMatch = cleaned.match(/<([^>]+)>/)
  const emailValue = (bracketMatch ? bracketMatch[1] : cleaned).toLowerCase()
  const atIndex = emailValue.lastIndexOf('@')
  return atIndex === -1 ? '' : emailValue.slice(atIndex + 1)
}

export function resolveTeamInbox() {
  return cleanInline(
    process.env.CONTACT_INBOX_EMAIL ||
      process.env.FIREBALL_REPLY_TO_EMAIL ||
      process.env.TEAM_INBOX_EMAIL ||
      DEFAULT_TEAM_INBOX,
    254,
  ).toLowerCase()
}

/**
 * Resend n'accepte pas @gmail.com en FROM.
 * Sans domaine custom vérifié → onboarding@resend.dev + reply_to = votre Gmail.
 */
export function resolveOutboundEmail() {
  const replyTo = resolveTeamInbox()
  const configured = cleanInline(process.env.FIREBALL_FROM_EMAIL || '')

  if (!configured) {
    return { from: RESEND_FALLBACK_FROM, replyTo }
  }

  const domain = extractEmailDomain(configured)
  if (!domain || PUBLIC_EMAIL_DOMAINS.has(domain)) {
    return { from: RESEND_FALLBACK_FROM, replyTo }
  }

  return { from: configured, replyTo }
}

export function normalizeEnvSecret(value) {
  return String(value || '')
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

export function getResendApiKey() {
  return normalizeEnvSecret(process.env.RESEND_API_KEY || process.env.RESEND_KEY || '')
}

export function assertEmailServiceReady(res) {
  const apiKey = getResendApiKey()
  if (!apiKey) {
    res.status(500).json({ error: 'Email service not configured' })
    return null
  }

  const { from } = resolveOutboundEmail()
  if (!from || !extractEmailDomain(from)) {
    res.status(500).json({ error: 'Invalid sender email configuration' })
    return null
  }

  return { apiKey, ...resolveOutboundEmail() }
}

export function isValidRecipientEmail(value) {
  return isValidEmail(value)
}
