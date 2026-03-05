import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface ClientRow {
  id: string
  full_name: string
  email: string
}
interface VehicleRow {
  id: string
  client_id: string
  brand: string
  model: string
  year: number
  vin: string | null
  color: string | null
  created_at: string
}

export function PartnerVehicles() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [list, setList] = useState<(VehicleRow & { client_name?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [clientId, setClientId] = useState('')
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [vin, setVin] = useState('')
  const [color, setColor] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const profile = await getCurrentUserProfile()
    if (!profile?.id) return
    const { data: pc } = await supabase
      .from('partner_companies')
      .select('id')
      .eq('user_id', profile.id)
      .eq('status', 'partner')
      .maybeSingle()
    if (!pc) return
    const pid = (pc as { id: string }).id
    setPartnerId(pid)
    const [clientsRes, vehiclesRes] = await Promise.all([
      supabase.from('partner_clients').select('id,full_name,email').eq('partner_id', pid).order('full_name'),
      supabase.from('partner_vehicles').select('id,client_id,brand,model,year,vin,color,created_at').eq('partner_id', pid).order('created_at', { ascending: false }),
    ])
    const clientList = (clientsRes.data ?? []) as ClientRow[]
    setClients(clientList)
    const vehicles = (vehiclesRes.data ?? []) as VehicleRow[]
    const withNames = vehicles.map((v) => ({
      ...v,
      client_name: clientList.find((c) => c.id === v.client_id)?.full_name ?? '—',
    }))
    setList(withNames)
  }

  useEffect(() => {
    let mounted = true
    load().then(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setClientId(clients[0]?.id ?? '')
    setBrand('')
    setModel('')
    setYear('')
    setVin('')
    setColor('')
    setError('')
    setModal('add')
  }
  const openEdit = (row: VehicleRow) => {
    setEditingId(row.id)
    setClientId(row.client_id)
    setBrand(row.brand)
    setModel(row.model)
    setYear(String(row.year))
    setVin(row.vin || '')
    setColor(row.color || '')
    setError('')
    setModal('edit')
  }
  const save = async () => {
    if (!partnerId) return
    setError('')
    const y = parseInt(year, 10)
    if (!clientId || !brand.trim() || !model.trim() || Number.isNaN(y)) {
      setError('Fill required fields.')
      return
    }
    if (modal === 'add') {
      const { error: e } = await supabase.from('partner_vehicles').insert({
        partner_id: partnerId,
        client_id: clientId,
        brand: brand.trim(),
        model: model.trim(),
        year: y,
        vin: vin.trim() || null,
        color: color.trim() || null,
      })
      if (e) {
        setError(e.message || 'Failed to add.')
        return
      }
    } else if (editingId) {
      const { error: e } = await supabase
        .from('partner_vehicles')
        .update({
          client_id: clientId,
          brand: brand.trim(),
          model: model.trim(),
          year: y,
          vin: vin.trim() || null,
          color: color.trim() || null,
        })
        .eq('id', editingId)
      if (e) {
        setError(e.message || 'Failed to update.')
        return
      }
    }
    setModal(null)
    load()
  }
  const remove = async (id: string) => {
    if (!confirm('Delete this vehicle?')) return
    await supabase.from('partner_vehicles').delete().eq('id', id)
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
        <h1 className="text-2xl font-semibold text-white">Vehicles</h1>
        <button
          type="button"
          onClick={openAdd}
          disabled={clients.length === 0}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
        >
          Add vehicle
        </button>
      </div>
      {clients.length === 0 && (
        <p className="mb-4 text-sm text-amber-200/80">Add at least one client before adding vehicles.</p>
      )}

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-white/50 text-sm">No vehicles yet.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-white font-medium">{row.brand} {row.model} ({row.year})</p>
                  <p className="text-sm text-white/60">{row.client_name}</p>
                  {(row.vin || row.color) && (
                    <p className="text-xs text-white/45">{[row.vin, row.color].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => openEdit(row)} className="rounded-lg px-3 py-1.5 text-xs text-white/80 hover:bg-white/10">Edit</button>
                  <button type="button" onClick={() => remove(row.id)} className="rounded-lg px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20">Delete</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-white mb-4">{modal === 'add' ? 'Add vehicle' : 'Edit vehicle'}</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <select
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                ))}
              </select>
              <input type="text" placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <input type="text" placeholder="Model" value={model} onChange={(e) => setModel(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <input type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <input type="text" placeholder="VIN (optional)" value={vin} onChange={(e) => setVin(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
              <input type="text" placeholder="Color (optional)" value={color} onChange={(e) => setColor(e.target.value)} className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none" />
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setModal(null)} className="flex-1 rounded-xl border border-white/20 py-2 text-sm text-white/80">Cancel</button>
              <button type="button" onClick={save} className="flex-1 rounded-xl bg-white text-black py-2 text-sm font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
