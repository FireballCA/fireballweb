import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { appleButtonClassName } from '@/components/ui/AppleButton'
import { AppleInfoPill, type AppleInfoPillTone } from '@/components/ui/AppleInfoPill'
import type { TrainingRequestRow, TrainingRequestStatus } from '@/utils/trainingRequests'

export function academyTrainingStatusPill(status: TrainingRequestStatus): {
  label: string
  tone: AppleInfoPillTone
} {
  switch (status) {
    case 'pending':
      return { label: 'Under review', tone: 'neutral' }
    case 'approved':
      return { label: 'Approved', tone: 'success' }
    case 'payment_pending':
      return { label: 'Payment due', tone: 'warning' }
    case 'paid':
      return { label: 'Paid', tone: 'info' }
    case 'declined':
      return { label: 'Not approved', tone: 'error' }
    case 'cancelled':
      return { label: 'Cancelled', tone: 'neutral' }
    default:
      return { label: 'Closed', tone: 'neutral' }
  }
}

type AcademyTrainingRequestCardProps = {
  row: TrainingRequestRow
  onPaymentClick?: (row: TrainingRequestRow) => void
  className?: string
}

export function AcademyTrainingRequestCard({ row, onPaymentClick, className }: AcademyTrainingRequestCardProps) {
  const { label, tone } = academyTrainingStatusPill(row.status)

  return (
    <div
      className={cn(
        'rounded-2xl border border-carbon-200/80 bg-white px-4 py-3.5 shadow-sm sm:px-5 sm:py-4',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <AppleInfoPill label={label} tone={tone} />
      </div>
      <p className="mt-2.5 text-sm font-semibold leading-snug text-[#171717]">{row.session_label}</p>
      <p
        className="mt-1 block max-w-full min-w-0 break-all font-mono text-[11px] text-[#6B6B6B] [overflow-wrap:anywhere]"
        title={row.reference}
      >
        Ref. {row.reference}
      </p>
      {row.status === 'payment_pending' && row.payment_instructions ? (
        <div className="mt-3 rounded-xl border border-orange-200/80 bg-[#fafafa] px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-orange-800/90">Instructions</p>
          <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-[#4A4A4A]">{row.payment_instructions}</p>
        </div>
      ) : null}
      {row.status === 'payment_pending' && onPaymentClick ? (
        <div className="mt-3">
          <button
            type="button"
            onClick={() => onPaymentClick(row)}
            className={cn(
              'inline-flex w-full items-center justify-center rounded-full bg-[#0485F7] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0366c7] sm:w-auto',
            )}
          >
            Confirm your place
          </button>
        </div>
      ) : null}
    </div>
  )
}

type AcademyTrainingRequestsEmptyProps = {
  className?: string
}

export function AcademyTrainingRequestsEmpty({ className }: AcademyTrainingRequestsEmptyProps) {
  return (
    <div className={cn('text-sm leading-relaxed text-[#4A4A4A]', className)}>
      <p>You don&apos;t have a training request on file. Submit a request for a future session — no payment on the form; Fireball Canada will approve or decline by email.</p>
      <div className="mt-4">
        <Link to="/academy?joinTraining=1" className={cn('inline-flex justify-center', appleButtonClassName)}>
          Open Academy
        </Link>
      </div>
    </div>
  )
}
