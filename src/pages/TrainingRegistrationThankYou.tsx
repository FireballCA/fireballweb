import { useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { appleButtonVisualClassName } from '@/components/ui/AppleButton'
import { cn } from '@/lib/utils'

export type TrainingThankYouState = {
  orderNumber: string
  email: string
  customerName: string
}

export function TrainingRegistrationThankYou() {
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as TrainingThankYouState | null

  useEffect(() => {
    document.title = 'Request received - Fireball Academy'
  }, [])

  useEffect(() => {
    if (!state?.orderNumber) {
      navigate('/academy', { replace: true })
    }
  }, [state, navigate])

  if (!state?.orderNumber) {
    return null
  }

  const firstName = state.customerName?.split(/\s+/)[0] || 'there'

  return (
    <main className="min-h-screen bg-white font-sans text-carbon-900">
      <div className="mx-auto max-w-lg px-6 py-16 md:py-24">
        <p className="text-xs font-semibold uppercase tracking-wider text-[#0485F7]">Fireball Academy</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Thank you, {firstName}</h1>
        <p className="mt-4 text-base leading-relaxed text-carbon-600">
          Your <strong className="font-semibold text-carbon-800">request</strong> to attend a future Fireball Academy training session has been received.{' '}
          <strong className="font-semibold text-carbon-800">No payment was taken.</strong>
        </p>
        <p className="mt-4 text-base leading-relaxed text-carbon-600">
          The Fireball Canada team will review your request and notify you at{' '}
          <strong className="font-semibold text-carbon-800">{state.email}</strong> whether it is approved or declined. Please check your inbox and spam folder. If your request is approved, we will send instructions and any applicable fees and terms before you pay.
        </p>
        <div className="mt-8 rounded-xl border border-carbon-200 bg-carbon-50/80 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-carbon-500">Request reference</p>
          <p className="mt-1 font-mono text-sm font-semibold tracking-tight text-carbon-900 break-all">{state.orderNumber}</p>
          <p className="mt-2 text-xs leading-relaxed text-carbon-500">
            Use this reference when you contact Fireball Canada about your training request. It does not confirm a seat until you receive an approval message from our team.
          </p>
        </div>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Link to="/account/dashboard" className={cn('inline-flex w-full justify-center sm:w-auto', appleButtonVisualClassName)}>
            My dashboard
          </Link>
          <Link
            to="/academy"
            className="inline-flex w-full items-center justify-center rounded-full border border-carbon-300 px-5 py-2 text-xs font-semibold text-carbon-800 transition hover:bg-carbon-100 sm:w-auto"
          >
            Return to Academy
          </Link>
        </div>
      </div>
    </main>
  )
}
