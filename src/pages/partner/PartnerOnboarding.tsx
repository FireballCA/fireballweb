import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'

export function PartnerOnboarding() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [companyLogo, setCompanyLogo] = useState('')
  const [companyAddress, setCompanyAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile?.id) return
      const { data } = await supabase
        .from('partner_companies')
        .select('company_name,application_data')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()
      if (data?.company_name) setCompanyName(String(data.company_name))
      const appData = (data as { application_data?: { business_address?: string; phone_number?: string; website_or_social_media?: string } })?.application_data
      if (appData?.business_address) setCompanyAddress(String(appData.business_address))
      if (appData?.phone_number) setPhone(String(appData.phone_number))
      if (appData?.website_or_social_media) setWebsite(String(appData.website_or_social_media))
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const profile = await getCurrentUserProfile()
      if (!profile?.id) {
        setError('Session expired. Please sign in again.')
        setLoading(false)
        return
      }
      const { error: updateError } = await supabase
        .from('partner_companies')
        .update({
          company_name: companyName.trim() || null,
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
        setError(updateError.message || 'Unable to save.')
        setLoading(false)
        return
      }
      navigate('/partner/dashboard', { replace: true })
    } catch (err) {
      setError('An error occurred.')
      setLoading(false)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_22px_55px_rgba(0,0,0,0.5)] p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-white mb-1">Complete your partner profile</h1>
        <p className="text-sm text-white/60 mb-6">
          Add your business details to access the partner dashboard.
        </p>
        {error && (
          <div className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Company name
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              placeholder="Your company name"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Company logo URL
            </label>
            <input
              type="url"
              value={companyLogo}
              onChange={(e) => setCompanyLogo(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={companyAddress}
              onChange={(e) => setCompanyAddress(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              placeholder="Business address"
              required
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              placeholder="+1..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-3 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 resize-none"
              placeholder="Short description of your business"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-white text-black py-3 font-semibold text-sm hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving…' : 'Save and continue'}
          </button>
        </form>
      </div>
    </div>
  )
}
