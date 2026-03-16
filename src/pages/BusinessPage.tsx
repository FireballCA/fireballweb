import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  IconArrowLeft,
  IconChartBar,
  IconUsers,
  IconBook,
  IconShoppingBag,
  IconSettings,
  IconShieldLock,
  IconChevronRight,
  IconBell,
} from '@tabler/icons-react'
import { AdminPanelContent } from '@/components/AdminPanelSheet'
import { BusinessClientsPage } from '@/pages/business/BusinessClientsPage'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'
import { FireballLoading } from '@/components/FireballLoading'
import { cn } from '@/lib/utils'

type View = 'loading' | 'denied' | 'form' | 'dashboard'

export function BusinessPage() {
  const location = useLocation()
  const [view, setView] = useState<View>('loading')
  const [isAdmin, setIsAdmin] = useState(false)
  const [userDisplayName, setUserDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, warranties: 0 })
  const isAdminPath = location.pathname.includes('/account/business/admin')
  const isClientsPath = location.pathname.includes('/account/business/clients')
  const adminSection = location.pathname.includes('/admin/partners') ? 'partners' : location.pathname.includes('/admin/notifications') ? 'notifications' : location.pathname.includes('/admin/announcements') ? 'announcements' : 'stats'

  const [companyNameInput, setCompanyNameInput] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const auth = await isAuthenticated()
      if (!mounted) return
      if (!auth) {
        setView('denied')
        return
      }
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile) {
        setView('denied')
        return
      }
      const partnerStatus = (profile.partner_status || '').toLowerCase()
      const role = (profile.role || '').toLowerCase()
      const isPartner = role === 'partner' || partnerStatus === 'partner'
      if (!mounted) return
      setIsAdmin(role === 'admin')
      const first = (profile.first_name || '').trim()
      const last = (profile.last_name || '').trim()
      setUserDisplayName([first, last].filter(Boolean).join(' ') || profile.email || 'Account')
      if (!isPartner) {
        setView('denied')
        return
      }

      const { data: pc } = await supabase
        .from('partner_companies')
        .select('id,company_name,company_address,company_logo,phone,website,description,application_data')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()

      if (!mounted) return
      if (!pc) {
        setView('form')
        return
      }
      const row = pc as {
        id: string
        company_name: string | null
        company_address: string | null
        company_logo?: string | null
        phone?: string | null
        website?: string | null
        description?: string | null
        application_data?: { business_address?: string; phone_number?: string; website_or_social_media?: string }
      }
      setCompanyName(row.company_name || '')
      const hasProfile = !!(row.company_address != null && row.company_address !== '')
      if (hasProfile) {
        setCompanyNameInput(row.company_name || '')
        setCompanyAddress(row.company_address || '')
        setCompanyLogo(row.company_logo || '')
        setPhone(row.phone || '')
        setWebsite(row.website || '')
        setDescription(row.description || '')
        const [cRes, vRes, wRes] = await Promise.all([
          supabase.from('partner_clients').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
          supabase.from('partner_vehicles').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
          supabase.from('partner_warranties').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
        ])
        if (mounted) {
          setStats({
            clients: cRes.count ?? 0,
            vehicles: vRes.count ?? 0,
            warranties: wRes.count ?? 0,
          })
        }
        setView('dashboard')
      } else {
        setCompanyNameInput(row.company_name || '')
        const ad = row.application_data
        if (ad?.business_address) setCompanyAddress(ad.business_address)
        if (ad?.phone_number) setPhone(ad.phone_number)
        if (ad?.website_or_social_media) setWebsite(ad.website_or_social_media)
        setView('form')
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormLoading(true)
    try {
      const profile = await getCurrentUserProfile()
      if (!profile?.id) {
        setFormError('Session expired.')
        setFormLoading(false)
        return
      }
      const { error: updateError } = await supabase
        .from('partner_companies')
        .update({
          company_name: companyNameInput.trim() || null,
          company_logo: companyLogo.trim() || null,
          company_address: companyAddress.trim() || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.id)
        .eq('status', 'partner')
      if (updateError) {
        setFormError(updateError.message || 'Unable to save.')
        setFormLoading(false)
        return
      }
      setCompanyName(companyNameInput.trim())
      setStats({ clients: 0, vehicles: 0, warranties: 0 })
      setView('dashboard')
    } catch {
      setFormError('An error occurred.')
    }
    setFormLoading(false)
  }

  if (view === 'loading') return <FireballLoading />
  if (view === 'denied') return <Navigate to="/account/dashboard" replace />

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="w-full bg-black px-6 sm:px-10 py-6 sm:py-10">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">Create your business</h1>
              <p className="text-sm text-white/60">Add your company details to get started.</p>
            </div>
            {formError && (
              <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {formError}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Company name</label>
                <input
                  type="text"
                  value={companyNameInput}
                  onChange={(e) => setCompanyNameInput(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="Your company name"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Logo URL (optional)</label>
                <input
                  type="url"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Address</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="Business address"
                  required
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Phone (optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="+1..."
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Website (optional)</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-white/70 text-xs mb-2 font-medium">Description (optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444] resize-none"
                  placeholder="Short description of your business"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading}
                className="h-[40px] w-full rounded-[14px] border-none bg-[#0A84FF] px-8 text-center text-white font-semibold transition-colors hover:bg-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Saving…' : 'Save and continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const iconClass = 'h-5 w-5 shrink-0'
  const mainLinks = [
    { label: 'Statistics', href: '/account/business', icon: <IconChartBar className={iconClass} /> },
    { label: 'Clients', href: '/account/business/clients', icon: <IconUsers className={iconClass} /> },
    { label: 'Technical Library', href: '/account/business/library', icon: <IconBook className={iconClass} /> },
    { label: 'Pro Shop', href: '/account/business/shop', icon: <IconShoppingBag className={iconClass} /> },
    { label: 'Business Settings', href: '/account/business/settings', icon: <IconSettings className={iconClass} /> },
  ]
  if (isAdmin) {
    mainLinks.push({
      label: 'Admin',
      href: '/account/business/admin',
      icon: <IconShieldLock className="h-5 w-5 shrink-0 text-red-400" />,
    })
  }
  const adminSubLinks = isAdmin
    ? [
        { label: 'Stats', href: '/account/business/admin/stats', icon: <IconChartBar className="h-4 w-4 shrink-0 text-red-400" /> },
        { label: 'Partners', href: '/account/business/admin/partners', icon: <IconUsers className="h-4 w-4 shrink-0 text-red-400" /> },
        { label: 'Notifications', href: '/account/business/admin/notifications', icon: <IconBell className="h-4 w-4 shrink-0 text-red-400" /> },
        { label: 'Announcements', href: '/account/business/admin/announcements', icon: <IconBell className="h-4 w-4 shrink-0 text-red-400" /> },
      ]
    : []
  const backLink = {
    label: 'Back to dashboard',
    href: '/account/dashboard',
    icon: <IconArrowLeft className={iconClass} />,
  }
  const initialLetter = (userDisplayName || 'A').charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'business-layout flex w-full flex-1 overflow-hidden',
        'h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] bg-[#F6F8FD]'
      )}
    >
      {/* Purity-like sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
        <div className="flex items-center px-6 pt-6 pb-4 border-b border-slate-100">
          <img
            src="/Assets/FireballBuisness B.png"
            alt="Fireball Business"
            className="h-8 w-auto object-contain max-w-[180px]"
          />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
            Main
          </p>
          <div className="space-y-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          {adminSubLinks.length > 0 && (
            <>
              <p className="px-3 mt-6 mb-2 text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                Admin
              </p>
              <div className="space-y-1">
                {adminSubLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <Link
            to={backLink.href}
            className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-sm font-medium text-white hover:bg-black transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4318FF] text-sm font-semibold text-white">
                {initialLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{userDisplayName || 'Account'}</p>
                <p className="truncate text-[11px] text-slate-300">Back to main dashboard</p>
              </div>
            </div>
            <IconChevronRight className="h-4 w-4 shrink-0 text-slate-200" />
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 bg-[#F6F8FD]">
        <div className="flex h-full min-h-full w-full flex-1 flex-col gap-6 rounded-tl-3xl border border-slate-100 bg-white p-6 md:p-10 overflow-auto shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          {isAdminPath ? (
            <>
              {!isAdmin ? (
                <Navigate to="/account/business" replace />
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-[#4318FF]">
                        Admin
                      </p>
                      <h1 className="text-2xl font-semibold text-slate-900 mt-1">Admin panel</h1>
                    </div>
                  </div>
                  <AdminPanelContent section={adminSection} />
                </>
              )}
            </>
          ) : isClientsPath ? (
            <BusinessClientsPage />
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div>
                  <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">
                    Overview
                  </p>
                  <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                    {companyName || 'Your business dashboard'}
                  </h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Track your clients, vehicles and warranties in one place.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    to="/account/business/clients"
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <IconUsers className="h-4 w-4" />
                    View clients
                  </Link>
                  <Link
                    to="/account/business/settings"
                    className="inline-flex items-center gap-2 rounded-full bg-[#4318FF] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3312C8] transition-colors"
                  >
                    <IconSettings className="h-4 w-4" />
                    Business settings
                  </Link>
                </div>
              </div>

              {/* Top stats cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                    Total clients
                  </p>
                  <p className="text-3xl font-semibold text-slate-900">{stats.clients}</p>
                  <p className="mt-1 text-xs text-slate-500">All customers linked to your installer account.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                    Vehicles registered
                  </p>
                  <p className="text-3xl font-semibold text-slate-900">{stats.vehicles}</p>
                  <p className="mt-1 text-xs text-slate-500">Vehicles with a Fireball protection attached.</p>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                    Active warranties
                  </p>
                  <p className="text-3xl font-semibold text-slate-900">{stats.warranties}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Protection programs currently active for your clients.
                  </p>
                </div>
              </div>

              {/* Mid row - charts & secondary cards (Purity-style layout) */}
              <div className="mt-6 grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sales / performance chart */}
                <div className="xl:col-span-2 rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Business performance
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        Estimated jobs completed over the last months
                      </p>
                    </div>
                    <select className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-600 focus:outline-none">
                      <option>Last 6 months</option>
                      <option>Last 12 months</option>
                    </select>
                  </div>
                  {/* Simple SVG line chart placeholder to mimic Purity layout */}
                  <div className="mt-2 h-56 w-full rounded-xl bg-slate-50 flex items-center justify-center text-xs text-slate-400">
                    Business chart coming soon
                  </div>
                </div>

                {/* Right mini cards column */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                      Conversion
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">–</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Percentage of business leads that become active Fireball clients.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                      Activity score
                    </p>
                    <p className="text-3xl font-semibold text-slate-900">–</p>
                    <p className="mt-1 text-xs text-slate-500">
                      We’ll surface a simple score once more data is connected.
                    </p>
                  </div>
                </div>
              </div>

              {/* Main content grid */}
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left column: activity / clients */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                          Recent activity
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          Latest movements across your clients, vehicles and warranties.
                        </p>
                      </div>
                      <span className="rounded-full bg-[#4318FF]/10 px-3 py-1 text-xs font-medium text-[#4318FF]">
                        Live sync
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p className="text-slate-400 text-xs">
                        Real activity feed will appear here as we connect more business data.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Client overview
                      </p>
                      <Link
                        to="/account/business/clients"
                        className="text-xs font-medium text-[#4318FF] hover:text-[#3312C8] transition-colors"
                      >
                        Open clients
                      </Link>
                    </div>
                    <p className="text-sm text-slate-600">
                      Use the Clients section to search, edit and manage all your Fireball customers.
                    </p>
                  </div>

                  {/* Projects / jobs table placeholder */}
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Recent jobs
                      </p>
                      <span className="text-xs font-medium text-slate-500">Coming soon</span>
                    </div>
                    <div className="border border-dashed border-slate-200 rounded-xl px-4 py-6 text-center text-sm text-slate-500">
                      When Fireball job data is connected, you’ll see your latest coatings, inspections and
                      warranty activations here.
                    </div>
                  </div>
                </div>

                {/* Right column: quick links / resources */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                      Quick actions
                    </p>
                    <div className="space-y-2 text-sm">
                      <Link
                        to="/account/business/clients"
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <span>Add / manage clients</span>
                        <IconChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                      <Link
                        to="/account/business/settings"
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <span>Update business profile</span>
                        <IconChevronRight className="h-4 w-4 text-slate-400" />
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-100 bg-[#1B2559] px-5 py-4 shadow-md">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/70 mb-2">
                      Fireball resources
                    </p>
                    <p className="text-sm text-white/80 mb-3">
                      Access technical documents, application guides and marketing assets from the Fireball
                      network.
                    </p>
                    <Link
                      to="/join-fireball"
                      className="inline-flex items-center gap-1.5 text-xs font-nav font-bold uppercase text-white/90 hover:text-white transition-colors"
                    >
                      Open network portal
                      <IconChevronRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
