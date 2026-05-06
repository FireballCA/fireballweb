import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface BusinessSheetProps {
  isOpen: boolean
  onClose: () => void
  onSaved?: () => void
}

export function BusinessSheet({ isOpen, onClose, onSaved }: BusinessSheetProps) {
  const [rendered, setRendered] = useState(isOpen)
  const [isExiting, setIsExiting] = useState(false)
  const [view, setView] = useState<'form' | 'dashboard'>('form')
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, warranties: 0 })
  const [loading, setLoading] = useState(true)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const [companyNameInput, setCompanyNameInput] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (isOpen) {
      setRendered(true)
      setIsExiting(false)
      document.body.style.overflow = 'hidden'
      return
    }
    if (!isOpen && rendered) {
      setIsExiting(true)
      const t = window.setTimeout(() => {
        setRendered(false)
        setIsExiting(false)
        document.body.style.overflow = ''
      }, 400)
      return () => { window.clearTimeout(t); document.body.style.overflow = '' }
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen, rendered])

  useEffect(() => {
    if (!isOpen || !rendered) return
    let mounted = true
    setLoading(true)
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile?.id) {
        setLoading(false)
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
        setLoading(false)
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
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [isOpen, rendered])

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
      setView('dashboard')
      setStats({ clients: 0, vehicles: 0, warranties: 0 })
      onSaved?.()
    } catch {
      setFormError('An error occurred.')
    }
    setFormLoading(false)
  }

  if (!rendered) return null

  return (
    <div className="fixed inset-0 z-[150] flex flex-col justify-end pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto transition-opacity duration-300"
        onClick={onClose}
        aria-label="Close business panel"
      />
      <div
        className="relative w-full h-[92vh] md:h-[88vh] overflow-hidden pointer-events-auto flex flex-col rounded-t-[28px] shadow-[0_-24px_60px_rgba(0,0,0,0.55)]"
        style={{
          backgroundColor: '#0a0a0a',
          animation: isExiting
            ? 'adminPanelSlideDown 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards'
            : 'adminPanelSlideUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards',
        }}
      >
        <div className="px-6 md:px-10 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-emerald-400/90">
              Business
            </p>
            <h2 className="text-[26px] md:text-[30px] font-semibold tracking-[-0.02em] text-white">
              {view === 'form' ? 'Create your business' : 'Business dashboard'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-white/65 hover:text-white transition-colors"
            aria-label="Close"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 md:px-10 pt-6 pb-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="animate-pulse rounded-2xl bg-white/5 h-32 w-full max-w-md" />
            </div>
          ) : view === 'form' ? (
            <div className="max-w-md mx-auto flex flex-col items-center justify-center py-6">
              <div className="w-full flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden">
                <div className="w-full bg-black px-6 sm:px-10 py-6 sm:py-10">
                  <div className="mb-7">
                    <h3 className="text-2xl sm:text-3xl font-semibold text-white mb-1">Create your business</h3>
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
                      className="w-full bg-white text-black border-none py-4 rounded-lg font-semibold text-sm cursor-pointer transition-colors hover:bg-[#e5e5e5] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {formLoading ? 'Saving…' : 'Save and continue'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto pt-4">
              <h3 className="text-xl font-semibold text-white mb-1">Welcome back, {companyName || 'Partner'}</h3>
              <p className="text-sm text-white/55 mb-8">Here’s your business overview.</p>
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
              <p className="mt-8 text-sm text-white/50">
                Full partner tools (clients, vehicles, warranties) are available from the partner dashboard when you need them.
              </p>
            </div>
          )}
        </div>

        <style>{`
          @keyframes adminPanelSlideUp {
            from { transform: translateY(100%); opacity: 0.98; }
            to { transform: translateY(0); opacity: 1; }
          }
          @keyframes adminPanelSlideDown {
            from { transform: translateY(0); opacity: 1; }
            to { transform: translateY(100%); opacity: 0.98; }
          }
        `}</style>
      </div>
    </div>
  )
}
