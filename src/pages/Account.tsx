import { useEffect, useId, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type LoaderPhase = 'loading' | 'exiting' | 'ready'

function FlagEN() {
  const clipId = useId()
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="20" height="20" fill="#012169" />
        <path d="M0 0L20 20M20 0L0 20" stroke="white" strokeWidth="3" />
        <path d="M0 0L20 20M20 0L0 20" stroke="#C8102E" strokeWidth="1.8" />
        <path d="M10 0v20M0 10h20" stroke="white" strokeWidth="5" />
        <path d="M10 0v20M0 10h20" stroke="#C8102E" strokeWidth="3" />
      </g>
    </svg>
  )
}

function FlagFR() {
  const clipId = useId()
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="flex-shrink-0">
      <defs>
        <clipPath id={clipId}>
          <circle cx="10" cy="10" r="10" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width="6.67" height="20" fill="#002395" />
        <rect width="6.67" height="20" x="6.67" fill="#fff" />
        <rect width="6.67" height="20" x="13.33" fill="#ED2939" />
      </g>
    </svg>
  )
}

export function Account() {
  const navigate = useNavigate()
  const [phase, setPhase] = useState<LoaderPhase>('loading')
  const [loaderEntered, setLoaderEntered] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [lang, setLang] = useState<'EN' | 'FR'>('EN')
  const langMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const fromNav = sessionStorage.getItem('accountIntroFromNav') === '1'
    if (fromNav) {
      sessionStorage.removeItem('accountIntroFromNav')
    }

    const randomDuration = 1000 + Math.floor(Math.random() * 1001)
    const introTimer = window.setTimeout(() => setLoaderEntered(true), 10)

    const waitMs = (ms: number) =>
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms)
      })

    const waitForDocumentReady = () =>
      new Promise<void>((resolve) => {
        if (document.readyState === 'complete') {
          resolve()
          return
        }
        const onLoad = () => {
          window.removeEventListener('load', onLoad)
          resolve()
        }
        window.addEventListener('load', onLoad)
      })

    const waitForFonts = async () => {
      const fontsApi = (document as Document & { fonts?: { ready?: Promise<unknown> } }).fonts
      if (fontsApi?.ready) {
        await fontsApi.ready
      }
    }

    const waitForLogoDecode = async () => {
      const img = new Image()
      img.src = '/LogoFull.avif'
      try {
        if (typeof img.decode === 'function') {
          await img.decode()
        }
      } catch {
        // Ignore decode failures in older browsers.
      }
    }

    let isMounted = true
    const run = async () => {
      await Promise.all([
        waitMs(randomDuration),
        Promise.all([waitForDocumentReady(), waitForFonts(), waitForLogoDecode()]),
      ])
      if (!isMounted) return
      setPhase('exiting')
      await waitMs(450)
      if (!isMounted) return
      setPhase('ready')
    }
    void run()

    return () => {
      isMounted = false
      window.clearTimeout(introTimer)
    }
  }, [])

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!langOpen) return
      const target = event.target as Node
      if (langMenuRef.current && !langMenuRef.current.contains(target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [langOpen])

  const loaderHidden = phase === 'exiting' || phase === 'ready'

  return (
    <section className="relative min-h-screen overflow-hidden bg-carbon-950">
      <div
        className={`fixed inset-0 z-[120] flex items-center justify-center bg-black transition-all duration-700 ease-in-out ${
          loaderHidden
            ? '-translate-y-full opacity-0'
            : loaderEntered
              ? 'translate-y-0 opacity-100'
              : 'translate-y-full opacity-100'
        }`}
        aria-hidden={loaderHidden}
      >
        <div className="relative inline-flex flex-col items-center justify-center">
          <div className="relative inline-flex items-center justify-center">
            <img src="/LogoFull.avif" alt="Fireball" draggable={false} className="h-7 w-auto object-contain loader-logo-ghost pointer-events-none select-none" />
            <img src="/LogoFull.avif" alt="" aria-hidden draggable={false} className="h-7 w-auto object-contain loader-logo-light-pass pointer-events-none select-none" />
          </div>
        </div>
        <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-carbon-800/80 text-xs">
          Protection, Perfected.
        </p>
      </div>

      <div
        className={`relative z-10 max-w-lg mx-auto px-6 py-16 transition-all duration-500 ${
          phase === 'ready' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'
        }`}
      >
        <div className="fixed top-5 left-5 z-30">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-carbon-700 text-silver hover:text-white hover:border-carbon-500 transition-colors"
            aria-label="Go back"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="fixed top-5 right-5 z-30" ref={langMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-nav font-bold text-silver hover:text-white transition-colors bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
              aria-expanded={langOpen}
            >
              {lang === 'EN' ? <FlagEN /> : <FlagFR />}
              {lang}
              <svg className={`w-3.5 h-3.5 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {langOpen && (
              <div className="absolute top-full right-0 mt-2 w-36 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-2xl shadow-[0_18px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.24)] p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setLang('EN')
                    setLangOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-nav font-bold text-silver hover:bg-white/10 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FlagEN />
                  English
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLang('FR')
                    setLangOpen(false)
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-nav font-bold text-silver hover:bg-white/10 hover:text-white transition-colors inline-flex items-center gap-2"
                >
                  <FlagFR />
                  Francais
                </button>
              </div>
            )}
          </div>
        </div>

        <section className="rounded-3xl border border-carbon-700 bg-carbon-900/75 backdrop-blur-sm p-8 md:p-10 shadow-2xl mt-10">
          <h1 className="font-nav font-bold text-4xl text-pearl uppercase mb-8 text-center">FIREBALL ACCESS</h1>
          <form className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-nav font-bold uppercase text-silver mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="w-full px-4 py-3 bg-carbon-950 border border-carbon-600 rounded-xl text-pearl focus:outline-none focus:border-chrome transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-nav font-bold uppercase text-silver mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                className="w-full px-4 py-3 bg-carbon-950 border border-carbon-600 rounded-xl text-pearl focus:outline-none focus:border-chrome transition-colors"
                placeholder="••••••••"
              />
            </div>

            <label className="inline-flex items-center gap-2.5 text-sm text-silver/80 select-none cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded border-carbon-500 bg-carbon-950 text-chrome focus:ring-0" />
              Remember this device
            </label>

            <button
              type="button"
              className="w-full py-3 bg-white text-carbon-950 font-nav font-bold uppercase text-sm rounded-xl hover:bg-white/95 transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.95),inset_0_-8px_14px_rgba(0,0,0,0.08),0_10px_24px_rgba(0,0,0,0.22)]"
            >
              Access Portal →
            </button>

            <button
              type="button"
              className="block mx-auto text-sm text-silver/70 hover:text-pearl transition-colors"
            >
              Forgot your credentials?
            </button>

            <p className="text-center text-sm text-silver/60">
              New here?{' '}
              <Link to="/account/register" className="text-[#C8102E] hover:text-[#E23854] transition-colors">
                Create an account
              </Link>
            </p>
          </form>
        </section>
      </div>
    </section>
  )
}
