/**
 * Confirmation d’inscription Academy — envoi via le même endpoint Resend que les e-mails partenaires
 * (`/api/send-partner-approval-email`).
 *
 * En production, cet e-mail part après un paiement Stripe réussi : le montant affiché est le total facturé,
 * pas une estimation. (En développement, le flux peut encore simuler la valeur finale.)
 */

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

export function getAccountDashboardUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/account/dashboard`
  }
  return 'https://fireballcanada.com/account/dashboard'
}

/** Référence de commande provisoire (alignée sur le format d’identifiant de paiement ; remplacée par l’ID définitif lors du traitement). */
export function generatePreviewStripeOrderId(): string {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let s = 'pi_'
  for (let i = 0; i < 24; i++) {
    s += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return s
}

export function buildTrainingRegistrationEmailHtml(params: {
  customerName: string
  orderNumber: string
  sessionLabel: string
  /** Montant total facturé (paiement confirmé). */
  totalFormatted: string
  dashboardUrl: string
}): string {
  const name = escapeHtml(params.customerName)
  const order = escapeHtml(params.orderNumber)
  const session = escapeHtml(params.sessionLabel)
  const total = escapeHtml(params.totalFormatted)
  const dash = escapeHtml(params.dashboardUrl)

  return `
  <div style="margin:0;padding:24px;background:#0f1218;font-family:Inter,Arial,sans-serif;color:#0b1220;">
    <table role="presentation" style="max-width:680px;width:100%;margin:0 auto;border-collapse:collapse;background:#ffffff;border-radius:18px;overflow:hidden;">
      <tr>
        <td style="padding:28px 28px 14px 28px;">
          <div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#0485F7;font-weight:700;">Fireball Academy</div>
          <h1 style="margin:8px 0 0 0;font-size:22px;line-height:1.3;color:#101827;">Registration confirmation</h1>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 28px 22px 28px;font-size:15px;line-height:1.7;color:#1f2937;">
          <p style="margin:0 0 14px 0;">Dear ${name},</p>
          <p style="margin:0 0 14px 0;">Thank you for your payment. Your registration for Fireball Academy professional training is confirmed.</p>
          <p style="margin:0 0 10px 0;"><strong>Order reference</strong><br/><span style="font-family:ui-monospace,monospace;font-size:14px;">${order}</span></p>
          <p style="margin:0 0 10px 0;"><strong>Session</strong><br/>${session}</p>
          <p style="margin:0 0 16px 0;"><strong>Total</strong><br/>${total}</p>
          <p style="margin:0 0 14px 0;">This amount matches the charge on your payment method. Practical details for your training will follow at this email address. You may also view your registration in your Fireball account at any time.</p>
          <a href="${dash}" style="display:inline-block;padding:11px 16px;border-radius:999px;background:#0485F7;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">Access my account</a>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 28px 28px 28px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
          Fireball Canada — Academy<br/>
          This is an automated message. Please do not reply directly to this email if you need assistance; contact us through your usual Fireball channels.
        </td>
      </tr>
    </table>
  </div>`
}

export async function sendTrainingRegistrationEmail(params: {
  to: string
  customerName: string
  orderNumber: string
  sessionLabel: string
  /** Total facturé tel que confirmé par Stripe (en prod). */
  totalFormatted: string
}): Promise<{ ok: boolean; error?: string }> {
  const dashboardUrl = getAccountDashboardUrl()
  const subject = `Fireball Academy — Registration confirmation (${params.orderNumber})`
  const message = `Dear ${params.customerName},

Thank you for your payment. Your registration for Fireball Academy professional training is confirmed.

Order reference: ${params.orderNumber}
Session: ${params.sessionLabel}
Total: ${params.totalFormatted}

This amount matches the charge on your payment method. Practical details for your training will follow at this email address. You may also view your registration in your Fireball account:
${dashboardUrl}

Sincerely,
Fireball Canada — Academy`

  const html = buildTrainingRegistrationEmailHtml({
    customerName: params.customerName,
    orderNumber: params.orderNumber,
    sessionLabel: params.sessionLabel,
    totalFormatted: params.totalFormatted,
    dashboardUrl,
  })

  try {
    const response = await fetch('/api/send-partner-approval-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: params.to.trim(),
        subject,
        message,
        html,
        companyName: params.sessionLabel.slice(0, 80),
        flowTag: 'academy_training_registration',
      }),
    })
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      return { ok: false, error: payload?.error || 'Unable to send email.' }
    }
    return { ok: true }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : 'Unable to send email.',
    }
  }
}
