import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

interface AdminPanelSheetProps {
  isOpen: boolean
  onClose: () => void
}

export function AdminPanelSheet({ isOpen, onClose }: AdminPanelSheetProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [scrolledDown, setScrolledDown] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      setIsExiting(false)
      document.body.style.overflow = 'hidden'
      return
    }

    if (!isOpen && rendered) {
      setIsExiting(true)
      const timeout = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
        document.body.style.overflow = ''
      }, 400)
      return () => {
        window.clearTimeout(timeout)
        document.body.style.overflow = ''
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, rendered])

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close admin panel"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: isExiting
            ? 'adminPanelSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'adminPanelSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        {/* Header */}
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/45">
              Admin
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              Admin panel
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-6 md:px-10 pt-5 pb-8"
          onScroll={(event) => {
            const target = event.currentTarget
            setScrolledDown(target.scrollTop > 40)
          }}
        >
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 lg:gap-10">
            {/* Left column: summary */}
            <div className="w-full lg:w-[32%] flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm px-5 py-5 shadow-[0_18px_45px_rgba(0,0,0,0.45)]">
                <p className="text-[13px] font-medium text-white/80 mb-2">
                  Fireball admin overview
                </p>
                <p className="text-[12px] leading-relaxed text-white/60">
                  Quickly access partner management and global statistics from a single,
                  focused view designed for admins.
                </p>
              </div>
            </div>

            {/* Right column: admin actions */}
            <div className="w-full lg:flex-1 flex flex-col gap-4">
              <div className="rounded-3xl border border-white/[0.12] bg-white/[0.02] px-5 py-5 flex flex-col gap-3">
                <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-white/55">
                  Partner management
                </p>
                <p className="text-[13px] text-white/75">
                  Review partner companies, approve applications and adjust settings.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to="/account/manage-partners"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.2] bg-white/[0.06] px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/85 hover:bg-white/[0.14] hover:border-white/60 transition-colors"
                    onClick={onClose}
                  >
                    <span>Open admin panel</span>
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                    >
                      <path d="M7 17L17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                  <Link
                    to="/account/manage-partners#global-statistics"
                    className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-transparent px-4 py-2 text-[11px] font-nav uppercase tracking-[0.16em] text-white/70 hover:bg-white/[0.08] transition-colors"
                    onClick={onClose}
                  >
                    <span>View global stats</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <div className="pb-5 lg:hidden pointer-events-none flex justify-end pr-6">
          <button
            type="button"
            onClick={onClose}
            className={`pointer-events-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.18] bg-white/[0.08] backdrop-blur-md text-white/80 hover:bg-white/[0.16] hover:text-white transition-all duration-300 ease-in-out overflow-hidden ${
              scrolledDown
                ? 'w-11 h-11 px-0'
                : 'w-full max-w-[260px] px-4 py-3 text-sm font-nav font-bold uppercase tracking-[0.16em]'
            }`}
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
            >
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span
              className={`transition-all duration-300 ease-in-out whitespace-nowrap ${
                scrolledDown ? 'opacity-0 max-w-0 ml-0' : 'opacity-100 max-w-[200px] ml-1'
              }`}
            >
              Close
            </span>
          </button>
        </div>
      </div>
      <style>{`
        @keyframes adminPanelSlideUp {
          from {
            transform: translateY(100%);
            opacity: 0.98;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes adminPanelSlideDown {
          from {
            transform: translateY(0);
            opacity: 1;
          }
          to {
            transform: translateY(100%);
            opacity: 0.98;
          }
        }
      `}</style>
    </div>
  )
}

