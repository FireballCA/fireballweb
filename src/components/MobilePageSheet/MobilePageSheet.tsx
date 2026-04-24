import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface MobilePageSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children?: React.ReactNode
}

const EASE = 'cubic-bezier(0.4,0,0.2,1)'
const DUR_MS = 380
const DUR = `${DUR_MS}ms`
const DISMISS_THRESHOLD = 80 // px dragged down to auto-dismiss

export function MobilePageSheet({ isOpen, onClose, title, children }: MobilePageSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  // Keep rendered during close animation
  const [mounted, setMounted] = useState(isOpen)

  // Touch drag state
  const touchStartYRef = useRef(0)
  const dragYRef = useRef(0)

  // Animate to a Y offset, returns promise that resolves after transition
  const animateTo = (y: number, animated: boolean) => {
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    if (!sheet || !overlay) return
    sheet.style.transition = animated ? `transform ${DUR} ${EASE}` : 'none'
    sheet.style.transform = `translateY(${y}px)`
    const progress = Math.min(1, Math.max(0, y / window.innerHeight))
    overlay.style.transition = animated ? `opacity ${DUR} ${EASE}` : 'none'
    overlay.style.opacity = `${1 - progress}`
  }

  useEffect(() => {
    if (isOpen) {
      setMounted(true)
    }
  }, [isOpen])

  // Run enter/exit animation after mount
  useEffect(() => {
    if (!mounted) return
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    if (!sheet || !overlay) return

    if (isOpen) {
      // Start off-screen, animate in
      sheet.style.transition = 'none'
      sheet.style.transform = 'translateY(100%)'
      overlay.style.transition = 'none'
      overlay.style.opacity = '0'

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          animateTo(0, true)
        })
      })
    } else {
      // Animate out, then unmount
      animateTo(window.innerHeight, true)
      const timer = setTimeout(() => setMounted(false), DUR_MS + 20)
      return () => clearTimeout(timer)
    }
  }, [isOpen, mounted])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY
    dragYRef.current = 0
    const sheet = sheetRef.current
    const overlay = overlayRef.current
    if (sheet) sheet.style.transition = 'none'
    if (overlay) overlay.style.transition = 'none'
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const dy = e.touches[0].clientY - touchStartYRef.current
    const clamped = Math.max(0, dy) // only allow dragging down
    dragYRef.current = clamped
    animateTo(clamped, false)
  }

  const handleTouchEnd = () => {
    if (dragYRef.current > DISMISS_THRESHOLD) {
      // Dismiss
      animateTo(window.innerHeight, true)
      const timer = setTimeout(() => onClose(), DUR_MS)
      // cleanup handled by parent re-render
      return () => clearTimeout(timer)
    } else {
      // Snap back
      animateTo(0, true)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[100] lg:hidden" style={{ touchAction: 'none' }}>
      {/* Dimmed overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.45)', opacity: 0 }}
        onClick={onClose}
      />

      {/* White sheet — slides from bottom, ~90% height */}
      <div
        ref={sheetRef}
        className="absolute left-0 right-0 bottom-0 bg-white"
        style={{
          height: '90dvh',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          transform: 'translateY(100%)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Handle bar — tap or drag down to close */}
        <div
          className="flex justify-center pt-3 pb-2 shrink-0 select-none"
          style={{ cursor: 'grab', touchAction: 'none' }}
          onClick={onClose}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="rounded-full bg-neutral-300"
            style={{ width: 40, height: 5 }}
          />
        </div>

        {/* Title */}
        <div className="px-5 pb-4 shrink-0">
          <h2
            className="font-nav font-semibold text-neutral-900"
            style={{ fontSize: 20 }}
          >
            {title}
          </h2>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto" style={{ touchAction: 'pan-y' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}
