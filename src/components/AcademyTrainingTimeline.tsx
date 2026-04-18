import type { TrainingRequestStatus } from '@/utils/trainingRequests'
import { cn } from '@/lib/utils'

function IconPlaneTakeoff({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 22h20" />
      <path d="M6.36 17.4 4 17l-2-4 1.1-.55a2 2 0 0 1 1.8 0l.17.1a2 2 0 0 0 1.8 0L8 12 5 6l.9-.45a2 2 0 0 1 2.09.2l4.02 3a2 2 0 0 0 2.1.2l4.19-2.06a2.41 2.41 0 0 1 1.73-.17L21 7a1.4 1.4 0 0 1 .87 1.99l-.38.76c-.23.46-.6.84-1.07 1.08L7.58 17.2a2 2 0 0 1-1.22.18Z" />
    </svg>
  )
}

function IconPlaneLanding({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M2 22h20" />
      <path d="M3.77 10.77 2 9l2-4.5 1.1.55c.55.28.9.84.9 1.45s.35 1.17.9 1.45L8 8.5l3-6 1.05.53a2 2 0 0 1 1.09 1.52l.72 5.4a2 2 0 0 0 1.09 1.52l4.4 2.2c.42.22.78.55 1.01.96l.6 1.03c.49.88-.06 1.98-1.06 2.1l-1.18.15c-.47.06-.95-.02-1.37-.24L4.29 11.15a2 2 0 0 1-.52-.38Z" />
    </svg>
  )
}

function IconCreditCard({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  )
}

function IconPackageCheck({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 22V12" />
      <path d="m16 17 2 2 4-4" />
      <path d="M21 11.127V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.729l7 4a2 2 0 0 0 2 .001l1.32-.753" />
      <path d="M3.29 7 12 12l8.71-5" />
      <path d="m7.5 4.27 8.997 5.148" />
    </svg>
  )
}

const STEPS = [
  { key: 'submitted', label: 'Request sent', Icon: IconPlaneTakeoff },
  { key: 'accepted', label: 'Accepted', Icon: IconPlaneLanding },
  { key: 'payment', label: 'Payment', Icon: IconCreditCard },
  { key: 'ready', label: 'All set', Icon: IconPackageCheck },
] as const

type StepVisual = 'done' | 'current' | 'upcoming' | 'error'

function stepsForStatus(status: TrainingRequestStatus): StepVisual[] {
  switch (status) {
    case 'pending':
      return ['done', 'current', 'upcoming', 'upcoming']
    case 'approved':
      return ['done', 'done', 'current', 'upcoming']
    case 'payment_pending':
      return ['done', 'done', 'current', 'upcoming']
    case 'paid':
      return ['done', 'done', 'done', 'done']
    case 'declined':
      return ['done', 'error', 'upcoming', 'upcoming']
    case 'cancelled':
      return ['done', 'error', 'upcoming', 'upcoming']
    default:
      return ['current', 'upcoming', 'upcoming', 'upcoming']
  }
}

function circleClass(visual: StepVisual): string {
  return cn(
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-white shadow-sm',
    visual === 'done' && 'border-[#d42b2b] text-[#d42b2b]',
    visual === 'current' && 'border-[#d42b2b] text-[#d42b2b] ring-2 ring-[#d42b2b]/25',
    visual === 'upcoming' && 'border-[#D0D0D0] text-[#9CA3AF]',
    visual === 'error' && 'border-red-400 text-red-600',
  )
}

/** Trait entre deux étapes : rouge Fireball si l’étape de gauche est terminée. */
function connectorClass(leftVisual: StepVisual): string {
  return leftVisual === 'done' ? 'bg-[#d42b2b]' : 'bg-[#D8D8D8]'
}

export function AcademyTrainingTimeline({ status }: { status: TrainingRequestStatus }) {
  const states = stepsForStatus(status)

  return (
    <div className="mt-5 w-full min-w-0" aria-label="Training request progress">
      <div className="grid w-full grid-cols-4 gap-x-0 min-[400px]:gap-x-1">
        {STEPS.map((step, i) => {
          const Icon = step.Icon
          const visual = states[i]
          return (
            <div key={step.key} className="flex min-w-0 flex-col items-stretch gap-2">
              <div className="relative flex min-h-[2rem] w-full items-center justify-center">
                {i > 0 ? (
                  <div
                    className={cn(
                      'pointer-events-none absolute left-0 top-1/2 z-0 h-[2px] w-[calc(50%-0.875rem)] -translate-y-1/2 rounded-l-full',
                      connectorClass(states[i - 1]),
                    )}
                    aria-hidden
                  />
                ) : null}
                {i < STEPS.length - 1 ? (
                  <div
                    className={cn(
                      'pointer-events-none absolute right-0 top-1/2 z-0 h-[2px] w-[calc(50%-0.875rem)] -translate-y-1/2 rounded-r-full',
                      connectorClass(states[i]),
                    )}
                    aria-hidden
                  />
                ) : null}
                <div className={cn('relative z-10', circleClass(visual))}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
              </div>
              <p
                className={cn(
                  'w-full px-0.5 text-center text-[8px] font-bold uppercase leading-tight tracking-[0.06em] sm:text-[9px] sm:tracking-[0.08em]',
                  visual === 'done' && 'text-[#9f2323]',
                  visual === 'current' && 'text-[#d42b2b]',
                  visual === 'upcoming' && 'text-[#8A8A8A]',
                  visual === 'error' && 'text-red-700',
                )}
              >
                {step.label}
                {visual === 'error' && step.key === 'accepted' ? (
                  <span className="mt-0.5 block font-normal normal-case text-red-600">Not approved</span>
                ) : null}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
