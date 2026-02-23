import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { getCurrentAccount } from '@/utils/accountAuth'

export function AccountDashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const [fullName, setFullName] = useState('')
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [welcomeLineVisible, setWelcomeLineVisible] = useState(false)
  const [subtitleVisible, setSubtitleVisible] = useState(false)
  const [enterButtonVisible, setEnterButtonVisible] = useState(false)
  const [showDashboard, setShowDashboard] = useState(false)

  useEffect(() => {
    const account = getCurrentAccount()
    if (!account) {
      navigate('/account', { replace: true })
      return
    }

    setFullName(account.fullName)
    const state = location.state as { fromRegister?: boolean; welcomeName?: string } | null
    const shouldShowWelcome = state?.fromRegister === true && Boolean(state.welcomeName)
    if (!shouldShowWelcome) {
      setShowDashboard(true)
      return
    }
    setWelcomeName(state?.welcomeName ?? account.fullName)

    const lineTimer = window.setTimeout(() => setWelcomeLineVisible(true), 120)
    const subtitleTimer = window.setTimeout(() => setSubtitleVisible(true), 2600)
    const ctaTimer = window.setTimeout(() => setEnterButtonVisible(true), 3400)
    const safetyTimer = window.setTimeout(() => setShowDashboard(true), 20000)

    return () => {
      window.clearTimeout(lineTimer)
      window.clearTimeout(subtitleTimer)
      window.clearTimeout(ctaTimer)
      window.clearTimeout(safetyTimer)
    }
  }, [location.state, navigate])

  const showWelcomeScreen = welcomeName !== null && !showDashboard
  const nameParts = (welcomeName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]) || 'Member'
  const currentXp = 2450
  const targetXp = 4000
  const xpToGo = Math.max(targetXp - currentXp, 0)
  const progressPercent = Math.min((currentXp / targetXp) * 100, 100)

  return (
    <section className="relative min-h-screen bg-carbon-950 text-pearl overflow-hidden">
      {showWelcomeScreen && (
        <div className="fixed inset-0 z-[130] bg-black">
          <div className="h-full w-full flex items-center justify-center px-6">
            <div className="text-center">
              <h1
                className="font-nav font-bold text-5xl md:text-6xl text-white"
                style={{
                  clipPath: welcomeLineVisible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transform: welcomeLineVisible ? 'translateX(0)' : 'translateX(-22px)',
                  opacity: welcomeLineVisible ? 1 : 0.2,
                  transition:
                    'clip-path 2400ms cubic-bezier(0.22, 1, 0.36, 1), transform 2400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1800ms ease',
                }}
              >
                Welcome, {firstName}.
              </h1>
              <p
                className={`mt-7 text-[11px] md:text-xs font-nav font-bold uppercase tracking-[0.14em] text-silver/90 transition-all duration-[1400ms] ease-out ${
                  subtitleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
              >
                Your journey into fireball network starts here.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDashboard(true)
                  setWelcomeName(null)
                }}
                className={`mt-10 inline-flex items-center justify-center rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-nav font-bold text-white transition-all duration-700 hover:bg-white/20 ${
                  enterButtonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                }`}
              >
                Access dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {showDashboard && (
        <div className="w-full pt-0 pb-14">
          <section className="relative h-[66vh] w-full px-6 md:px-10 flex flex-col overflow-hidden">
            <div className="flex-1 flex flex-col items-center justify-start pt-24 md:pt-28 px-2">
              <div className="relative inline-block">
                <p className="font-nav text-white text-6xl md:text-7xl leading-none font-normal">
                  {currentXp.toLocaleString()}
                </p>
                <span className="absolute -right-7 top-1 text-[10px] md:text-xs font-nav uppercase text-silver/75">
                  xp
                </span>
              </div>

              <div className="w-full max-w-md mt-8">
                <div className="h-[4px] w-full rounded-full bg-[#c8c8c8]/35 overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-between text-[10px] md:text-xs font-nav uppercase">
                  <span className="text-white/85">
                    {currentXp.toLocaleString()} / {targetXp.toLocaleString()} XP
                  </span>
                  <span className="text-[#c8c8c8]/75">{xpToGo.toLocaleString()} XP to go</span>
                </div>
              </div>
            </div>

            <img
              src="/Account/Level Badge/Carbone.png"
              alt="Level badge carbone"
              className="absolute left-1/2 -translate-x-1/2 bottom-0 translate-y-[40%] w-[420px] md:w-[560px] z-20 pointer-events-none select-none"
              draggable={false}
            />
          </section>

          <section className="h-[40vh] w-full bg-carbon-900/65 border-t border-white/5" />
        </div>
      )}
    </section>
  )
}
