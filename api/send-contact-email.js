import {
  assertEmailServiceReady,
  getResendApiKey,
  resolveOutboundEmail,
  resolveTeamInbox,
} from './_email.js'
import { cleanInline, isValidEmail, parseJsonBody, rateLimit } from './_security.js'

const toResendTagToken = (value, fallback = 'unknown') => {
  const normalized = String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized || fallback
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendViaResend({ from, to, replyTo, subject, text, html, tag }) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getResendApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: replyTo || undefined,
      subject,
      text,
      html,
      tags: [{ name: 'flow', value: toResendTagToken(tag, 'email') }],
    }),
  })

  const data = await response.json().catch(() => ({}))
  return { ok: response.ok, data }
}

function buildContactAutoReplyHtml({ name, subject }) {
  const safeName = escapeHtml(name)
  const safeSubject = escapeHtml(subject)

  return `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 14px 28px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Canada</div>
        <h1 style="margin:8px 0 0 0;font-size:20px;line-height:1.3;color:#101827;">We received your message</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
        <p style="margin:0 0 14px 0;">Hi ${safeName},</p>
        <p style="margin:0 0 14px 0;">Thank you for contacting Fireball Canada. We received your message about <strong>${safeSubject}</strong>.</p>
        <p style="margin:0 0 14px 0;">Our team usually replies within <strong>24–48 hours</strong>.</p>
        <p style="margin:0;">Sincerely,<br/>Fireball Canada</p>
      </td></tr>
      <tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Fireball Canada — automated confirmation</td></tr>
    </table>
  </div>`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  if (rateLimit(req, res, { key: 'send-contact-email', windowMs: 60_000, max: 5 })) return

  const payload = parseJsonBody(req)

  if (cleanInline(payload.website || '')) {
    return res.status(200).json({ success: true })
  }

  const name = cleanInline(payload.name || '', 120)
  const email = cleanInline(payload.email || '', 254).toLowerCase()
  const subject = cleanInline(payload.subject || '', 180)
  const message = String(payload.message || '').trim().slice(0, 5000)
  const accountLinked = payload.accountLinked === true

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Missing required fields: name, email, subject, message' })
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' })
  }

  const teamInbox = resolveTeamInbox()
  if (!isValidEmail(teamInbox)) {
    return res.status(500).json({ error: 'Invalid contact inbox configuration' })
  }

  if (!assertEmailServiceReady(res)) return

  const { from, replyTo } = resolveOutboundEmail()

  const safeName = escapeHtml(name)
  const safeEmail = escapeHtml(email)
  const safeSubject = escapeHtml(subject)
  const safeMessage = escapeHtml(message).replace(/\r\n/g, '\n').split('\n').join('<br/>')
  const mailSubject = `[Contact] ${subject}`

  const text = [
    `New contact message from ${name} <${email}>`,
    accountLinked ? 'Account: signed in' : 'Account: guest',
    '',
    `Subject: ${subject}`,
    '',
    message,
  ].join('\n')

  const html = `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr><td style="padding:28px 28px 14px 28px;">
        <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Canada</div>
        <h1 style="margin:8px 0 0 0;font-size:20px;line-height:1.3;color:#101827;">New contact form message</h1>
      </td></tr>
      <tr><td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Name</td><td style="padding:6px 0;font-weight:600;">${safeName}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Email</td><td style="padding:6px 0;"><a href="mailto:${safeEmail}">${safeEmail}</a></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Subject</td><td style="padding:6px 0;">${safeSubject}</td></tr>
          <tr><td style="padding:6px 0;color:#6b7280;font-size:12px;text-transform:uppercase;letter-spacing:.08em;">Account</td><td style="padding:6px 0;">${accountLinked ? 'Signed in' : 'Guest'}</td></tr>
        </table>
        <div style="margin-top:16px;padding-top:16px;border-top:1px solid #e5e7eb;">
          <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Message</div>
          <div>${safeMessage}</div>
        </div>
      </td></tr>
      <tr><td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">Fireball Canada — Contact form</td></tr>
    </table>
  </div>`

  try {
    const adminResult = await sendViaResend({
      from,
      to: teamInbox,
      replyTo: email,
      subject: mailSubject,
      text,
      html,
      tag: 'contact_form',
    })

    if (!adminResult.ok) {
      console.error('Resend contact email failed:', adminResult.data)
      const resendMessage =
        typeof adminResult.data?.message === 'string' ? adminResult.data.message : null
      return res.status(400).json({
        error: resendMessage || 'Failed to send message. Please try again later.',
      })
    }

    const autoReplySubject = 'We received your message — Fireball Canada'
    const autoReplyText = [
      `Hi ${name},`,
      '',
      `Thank you for contacting Fireball Canada. We received your message about "${subject}".`,
      '',
      'Our team usually replies within 24–48 hours.',
      '',
      'Sincerely,',
      'Fireball Canada',
    ].join('\n')
    const autoReplyHtml = buildContactAutoReplyHtml({ name, subject })

    const autoReplyResult = await sendViaResend({
      from,
      to: email,
      replyTo: replyTo || teamInbox,
      subject: autoReplySubject,
      text: autoReplyText,
      html: autoReplyHtml,
      tag: 'contact_form_auto_reply',
    })

    if (!autoReplyResult.ok) {
      console.error('Resend contact auto-reply failed:', autoReplyResult.data)
    }

    return res.status(200).json({
      success: true,
      provider: 'resend',
      id: adminResult.data?.id || null,
      autoReplySent: autoReplyResult.ok,
    })
  } catch (error) {
    console.error('Contact email error:', error)
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' })
  }
}
