export type ContactFormPayload = {
  name: string
  email: string
  subject: string
  message: string
  accountLinked?: boolean
}

export async function sendContactFormMessage(
  payload: ContactFormPayload,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const response = await fetch('/api/send-contact-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: payload.name.trim(),
        email: payload.email.trim(),
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        accountLinked: payload.accountLinked === true,
        website: '',
      }),
    })

    const data = (await response.json().catch(() => ({}))) as { error?: string }
    if (!response.ok) {
      return { ok: false, error: data?.error || 'Unable to send your message.' }
    }

    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to send your message.',
    }
  }
}
