import { useCallback, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react'
import { Link } from 'react-router-dom'

function setApplyClipVars(el: HTMLAnchorElement, clientX: number, clientY: number) {
  const rect = el.getBoundingClientRect()
  const w = rect.width || 1
  const h = rect.height || 1
  const localX = clientX - rect.left
  const localY = clientY - rect.top
  const x = (localX / w) * 100
  const y = (localY / h) * 100

  // Rayon max pour recouvrir tout le bouton depuis le point du curseur
  const d1 = Math.hypot(localX, localY)
  const d2 = Math.hypot(w - localX, localY)
  const d3 = Math.hypot(localX, h - localY)
  const d4 = Math.hypot(w - localX, h - localY)
  const r = Math.max(d1, d2, d3, d4)

  el.style.setProperty('--clip-x', `${x}%`)
  el.style.setProperty('--clip-y', `${y}%`)
  el.style.setProperty('--clip-r', `${r}px`)
}

const applyLinkCssVars = {
  '--clip-x': '50%',
  '--clip-y': '50%',
  '--clip-r': '0px',
} as CSSProperties

export function JoinFireball() {
  const [applyHover, setApplyHover] = useState(false)

  const onApplyPointerEnter = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setApplyClipVars(e.currentTarget, e.clientX, e.clientY)
    setApplyHover(true)
  }, [])

  const onApplyPointerMove = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setApplyClipVars(e.currentTarget, e.clientX, e.clientY)
  }, [])

  const onApplyPointerLeave = useCallback((e: ReactPointerEvent<HTMLAnchorElement>) => {
    setApplyClipVars(e.currentTarget, e.clientX, e.clientY)
    setApplyHover(false)
  }, [])

  return (
    <section className="min-h-screen bg-black">
      <div className="relative w-full min-h-[92vh]">
        <img
          src="/join-fireball-hero.jpg"
          alt="Join Fireball"
          className="absolute inset-0 w-full h-full object-cover"
          draggable={false}
        />
        <div className="absolute inset-0 bg-black/20" aria-hidden />

        <div className="relative z-10 h-full w-full flex items-center justify-center px-6 pt-20 pb-10">
          <div className="w-full max-w-3xl text-center">
            <h1 className="font-nav font-bold text-4xl md:text-6xl tracking-tight text-white">
              Join Fireball
            </h1>
            <p className="mt-4 text-silver/80 text-lg md:text-xl max-w-2xl mx-auto">
              Build more than a business
            </p>

            <div className="mt-10 flex items-center justify-center">
              <Link
                to="/join"
                className="relative inline-flex items-center justify-center overflow-hidden rounded-xl border border-white/[0.12] bg-transparent px-8 py-2.5 text-sm font-nav font-bold uppercase transition-[border-color,color] duration-500 ease-out hover:border-white/25 motion-reduce:transition-none"
                style={applyLinkCssVars}
                onPointerEnter={onApplyPointerEnter}
                onPointerMove={onApplyPointerMove}
                onPointerLeave={onApplyPointerLeave}
              >
                <span
                  className="pointer-events-none absolute inset-0 z-0 bg-white"
                  style={{
                    clipPath: `circle(${applyHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    WebkitClipPath: `circle(${applyHover ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
                    transition:
                      'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
                    willChange: 'clip-path',
                  }}
                  aria-hidden
                />
                <span
                  className={`relative z-10 transition-colors duration-500 motion-reduce:duration-200 ${applyHover ? 'text-black' : 'text-pearl'}`}
                >
                  Apply now
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

