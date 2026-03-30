import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export type LineupTransitionRect = {
  top: number
  left: number
  width: number
  height: number
}

type Session = {
  id: number
  to: string
  imageSrc: string
  rect: LineupTransitionRect
}

export type LineupImageTransitionContextValue = {
  startLineupImageTransition: (args: {
    to: string
    imageSrc: string
    rect: DOMRectReadOnly | LineupTransitionRect
  }) => void
}

const LineupImageTransitionContext = createContext<LineupImageTransitionContextValue | null>(
  null,
)

const expandEase = [0.14, 0.99, 0.23, 1] as const
const EXPAND_MS = 0.72
const NAVIGATE_AT_MS = 380
const FADE_OUT_MS = 0.34

function rectToPlain(r: DOMRectReadOnly | LineupTransitionRect): LineupTransitionRect {
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
  }
}

function LineupTransitionPortal({
  session,
  onFinished,
  userWantsReducedMotion,
}: {
  session: Session
  onFinished: () => void
  userWantsReducedMotion: boolean
}) {
  const navigate = useNavigate()
  const navigatedRef = useRef(false)
  const [fadeOut, setFadeOut] = useState(userWantsReducedMotion)

  const { to, imageSrc, rect } = session
  const vw = typeof window !== 'undefined' ? window.innerWidth : rect.width
  const vh = typeof window !== 'undefined' ? window.innerHeight : rect.height

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    if (userWantsReducedMotion) {
      if (!navigatedRef.current) {
        navigatedRef.current = true
        void navigate(to)
      }
      onFinished()
      return
    }

    const t = window.setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true
        void navigate(to)
      }
    }, NAVIGATE_AT_MS)
    return () => clearTimeout(t)
  }, [navigate, onFinished, to, userWantsReducedMotion])

  const onExpandComplete = () => {
    if (userWantsReducedMotion) return
    setFadeOut(true)
  }

  const fadeOutRef = useRef(false)
  useEffect(() => {
    fadeOutRef.current = fadeOut
  }, [fadeOut])

  if (userWantsReducedMotion) {
    return null
  }

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={session.id}
        className="fixed inset-0 z-[400]"
        initial={{ opacity: 1 }}
        animate={{ opacity: fadeOut ? 0 : 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2 } }}
        transition={{ duration: FADE_OUT_MS, ease: [0.28, 0, 0.18, 1] }}
        onAnimationComplete={() => {
          if (fadeOutRef.current) onFinished()
        }}
        style={{ pointerEvents: fadeOut ? 'none' : 'auto' }}
        aria-hidden
      >
        <motion.div
          className="fixed z-0 overflow-hidden will-change-[top,left,width,height,border-radius]"
          initial={{
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 24,
          }}
          animate={{
            top: 0,
            left: 0,
            width: vw,
            height: vh,
            borderRadius: 0,
          }}
          transition={{
            duration: EXPAND_MS,
            ease: expandEase,
          }}
          onAnimationComplete={onExpandComplete}
        >
          <motion.img
            src={imageSrc}
            alt=""
            draggable={false}
            className="h-full w-full object-cover select-none"
            initial={{ scale: 1 }}
            animate={{ scale: 1.04 }}
            transition={{ duration: EXPAND_MS + 0.08, ease: expandEase }}
          />
        </motion.div>
        <motion.div
          className="pointer-events-none fixed inset-0 z-[1] bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: fadeOut ? 0 : 0.12 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          aria-hidden
        />
      </motion.div>
    </AnimatePresence>,
    document.body,
  )
}

export function LineupImageTransitionProvider({ children }: { children: ReactNode }) {
  const globalReduce = useReducedMotion()
  const [session, setSession] = useState<Session | null>(null)
  const busyRef = useRef(false)
  const idRef = useRef(0)

  const finish = useCallback(() => {
    setSession(null)
    busyRef.current = false
  }, [])

  const startLineupImageTransition = useCallback(
    (args: { to: string; imageSrc: string; rect: DOMRectReadOnly | LineupTransitionRect }) => {
      if (busyRef.current) return
      busyRef.current = true
      idRef.current += 1
      setSession({
        id: idRef.current,
        to: args.to,
        imageSrc: args.imageSrc,
        rect: rectToPlain(args.rect),
      })
    },
    [],
  )

  const value = useMemo(
    () => ({ startLineupImageTransition }),
    [startLineupImageTransition],
  )

  return (
    <LineupImageTransitionContext.Provider value={value}>
      {children}
      {session && (
        <LineupTransitionPortal
          session={session}
          onFinished={finish}
          userWantsReducedMotion={!!globalReduce}
        />
      )}
    </LineupImageTransitionContext.Provider>
  )
}

export function useLineupImageTransition(): LineupImageTransitionContextValue | null {
  return useContext(LineupImageTransitionContext)
}
