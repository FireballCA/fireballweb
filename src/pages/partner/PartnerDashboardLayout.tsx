import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'
import { useEffect } from 'react'

const navItems = [
  { to: '/partner/dashboard', end: true, label: 'Overview' },
  { to: '/partner/dashboard/clients', end: false, label: 'Clients' },
  { to: '/partner/dashboard/vehicles', end: false, label: 'Vehicles' },
  { to: '/partner/dashboard/warranties', end: false, label: 'Warranty Registrations' },
  { to: '/partner/dashboard/certification', end: false, label: 'Certification' },
  { to: '/partner/dashboard/settings', end: false, label: 'Settings' },
]

export function PartnerDashboardLayout() {
  const [companyName, setCompanyName] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile?.company_name) return
      setCompanyName(profile.company_name)
    }
    load()
    return () => { mounted = false }
  }, [])

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      <aside className="w-60 flex-shrink-0 border-r border-white/10 bg-black/40 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h1 className="text-[11px] font-nav font-bold uppercase tracking-[0.18em] text-white/50">
            Partner
          </h1>
          <p className="mt-1 text-sm font-semibold text-white truncate">
            {companyName || 'Dashboard'}
          </p>
        </div>
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white/90'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/account')
            }}
            className="w-full rounded-xl px-3 py-2.5 text-sm text-white/60 hover:bg-white/5 hover:text-white/80"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
