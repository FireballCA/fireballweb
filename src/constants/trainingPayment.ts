/**
 * Paiement formation Academy — lien Stripe (Payment Link ou Checkout public).
 * Définir dans `.env` : VITE_TRAINING_STRIPE_PAYMENT_URL=https://buy.stripe.com/...
 */
export function getTrainingStripeCheckoutUrl(): string | null {
  const raw = import.meta.env.VITE_TRAINING_STRIPE_PAYMENT_URL as string | undefined
  if (typeof raw !== 'string' || !raw.trim()) return null
  const u = raw.trim()
  if (!u.startsWith('http://') && !u.startsWith('https://')) return null
  return u
}

export function buildTrainingStripePaymentUrl(
  baseUrl: string,
  opts: { reference: string; email?: string | null },
): string {
  try {
    const url = new URL(baseUrl)
    url.searchParams.set('client_reference_id', opts.reference)
    const em = opts.email?.trim()
    if (em) url.searchParams.set('prefilled_email', em)
    return url.toString()
  } catch {
    return baseUrl
  }
}
