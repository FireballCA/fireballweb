import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ClientRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

interface GarageVehicle {
  id: string
  brand: string
  model: string
  year: number
  color?: string | null
  image_url?: string | null
  ceramic_protection_date?: string | null
  protection_shop?: string | null
  protection_product?: string | null
}

interface CoatingRecord {
  id: string
  vehicle_id: string
  product_name: string
  applied_date: string
  notes?: string | null
  installer_name?: string | null
}

// ─── Field style ───────────────────────────────────────────────────────────────

const fieldCls =
  'w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-white/35 focus:outline-none transition-colors'

// ─── Search results from registered Fireball users ────────────────────────────

interface ProfileMatch {
  id: string
  email: string
  display_name: string | null
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function PartnerClients() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [partnerName, setPartnerName] = useState('')
  const [list, setList] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)

  // Search
  const [search, setSearch] = useState('')
  const [profileMatches, setProfileMatches] = useState<ProfileMatch[]>([])
  const [searchingProfiles, setSearchingProfiles] = useState(false)

  // Modals
  const [addModal, setAddModal] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  // Client detail panel
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)
  const [clientVehicles, setClientVehicles] = useState<GarageVehicle[]>([])
  const [loadingVehicles, setLoadingVehicles] = useState(false)
  const [coatingRecords, setCoatingRecords] = useState<CoatingRecord[]>([])

  // Add coating modal
  const [coatingModal, setCoatingModal] = useState<GarageVehicle | null>(null)
  const [coatingProduct, setCoatingProduct] = useState('')
  const [coatingDate, setCoatingDate] = useState(new Date().toISOString().split('T')[0])
  const [coatingNotes, setCoatingNotes] = useState('')
  const [savingCoating, setSavingCoating] = useState(false)

  // ── Load ───────────────────────────────────────────────────────────────────

  const loadAll = useCallback(async () => {
    const profile = await getCurrentUserProfile()
    if (!profile?.id) return

    const { data: pc } = await supabase
      .from('partner_companies')
      .select('id, company_name')
      .eq('user_id', profile.id)
      .eq('status', 'partner')
      .maybeSingle()
    if (!pc) return

    const pid = (pc as { id: string; company_name: string }).id
    const pname = (pc as { id: string; company_name: string }).company_name
    setPartnerId(pid)
    setPartnerName(pname ?? '')

    const { data } = await supabase
      .from('partner_clients')
      .select('id,full_name,email,phone,created_at')
      .eq('partner_id', pid)
      .order('created_at', { ascending: false })
    setList((data ?? []) as ClientRow[])
  }, [])

  useEffect(() => {
    let mounted = true
    loadAll().then(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [loadAll])

  // ── Search Fireball profiles ────────────────────────────────────────────────

  useEffect(() => {
    if (search.trim().length < 2) {
      setProfileMatches([])
      return
    }
    const timer = setTimeout(async () => {
      setSearchingProfiles(true)
      const { data } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
        .limit(5)
      setProfileMatches((data ?? []) as ProfileMatch[])
      setSearchingProfiles(false)
    }, 320)
    return () => clearTimeout(timer)
  }, [search])

  // ── Filter local list ───────────────────────────────────────────────────────

  const filtered = search.trim()
    ? list.filter(
        (c) =>
          c.full_name.toLowerCase().includes(search.toLowerCase()) ||
          c.email.toLowerCase().includes(search.toLowerCase()),
      )
    : list

  // ── Save new client ─────────────────────────────────────────────────────────

  const saveClient = async () => {
    if (!partnerId) return
    setFormError('')
    if (!fullName.trim() || !email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('partner_clients').insert({
      partner_id: partnerId,
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
    })
    setSaving(false)
    if (error) { setFormError(error.message); return }
    setAddModal(false)
    setFullName(''); setEmail(''); setPhone('')
    loadAll()
  }

  // ── Quick-add from profile search result ────────────────────────────────────

  const addFromProfile = async (p: ProfileMatch) => {
    if (!partnerId) return
    const alreadyExists = list.some((c) => c.email === p.email)
    if (alreadyExists) {
      const existing = list.find((c) => c.email === p.email)!
      openClient(existing)
      setSearch('')
      return
    }
    await supabase.from('partner_clients').insert({
      partner_id: partnerId,
      full_name: p.display_name ?? p.email,
      email: p.email,
      phone: null,
    })
    setSearch('')
    await loadAll()
  }

  // ── Open client detail ──────────────────────────────────────────────────────

  const openClient = useCallback(async (client: ClientRow) => {
    setSelectedClient(client)
    setClientVehicles([])
    setCoatingRecords([])
    setLoadingVehicles(true)

    // Try to find registered user by email
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', client.email)
      .maybeSingle()

    if (profileData?.id) {
      const { data: vehicles } = await supabase
        .from('garage_vehicles')
        .select('*')
        .eq('user_id', profileData.id)
        .order('created_at', { ascending: true })
      setClientVehicles((vehicles ?? []) as GarageVehicle[])

      // Load installer coatings for those vehicles
      if (vehicles && vehicles.length > 0) {
        const ids = vehicles.map((v: GarageVehicle) => v.id)
        const { data: coatings } = await supabase
          .from('installer_coatings')
          .select('*')
          .in('vehicle_id', ids)
          .order('applied_date', { ascending: false })
        setCoatingRecords((coatings ?? []) as CoatingRecord[])
      }
    }

    setLoadingVehicles(false)
  }, [])

  // ── Save coating ────────────────────────────────────────────────────────────

  const saveCoating = async () => {
    if (!coatingModal || !coatingProduct.trim()) return
    setSavingCoating(true)
    const { error } = await supabase.from('installer_coatings').insert({
      vehicle_id: coatingModal.id,
      product_name: coatingProduct.trim(),
      applied_date: coatingDate,
      notes: coatingNotes.trim() || null,
      installer_name: partnerName || null,
    })
    setSavingCoating(false)
    if (!error) {
      // Update vehicle's coating date in garage_vehicles
      await supabase
        .from('garage_vehicles')
        .update({
          ceramic_protection_date: new Date(coatingDate).toISOString(),
          protection_shop: partnerName || null,
          protection_product: coatingProduct.trim(),
        })
        .eq('id', coatingModal.id)

      setCoatingModal(null)
      setCoatingProduct('')
      setCoatingNotes('')
      setCoatingDate(new Date().toISOString().split('T')[0])
      // Refresh
      if (selectedClient) openClient(selectedClient)
    }
  }

  // ── Delete client ────────────────────────────────────────────────────────────

  const removeClient = async (id: string) => {
    if (!confirm('Remove this client from your list?')) return
    await supabase.from('partner_clients').delete().eq('id', id)
    if (selectedClient?.id === id) setSelectedClient(null)
    loadAll()
  }

  // ─── Loading ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 animate-pulse rounded-2xl bg-white/5" />
        ))}
      </div>
    )
  }

  // ─── Layout ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 divide-x divide-white/8">

      {/* ── LEFT: client list ────────────────────────────────────────────────── */}
      <div className="flex w-full flex-col md:w-80 lg:w-96 shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <h1 className="text-lg font-semibold text-white">Clients</h1>
          <button
            type="button"
            onClick={() => { setAddModal(true); setFullName(''); setEmail(''); setPhone(''); setFormError('') }}
            className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition-opacity hover:opacity-80"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add client
          </button>
        </div>

        {/* Search */}
        <div className="relative px-4 py-3 border-b border-white/8">
          <svg className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients or find by email…"
            className="w-full rounded-xl border border-white/12 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 focus:border-white/30 focus:outline-none"
          />
          {/* Profile search results dropdown */}
          {search.trim().length >= 2 && (profileMatches.length > 0 || searchingProfiles) && (
            <div className="absolute left-4 right-4 top-full z-20 mt-1 overflow-hidden rounded-xl border border-white/12 bg-[#141414] shadow-xl">
              {searchingProfiles ? (
                <div className="px-4 py-3 text-xs text-white/40">Searching…</div>
              ) : (
                <>
                  <p className="border-b border-white/8 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Fireball Members
                  </p>
                  {profileMatches.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addFromProfile(p)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-semibold text-white/60">
                        {(p.display_name ?? p.email)[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">{p.display_name ?? '—'}</p>
                        <p className="truncate text-xs text-white/45">{p.email}</p>
                      </div>
                      <svg className="ml-auto h-3.5 w-3.5 shrink-0 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* Client list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                <svg className="h-6 w-6 text-white/25" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-white/60">No clients yet</p>
                <p className="mt-0.5 text-xs text-white/30">Add a client or search by email above</p>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-white/6">
              {filtered.map((row) => (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => openClient(row)}
                    className={`flex w-full items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-white/4 ${selectedClient?.id === row.id ? 'bg-white/6' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/8 text-sm font-semibold text-white/60">
                      {row.full_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">{row.full_name}</p>
                      <p className="truncate text-xs text-white/45">{row.email}</p>
                    </div>
                    <svg className="h-4 w-4 shrink-0 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── RIGHT: client detail ─────────────────────────────────────────────── */}
      <div className="hidden flex-1 flex-col overflow-y-auto md:flex">
        {!selectedClient ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center p-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
              <svg className="h-7 w-7 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white/40">Select a client</p>
              <p className="mt-0.5 text-xs text-white/25">Click on a client to view their garage</p>
            </div>
          </div>
        ) : (
          <div className="p-6 lg:p-8">
            {/* Client header */}
            <div className="mb-6 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white">
                  {selectedClient.full_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{selectedClient.full_name}</h2>
                  <p className="text-sm text-white/50">{selectedClient.email}</p>
                  {selectedClient.phone && (
                    <p className="text-xs text-white/35">{selectedClient.phone}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeClient(selectedClient.id)}
                className="shrink-0 rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/15"
              >
                Remove
              </button>
            </div>

            {/* Garage section */}
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-widest text-white/40">
                My Garage
              </h3>
            </div>

            {loadingVehicles ? (
              <div className="space-y-3">
                {[0, 1].map((i) => (
                  <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/5" />
                ))}
              </div>
            ) : clientVehicles.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 py-12 text-center">
                <svg className="h-8 w-8 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 17H5a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2h-4" />
                </svg>
                <div>
                  <p className="text-sm text-white/40">No vehicles in garage</p>
                  <p className="mt-0.5 text-xs text-white/25">
                    {selectedClient.email
                      ? 'Client may not have a Fireball account yet'
                      : 'No registered vehicles found'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {clientVehicles.map((v) => {
                  const vehicleCoatings = coatingRecords.filter((c) => c.vehicle_id === v.id)
                  return (
                    <div
                      key={v.id}
                      className="overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]"
                    >
                      <div className="flex items-start gap-4 p-4">
                        {/* Photo / No photo */}
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/6">
                          {v.image_url ? (
                            <img src={v.image_url} alt={`${v.brand} ${v.model}`} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                              <svg className="h-6 w-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="text-[9px] text-white/25">No photo</span>
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-white">
                            {v.year} {v.brand} {v.model}
                          </p>
                          {v.color && <p className="mt-0.5 text-xs text-white/40">{v.color}</p>}

                          <div className="mt-2">
                            {v.ceramic_protection_date ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[10px] font-semibold text-green-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                Coated · {new Date(v.ceramic_protection_date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-2 py-0.5 text-[10px] font-semibold text-white/40">
                                <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
                                Not protected
                              </span>
                            )}
                          </div>

                          {v.protection_shop && (
                            <p className="mt-1 text-[11px] text-white/30">Applied at {v.protection_shop}</p>
                          )}
                          {v.protection_product && (
                            <p className="text-[11px] text-white/30">Product: {v.protection_product}</p>
                          )}
                        </div>

                        {/* Add coating CTA */}
                        <button
                          type="button"
                          onClick={() => {
                            setCoatingModal(v)
                            setCoatingProduct('')
                            setCoatingDate(new Date().toISOString().split('T')[0])
                            setCoatingNotes('')
                          }}
                          className="shrink-0 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition-colors hover:border-white/35 hover:bg-white/10 hover:text-white"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add coating
                        </button>
                      </div>

                      {/* Installer coatings history */}
                      {vehicleCoatings.length > 0 && (
                        <div className="border-t border-white/6 px-4 py-3">
                          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-white/25">
                            Service history — installer records
                          </p>
                          <div className="space-y-2">
                            {vehicleCoatings.map((c) => (
                              <div key={c.id} className="flex items-start justify-between gap-2 rounded-xl bg-white/4 px-3 py-2">
                                <div>
                                  <p className="text-xs font-medium text-white">{c.product_name}</p>
                                  {c.notes && <p className="mt-0.5 text-[11px] text-white/40">{c.notes}</p>}
                                  {c.installer_name && (
                                    <p className="text-[10px] text-white/30">By {c.installer_name}</p>
                                  )}
                                </div>
                                <span className="shrink-0 text-[11px] text-white/35">
                                  {new Date(c.applied_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add client modal ─────────────────────────────────────────────────── */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAddModal(false)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-semibold text-white">Add client</h2>
            <p className="mb-5 text-sm text-white/40">Manually add a client to your list.</p>
            {formError && <p className="mb-3 text-sm text-red-400">{formError}</p>}
            <div className="space-y-3">
              <input type="text" placeholder="Full name *" value={fullName} onChange={(e) => setFullName(e.target.value)} className={fieldCls} />
              <input type="email" placeholder="Email *" value={email} onChange={(e) => setEmail(e.target.value)} className={fieldCls} />
              <input type="tel" placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldCls} />
            </div>
            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setAddModal(false)} className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-white/70">Cancel</button>
              <button type="button" onClick={saveClient} disabled={saving} className="flex-1 rounded-xl bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-50">
                {saving ? 'Saving…' : 'Add client'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add coating modal ────────────────────────────────────────────────── */}
      {coatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setCoatingModal(null)}>
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-1 text-lg font-semibold text-white">Add Coating</h2>
            <p className="mb-1 text-sm text-white/50">
              {coatingModal.year} {coatingModal.brand} {coatingModal.model}
            </p>
            <p className="mb-5 text-xs text-white/30">
              This will update the vehicle's protection status in the client's garage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Product name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fireball Diamond 9H"
                  value={coatingProduct}
                  onChange={(e) => setCoatingProduct(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Date applied *
                </label>
                <input
                  type="date"
                  value={coatingDate}
                  onChange={(e) => setCoatingDate(e.target.value)}
                  className={fieldCls}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/40">
                  Notes <span className="normal-case text-white/25">(optional)</span>
                </label>
                <textarea
                  placeholder="Prep steps, layers, conditions…"
                  value={coatingNotes}
                  onChange={(e) => setCoatingNotes(e.target.value)}
                  rows={3}
                  className={`${fieldCls} resize-none`}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" onClick={() => setCoatingModal(null)} className="flex-1 rounded-xl border border-white/15 py-2.5 text-sm text-white/70">
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCoating}
                disabled={savingCoating || !coatingProduct.trim()}
                className="flex-1 rounded-xl bg-white py-2.5 text-sm font-semibold text-black disabled:opacity-50"
              >
                {savingCoating ? 'Saving…' : 'Save coating'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
