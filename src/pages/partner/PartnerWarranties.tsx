import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface VehicleOption {
  id: string
  brand: string
  model: string
  year: number
  client_id: string
}
interface WarrantyRow {
  id: string
  vehicle_id: string
  product_used: string
  installation_date: string
  warranty_length: string | null
  notes: string | null
  created_at: string
}

export function PartnerWarranties() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [vehicles, setVehicles] = useState<VehicleOption[]>([])
  const [list, setList] = useState<WarrantyRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [vehicleId, setVehicleId] = useState('')
  const [productUsed, setProductUsed] = useState('')
  const [installationDate, setInstallationDate] = useState('')
  const [warrantyLength, setWarrantyLength] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const profile = await getCurrentUserProfile()
    if (!profile?.id) return
    const { data: pc } = await supabase
      .from('partner_companies')
      .select('id,company_name')
      .eq('user_id', profile.id)
      .eq('status', 'partner')
      .maybeSingle()
    if (!pc) return
    const pid = (pc as { id: string }).id
    setPartnerId(pid)
    const [vehiclesRes, warrantiesRes] = await Promise.all([
      supabase.from('partner_vehicles').select('id,brand,model,year,client_id').eq('partner_id', pid).order('created_at', { ascending: false }),
      supabase.from('partner_warranties').select('id,vehicle_id,product_used,installation_date,warranty_length,notes,created_at').eq('partner_id', pid).order('created_at', { ascending: false }),
    ])
    setVehicles((vehiclesRes.data ?? []) as VehicleOption[])
    setList((warrantiesRes.data ?? []) as WarrantyRow[])
  }

  useEffect(() => {
    let mounted = true
    load().then(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const openAdd = () => {
    setVehicleId(vehicles[0]?.id ?? '')
    setProductUsed('')
    setInstallationDate(new Date().toISOString().slice(0, 10))
    setWarrantyLength('')
    setNotes('')
    setError('')
    setModal(true)
  }

  const save = async () => {
    if (!partnerId || !vehicleId || !productUsed.trim() || !installationDate) {
      setError('Fill required fields.')
      return
    }
    const vehicle = vehicles.find((v) => v.id === vehicleId)
    if (!vehicle) return
    const { data: inserted, error: insertErr } = await supabase
      .from('partner_warranties')
      .insert({
        partner_id: partnerId,
        client_id: vehicle.client_id,
        vehicle_id: vehicleId,
        product_used: productUsed.trim(),
        installation_date: installationDate,
        warranty_length: warrantyLength.trim() || null,
        notes: notes.trim() || null,
      })
      .select('id')
      .maybeSingle()
    if (insertErr) {
      setError(insertErr.message || 'Failed to create warranty.')
      return
    }
    const { data: clientRow } = await supabase
      .from('partner_clients')
      .select('user_id')
      .eq('id', vehicle.client_id)
      .maybeSingle()
    const userId = (clientRow as { user_id?: string } | null)?.user_id
    if (userId) {
      await supabase.from('garage_vehicles').insert({
        user_id: userId,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        ceramic_protection_date: installationDate,
        protection_shop: (await getCurrentUserProfile())?.company_name ?? undefined,
        protection_product: productUsed.trim(),
      })
    }
    setModal(false)
    load()
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded-2xl bg-white/5 h-48 w-full" />
      </div>
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-5xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-semibold text-white">Warranty registrations</h1>
        <button
          type="button"
          onClick={openAdd}
          disabled={vehicles.length === 0}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
        >
          Register warranty
        </button>
      </div>
      {vehicles.length === 0 && (
        <p className="mb-4 text-sm text-amber-200/80">Add clients and vehicles first.</p>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-white/50 text-sm">No warranties yet.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((row) => (
              <li key={row.id} className="px-4 py-3">
                <p className="text-white font-medium">{row.product_used}</p>
                <p className="text-sm text-white/60">
                  Installed {new Date(row.installation_date).toLocaleDateString()}
                  {row.warranty_length && ` · ${row.warranty_length}`}
                </p>
                {row.notes && <p className="text-xs text-white/45 mt-1">{row.notes}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Register warranty</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              >
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</option>
                ))}
              </select>
              <input type="text" placeholder="Product used *" value={productUsed} onChange={(e) => setProductUsed(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <input type="date" value={installationDate} onChange={(e) => setInstallationDate(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none" />
              <input type="text" placeholder="Warranty length (e.g. 5 years)" value={warrantyLength} onChange={(e) => setWarrantyLength(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <textarea placeholder="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none resize-none" />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setModal(false)} className="flex-1 rounded-xl border border-white/20 py-2 text-sm text-white/80">Cancel</button>
              <button type="button" onClick={save} className="flex-1 rounded-xl bg-white text-black py-2 text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
