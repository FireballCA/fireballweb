import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface PartnerRow {
  id: string
  company_name: string
}
interface VehicleRow {
  id: string
  brand: string
  model: string
  year: number
  created_at: string
}
interface WarrantyRow {
  id: string
  product_used: string
  installation_date: string
  created_at: string
}

export function PartnerOverview() {
  const [, setPartnerId] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState('')
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, warranties: 0 })
  const [recentVehicles, setRecentVehicles] = useState<VehicleRow[]>([])
  const [recentWarranties, setRecentWarranties] = useState<WarrantyRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile?.id) {
        setLoading(false)
        return
      }
      const { data: pc } = await supabase
        .from('partner_companies')
        .select('id,company_name')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()
      if (!mounted || !pc) {
        setLoading(false)
        return
      }
      const pid = (pc as PartnerRow).id
      setPartnerId(pid)
      setCompanyName((pc as PartnerRow).company_name || '')

      const [clientsRes, vehiclesRes, warrantiesRes, recentV, recentW] = await Promise.all([
        supabase.from('partner_clients').select('id', { count: 'exact', head: true }).eq('partner_id', pid),
        supabase.from('partner_vehicles').select('id', { count: 'exact', head: true }).eq('partner_id', pid),
        supabase.from('partner_warranties').select('id', { count: 'exact', head: true }).eq('partner_id', pid),
        supabase.from('partner_vehicles').select('id,brand,model,year,created_at').eq('partner_id', pid).order('created_at', { ascending: false }).limit(5),
        supabase.from('partner_warranties').select('id,product_used,installation_date,created_at').eq('partner_id', pid).order('created_at', { ascending: false }).limit(5),
      ])
      if (!mounted) return
      setStats({
        clients: clientsRes.count ?? 0,
        vehicles: vehiclesRes.count ?? 0,
        warranties: warrantiesRes.count ?? 0,
      })
      setRecentVehicles((recentV.data ?? []) as VehicleRow[])
      setRecentWarranties((recentW.data ?? []) as WarrantyRow[])
      setLoading(false)
    }
    load()
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded-2xl bg-white/5 h-32 w-full max-w-md" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <h1 className="text-2xl font-semibold text-white mb-1">
        Welcome back, {companyName || 'Partner'}
      </h1>
      <p className="text-sm text-white/55 mb-8">Here’s your overview.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50 mb-1">Certification</p>
          <p className="text-lg font-semibold text-white">Active</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-3">Recent vehicles</h2>
          {recentVehicles.length === 0 ? (
            <p className="text-sm text-white/50">No vehicles yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentVehicles.map((v) => (
                <li key={v.id} className="flex justify-between text-sm text-white/80">
                  <span>{v.brand} {v.model} ({v.year})</span>
                  <span className="text-white/45">{new Date(v.created_at).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
          <h2 className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/55 mb-3">Recent warranties</h2>
          {recentWarranties.length === 0 ? (
            <p className="text-sm text-white/50">No warranties yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentWarranties.map((w) => (
                <li key={w.id} className="flex justify-between text-sm text-white/80">
                  <span>{w.product_used}</span>
                  <span className="text-white/45">{new Date(w.installation_date).toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
