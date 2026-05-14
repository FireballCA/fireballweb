/**
 * E-mails transactionnels admin (formation / partenaire) via le middleware Vite Resend.
 */

import { highlightStatusWordsInEscapedPlainText } from '@/utils/notificationTextHighlight'
import { getAuthHeaders } from '@/utils/authHeaders'

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getOrigin(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return 'https://fireball-canada.com'
}

async function postEmail(payload: {
  to: string
  subject: string
  message: string
  html: string
  flowTag: string
  companyName?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/send-partner-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await getAuthHeaders()) },
      body: JSON.stringify({
        to: payload.to.trim(),
        subject: payload.subject,
        message: payload.message,
        html: payload.html,
        companyName: payload.companyName ?? 'Fireball',
        flowTag: payload.flowTag,
      }),
    })
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      return { ok: false, error: data?.error || 'Unable to send email.' }
    }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Unable to send email.' }
  }
}

export async function sendTrainingDecisionEmail(params: {
  to: string
  customerName: string
  reference: string
  sessionLabel: string
  kind: 'approved' | 'payment_pending' | 'paid' | 'declined'
  extraNote?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const dash = `${getOrigin()}/account/dashboard`
  const ref = escapeHtml(params.reference)
  const session = escapeHtml(params.sessionLabel)
  const name = escapeHtml(params.customerName)
  const note = params.extraNote ? escapeHtml(params.extraNote) : ''

  let subject = ''
  let headline = ''
  let bodyHtml = ''
  let bodyText = ''

  switch (params.kind) {
    case 'approved':
      subject = `Fireball Academy — Request approved (${params.reference})`
      headline =
        'Your training request has been <span style="color:#059669;font-weight:700;">approved</span>'
      bodyHtml = `<p>We have <span style="color:#059669;font-weight:700;">approved</span> your training request for <strong>${session}</strong>.</p>
        <p>Next, you will receive payment instructions to confirm your seat. Reference: <strong>${ref}</strong>.</p>`
      bodyText = `We approved your request for ${params.sessionLabel}. Payment instructions will follow. Ref: ${params.reference}.`
      break
    case 'payment_pending':
      subject = `Fireball Academy — Payment required (${params.reference})`
      headline = 'Payment required to confirm your training'
      bodyHtml = `<p>Your training request for <strong>${session}</strong> is ready for payment.</p>
        ${note ? `<p>${highlightStatusWordsInEscapedPlainText(note)}</p>` : '<p>Please follow the payment instructions sent by our team.</p>'}
        <p>Reference: <strong>${ref}</strong>.</p>`
      bodyText = `Payment is due for ${params.sessionLabel}. Ref: ${params.reference}. ${params.extraNote || ''}`
      break
    case 'paid':
      subject = `Fireball Academy — Payment received (${params.reference})`
      headline = 'Payment received — you are confirmed'
      bodyHtml = `<p>We have recorded your payment for <strong>${session}</strong> (ref. <strong>${ref}</strong>).</p>
        <p>Our team will contact you with schedule details.</p>`
      bodyText = `Payment received for ${params.sessionLabel}. Ref ${params.reference}.`
      break
    case 'declined':
      subject = `Fireball Academy — Update on your request (${params.reference})`
      headline =
        'Training request <span style="color:#dc2626;font-weight:700;">declined</span>'
      bodyHtml = `<p>We are unable to proceed with your request for <strong>${session}</strong> at this time (request <span style="color:#dc2626;font-weight:700;">declined</span>).</p>
        ${note ? `<p>${highlightStatusWordsInEscapedPlainText(note)}</p>` : '<p>If you have questions, please contact Fireball Canada.</p>'}
        <p>Reference: <strong>${ref}</strong>.</p>`
      bodyText = `We cannot proceed with ${params.sessionLabel} for now. Ref ${params.reference}.`
      break
    default:
      return { ok: false, error: 'Invalid email kind.' }
  }

  const html = `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;color:#0b1220;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 14px 28px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Academy</div>
        <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#101827;">${headline}</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
        <p style="margin:0 0 14px 0;">Dear ${name},</p>
        ${bodyHtml}
        <p style="margin:16px 0 0 0;"><a href="${dash}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#0485F7;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Open my dashboard</a></p>
      </td></tr>
      <tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Fireball Canada — Academy</td></tr>
    </table>
  </div>`

  const message = `Dear ${params.customerName},\n\n${bodyText}\n\nDashboard: ${dash}`

  return postEmail({
    to: params.to,
    subject,
    message,
    html,
    flowTag: `academy_training_${params.kind}`,
    companyName: params.sessionLabel.slice(0, 80),
  })
}

/** E-mail libre depuis l’admin (corps modifiable avant envoi). */
export async function sendTrainingManualEmail(params: {
  to: string
  customerName: string
  subject: string
  bodyText: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const dash = `${getOrigin()}/account/dashboard`
  const name = escapeHtml(params.customerName)
  const bodyHtml = escapeHtml(params.bodyText)
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => highlightStatusWordsInEscapedPlainText(line))
    .join('<br/>')

  const html = `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;color:#0b1220;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 14px 28px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Academy</div>
        <h1 style="margin:8px 0 0 0;font-size:18px;line-height:1.3;color:#101827;">Message de l&apos;équipe</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
        <p style="margin:0 0 14px 0;">Dear ${name},</p>
        <div>${bodyHtml}</div>
        <p style="margin:16px 0 0 0;"><a href="${dash}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#0485F7;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Mon tableau de bord</a></p>
      </td></tr>
      <tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Fireball Canada — Academy</td></tr>
    </table>
  </div>`

  return postEmail({
    to: params.to.trim(),
    subject: params.subject.trim(),
    message: params.bodyText,
    html,
    flowTag: 'academy_training_manual',
    companyName: 'Fireball Academy',
  })
}

export async function sendPartnerDecisionEmail(params: {
  to: string
  contactName: string
  companyName: string
  kind: 'payment_pending' | 'partner' | 'declined'
  extraNote?: string
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const dash = `${getOrigin()}/account/dashboard`
  const company = escapeHtml(params.companyName)
  const name = escapeHtml(params.contactName)
  const note = params.extraNote ? escapeHtml(params.extraNote) : ''

  let subject = ''
  let headline = ''
  let bodyHtml = ''
  let bodyText = ''

  switch (params.kind) {
    case 'payment_pending':
      subject = 'Fireball Partner — Payment required'
      headline = 'Partner application — payment required'
      bodyHtml = `<p>Your application for <strong>${company}</strong> has been reviewed positively.</p>
        ${note ? `<p>${note}</p>` : '<p>Please complete the partner fee payment using the instructions we sent separately.</p>'}
        <p>After payment is confirmed, your partner access will be activated.</p>`
      bodyText = `Payment is required for ${params.companyName} to finalize partner access.`
      break
    case 'partner':
      subject = 'Fireball Partner — Welcome to the network'
      headline = 'Your partner account is active'
      bodyHtml = `<p>Congratulations — <strong>${company}</strong> is now an authorized Fireball partner.</p>
        <p>You can access partner pricing, ordering, and resources from your dashboard.</p>`
      bodyText = `Your partner account for ${params.companyName} is active.`
      break
    case 'declined':
      subject = 'Fireball Partner — Application update'
      headline =
        'Partner application <span style="color:#dc2626;font-weight:700;">declined</span>'
      bodyHtml = `<p>Thank you for your interest in partnering with Fireball.</p>
        ${note ? `<p>${highlightStatusWordsInEscapedPlainText(note)}</p>` : '<p>We are unable to <span style="color:#dc2626;font-weight:700;">approve</span> this application at this time.</p>'}`
      bodyText = `Update regarding ${params.companyName}.`
      break
    default:
      return { ok: false, error: 'Invalid email kind.' }
  }

  const html = `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 14px 28px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Partner</div>
        <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#101827;">${headline}</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
        <p style="margin:0 0 14px 0;">Dear ${name},</p>
        ${bodyHtml}
        <p style="margin:16px 0 0 0;"><a href="${dash}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#0485F7;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Open my dashboard</a></p>
      </td></tr>
      <tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Fireball Canada</td></tr>
    </table>
  </div>`

  const message = `Dear ${params.contactName},\n\n${bodyText}\n\n${dash}`

  return postEmail({
    to: params.to,
    subject,
    message,
    html,
    flowTag: `partner_${params.kind}`,
    companyName: params.companyName.slice(0, 80),
  })
}
