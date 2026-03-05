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
import { Sidebar, SidebarBody, SidebarLink, useSidebar } from '@/components/ui/sidebar'
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [userDisplayName, setUserDisplayName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, warranties: 0 })
  const isAdminPath = location.pathname.includes('/account/business/admin')
  const isClientsPath = location.pathname.includes('/account/business/clients')
  const adminSection = location.pathname.includes('/admin/partners') ? 'partners' : location.pathname.includes('/admin/notifications') ? 'notifications' : 'stats'

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
                className="w-full bg-[#0A84FF] text-white border-none py-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Saving…' : 'Save and continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const iconClass = 'h-5 w-5 shrink-0 text-white/80'
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
        'business-layout flex w-full flex-1 flex-col overflow-hidden md:flex-row',
        'h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] bg-[#000000]'
      )}
    >
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
        <SidebarBody className="h-full justify-between gap-10 bg-[#1C1C1E] px-4">
          <BusinessSidebarContent
            mainLinks={mainLinks}
            adminSubLinks={adminSubLinks}
            backLink={backLink}
            userDisplayName={userDisplayName}
            initialLetter={initialLetter}
          />
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1 min-h-0 bg-[#000000]">
        <div className="flex h-full min-h-full w-full flex-1 flex-col gap-6 rounded-tl-2xl border border-white/10 bg-[#000000] p-6 md:p-10 overflow-auto">
          {isAdminPath ? (
            <>
              {!isAdmin ? (
                <Navigate to="/account/business" replace />
              ) : (
                <>
                  <div>
                    <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-red-400/90">Admin</p>
                    <h1 className="text-2xl font-semibold text-white">Admin panel</h1>
                  </div>
                  <AdminPanelContent section={adminSection} />
                </>
              )}
            </>
          ) : isClientsPath ? (
            <BusinessClientsPage />
          ) : (
            <>
              <div>
                <h1 className="text-2xl font-semibold text-white">Welcome back, {companyName || 'Partner'}</h1>
                <p className="text-sm text-white/55 mt-1">Here’s your business overview.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50 mb-1">Total clients</p>
                  <p className="text-2xl font-semibold text-white">{stats.clients}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50 mb-1">Vehicles registered</p>
                  <p className="text-2xl font-semibold text-white">{stats.vehicles}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50 mb-1">Active warranties</p>
                  <p className="text-2xl font-semibold text-white">{stats.warranties}</p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

interface BusinessSidebarContentProps {
  mainLinks: Array<{ label: string; href: string; icon: React.ReactNode }>
  adminSubLinks: Array<{ label: string; href: string; icon: React.ReactNode }>
  backLink: { label: string; href: string; icon: React.ReactNode }
  userDisplayName: string
  initialLetter: string
}

function BusinessSidebarContent({
  mainLinks,
  adminSubLinks,
  backLink,
  userDisplayName,
  initialLetter,
}: BusinessSidebarContentProps) {
  const { open } = useSidebar()
  return (
    <>
      <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
        <Link to="/" className="flex items-center py-1 shrink-0">
          <img
            src="/Assets/Logo-FireballBuisness.png"
            alt="Fireball Business"
            className="h-8 w-auto object-contain max-w-[180px]"
          />
        </Link>
        <div className="mt-8 flex flex-col gap-2">
          {mainLinks.map((link, idx) => (
            <SidebarLink key={idx} link={link} />
          ))}
          {open && adminSubLinks.length > 0 && (
            <div className="ml-2 mt-1 flex flex-col gap-1 border-l border-red-400/30 pl-3">
              {adminSubLinks.map((link, idx) => (
                <SidebarLink key={`admin-${idx}`} link={link} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {open && (
          <Link
            to="/account/dashboard"
            className="flex flex-row items-center gap-[13px] rounded-[14px] bg-white px-4 py-0 text-black min-h-[77px] w-[268px] min-w-[268px] shrink-0"
          >
            <div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full bg-[#0A84FF] text-xl font-medium text-white">
              {initialLetter}
            </div>
            <div className="flex min-w-0 flex-1 flex-col items-start justify-center gap-0.5 py-2">
              <span className="truncate font-['SF_Pro_Display',sans-serif] text-[22px] leading-7 tracking-[0.35px] text-black">
                {userDisplayName || 'Account'}
              </span>
              <span className="truncate font-['SF_Pro_Text',sans-serif] text-[13px] leading-[18px] tracking-[-0.078px] text-black/80">
                Account, Business & Purchases
              </span>
            </div>
            <IconChevronRight className="h-4 w-4 shrink-0 text-black/40" />
          </Link>
        )}
        <SidebarLink link={backLink} />
      </div>
    </>
  )
}

