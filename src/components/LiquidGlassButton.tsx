import { useRef, useState, useCallback } from 'react'

interface LiquidGlassButtonProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

/**
 * Bouton "Liquid Glass" style iOS 18/26 :
 * - Verre (backdrop-filter, fond semi-transparent)
 * - Réfraction via feDisplacementMap
 * - Profondeur (box-shadow, bordure dégradé)
 * - Hover : scale + éclat qui suit la souris
 * - Active : pression tactile
 */
export function LiquidGlassButton({
  children,
  className = '',
  onClick,
  type = 'button',
}: LiquidGlassButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null)
  const [mouse, setMouse] = useState({ x: 50, y: 50 })

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      const el = btnRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      setMouse({ x, y })
    },
    []
  )

  const handleMouseLeave = useCallback(() => {
    setMouse({ x: 50, y: 50 })
  }, [])

  return (
    <>
      {/* Filtre SVG pour la réfraction (courbure du verre liquide) */}
      <svg aria-hidden="true" className="absolute w-0 h-0 overflow-hidden" focusable="false">
        <defs>
          <filter
            id="liquid-glass-refract"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.04"
              numOctaves="2"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="4"
              xChannelSelector="R"
              yChannelSelector="G"
              result="refracted"
            />
            <feMerge>
              <feMergeNode in="refracted" />
            </feMerge>
          </filter>
        </defs>
      </svg>

      <style>{`
        .liquid-glass-btn {
          --mouse-x: 50%;
          --mouse-y: 50%;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.875rem 1.75rem;
          font-size: 0.9375rem;
          font-weight: 600;
          color: rgba(255, 255, 255, 0.95);
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid transparent;
          border-radius: 14px;
          cursor: pointer;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1),
                      box-shadow 0.25s ease,
                      filter 0.2s ease;
          -webkit-backdrop-filter: blur(25px) saturate(180%);
          backdrop-filter: blur(25px) saturate(180%);
          box-shadow:
            inset 0 1px 0 0 rgba(255, 255, 255, 0.12),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.06),
            0 4px 24px rgba(0, 0, 0, 0.15);
        }
        .liquid-glass-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            160deg,
            rgba(255, 255, 255, 0.25) 0%,
            rgba(255, 255, 255, 0.04) 45%,
            rgba(255, 255, 255, 0.02) 100%
          );
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .liquid-glass-btn::after {
          content: '';
          position: absolute;
          left: var(--mouse-x, 50%);
          top: var(--mouse-y, 50%);
          width: 120%;
          height: 120%;
          transform: translate(-50%, -50%);
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.15) 0%,
            rgba(255, 255, 255, 0.04) 35%,
            transparent 60%
          );
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .liquid-glass-btn:hover {
          transform: scale(1.03);
          box-shadow:
            inset 0 1px 0 0 rgba(255, 255, 255, 0.18),
            inset 0 -1px 0 0 rgba(0, 0, 0, 0.06),
            0 8px 32px rgba(0, 0, 0, 0.2);
        }
        .liquid-glass-btn:hover::after {
          opacity: 1;
        }
        .liquid-glass-btn:active {
          transform: scale(0.98);
          filter: saturate(0.85);
          box-shadow:
            inset 0 1px 0 0 rgba(255, 255, 255, 0.06),
            inset 0 2px 8px rgba(0, 0, 0, 0.12),
            0 2px 12px rgba(0, 0, 0, 0.18);
        }
      `}</style>

      <button
        ref={btnRef}
        type={type}
        className={`liquid-glass-btn ${className}`}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={
          {
            '--mouse-x': `${mouse.x}%`,
            '--mouse-y': `${mouse.y}%`,
            filter: 'url(#liquid-glass-refract)',
          } as React.CSSProperties
        }
      >
        <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
      </button>
    </>
  )
}
