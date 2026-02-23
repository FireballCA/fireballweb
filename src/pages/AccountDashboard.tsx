import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { consumeWelcomeMessage, getCurrentAccount, logoutAccount } from '@/utils/accountAuth'

export function AccountDashboard() {
  const navigate = useNavigate()
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
    const introName = consumeWelcomeMessage() ?? account.fullName
    setWelcomeName(introName)

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
  }, [navigate])

  const showWelcomeScreen = welcomeName !== null && !showDashboard
  const nameParts = (welcomeName ?? '').trim().split(/\s+/).filter(Boolean)
  const firstName = (nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0]) || 'Member'

  return (
    <section className="relative min-h-screen bg-carbon-950 text-pearl overflow-hidden">
      {showWelcomeScreen && (
        <div className="fixed inset-0 z-[130] bg-black">
          <div className="h-full w-full flex items-center justify-center px-6">
            <div className="text-center">
              <h1
                className="text-5xl md:text-6xl text-white"
                style={{
                  fontFamily: "'Desirable Caligraphy by Alcode', 'Brush Script MT', cursive",
                  clipPath: welcomeLineVisible ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)',
                  transform: welcomeLineVisible ? 'translateX(0)' : 'translateX(-22px)',
                  opacity: welcomeLineVisible ? 1 : 0.2,
                  transition:
                    'clip-path 2400ms cubic-bezier(0.22, 1, 0.36, 1), transform 2400ms cubic-bezier(0.22, 1, 0.36, 1), opacity 1800ms ease',
                }}
              >
                Welcome, {firstName}
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
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-3xl border border-carbon-700 bg-carbon-900/75 backdrop-blur-sm p-8 shadow-2xl">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <p className="text-silver/70 text-sm uppercase font-nav font-bold">Dashboard</p>
                <h1 className="font-display text-4xl tracking-tight mt-1">Welcome, {fullName || 'Member'}</h1>
              </div>
              <button
                type="button"
                onClick={() => {
                  logoutAccount()
                  navigate('/account')
                }}
                className="px-4 py-2 rounded-xl border border-carbon-600 text-silver hover:text-white hover:border-carbon-400 transition-colors"
              >
                Log out
              </button>
            </div>

            <div className="mt-8 grid md:grid-cols-3 gap-4">
              <div className="rounded-2xl border border-carbon-700 bg-carbon-950/60 p-5">
                <p className="text-xs uppercase font-nav font-bold text-silver/70">Orders</p>
                <p className="mt-3 text-3xl font-display">0</p>
              </div>
              <div className="rounded-2xl border border-carbon-700 bg-carbon-950/60 p-5">
                <p className="text-xs uppercase font-nav font-bold text-silver/70">Saved Vehicles</p>
                <p className="mt-3 text-3xl font-display">0</p>
              </div>
              <div className="rounded-2xl border border-carbon-700 bg-carbon-950/60 p-5">
                <p className="text-xs uppercase font-nav font-bold text-silver/70">Loyalty Tier</p>
                <p className="mt-3 text-3xl font-display">Core</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
