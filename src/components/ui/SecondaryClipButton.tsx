import { useCallback, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { clipRevealCssVars, setClipRevealVars } from '@/lib/clipReveal'
import { cn } from '@/lib/utils'

/** Style Fireball du bouton secondaire (hero Academy) : pill, bordure claire, effet cercle au survol. */
export const secondaryClipButtonClassName =
  'relative inline-flex items-center justify-center overflow-hidden rounded-full border border-white/[0.12] bg-transparent px-4 py-2 text-xs font-semibold whitespace-nowrap transition-[border-color,color] duration-500 ease-out hover:border-white/25 motion-reduce:transition-none outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none'

const clipFillStyle = (active: boolean) =>
  ({
    clipPath: `circle(${active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
    WebkitClipPath: `circle(${active ? 'var(--clip-r, 0px)' : '0px'} at var(--clip-x, 50%) var(--clip-y, 50%))`,
    transition:
      'clip-path 900ms cubic-bezier(0.22,1,0.36,1), -webkit-clip-path 900ms cubic-bezier(0.22,1,0.36,1)',
    willChange: 'clip-path',
  }) as const

type BaseProps = {
  className?: string
  children: React.ReactNode
  idleTextClass?: string
  hoverTextClass?: string
}

type SecondaryClipButtonProps = BaseProps &
  (
    | ({ to: string } & Omit<LinkProps, 'to' | 'className' | 'children'>)
    | ({ href: string } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className' | 'children'>)
    | (Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> & {
        to?: undefined
        href?: undefined
      })
  )

export function SecondaryClipButton(props: SecondaryClipButtonProps) {
  const {
    className,
    children,
    idleTextClass = 'text-pearl',
    hoverTextClass = 'text-black',
  } = props

  const [hover, setHover] = useState(false)
  const [focus, setFocus] = useState(false)
  const active = hover || focus

  const onPointerEnter = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setHover(true)
  }, [])

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
  }, [])

  const onPointerLeave = useCallback((e: ReactPointerEvent<HTMLElement>) => {
    setClipRevealVars(e.currentTarget, e.clientX, e.clientY)
    setHover(false)
  }, [])

  const onFocus = useCallback(() => {
    setFocus(true)
  }, [])

  const onBlur = useCallback(() => {
    setFocus(false)
  }, [])

  const inner = (
    <>
      <span
        className="pointer-events-none absolute inset-0 z-0 bg-white"
        style={clipFillStyle(active)}
        aria-hidden
      />
      <span
        className={cn(
          'relative z-10 transition-colors duration-500 motion-reduce:duration-200',
          active ? hoverTextClass : idleTextClass,
        )}
      >
        {children}
      </span>
    </>
  )

  const merged = cn(secondaryClipButtonClassName, className)

  if ('to' in props && props.to !== undefined) {
    const {
      to,
      children: _ch,
      className: _cl,
      idleTextClass: _i,
      hoverTextClass: _h,
      ...linkRest
    } = props as Extract<SecondaryClipButtonProps, { to: string }>
    return (
      <Link
        to={to}
        {...linkRest}
        className={merged}
        style={clipRevealCssVars}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {inner}
      </Link>
    )
  }

  if ('href' in props && props.href !== undefined) {
    const {
      href,
      children: _ch,
      className: _cl,
      idleTextClass: _i,
      hoverTextClass: _h,
      ...aRest
    } = props as Extract<SecondaryClipButtonProps, { href: string }>
    return (
      <a
        href={href}
        {...aRest}
        className={merged}
        style={clipRevealCssVars}
        onPointerEnter={onPointerEnter}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onFocus={onFocus}
        onBlur={onBlur}
      >
        {inner}
      </a>
    )
  }

  const {
    children: _ch,
    className: _cl,
    idleTextClass: _i,
    hoverTextClass: _h,
    type = 'button',
    ...buttonRest
  } = props as React.ButtonHTMLAttributes<HTMLButtonElement> & BaseProps

  return (
    <button
      type={type}
      {...buttonRest}
      className={merged}
      style={clipRevealCssVars}
      onPointerEnter={onPointerEnter}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      onFocus={onFocus}
      onBlur={onBlur}
    >
      {inner}
    </button>
  )
}
