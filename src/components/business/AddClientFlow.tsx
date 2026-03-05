import { useState, useEffect, useCallback, useRef } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { LiquidGlassSelect } from '@/components/LiquidGlassSelect'
import { IOSStyleCalendar } from '@/components/IOSStyleCalendar'
import { COATING_PRODUCTS, getCoatingById, getWarrantyEndDate, getRecommendedNextServiceDate } from '@/data/coatings'
import { supabase } from '@/lib/supabase'

interface ClientRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  user_id: string | null
}

interface VehicleRow {
  id: string
  brand: string
  model: string
  year: number
  color: string | null
}

const SERVICE_TYPES = [
  { value: 'ceramic', label: 'Ceramic Coating' },
  { value: 'paint_correction', label: 'Paint Correction' },
  { value: 'ppf', label: 'PPF' },
  { value: 'maintenance', label: 'Maintenance Detail' },
  { value: 'interior', label: 'Interior Detail' },
]

const COATING_OPTIONS = COATING_PRODUCTS.map((c) => ({ value: c.id, label: c.label }))

/** Tier par XP (aligné sur AccountDashboard). */
const XP_TIER_NAMES: { minXp: number; name: string }[] = [
  { minXp: 0, name: 'Brushed Silver' },
  { minXp: 1200, name: 'Titanium' },
  { minXp: 8000, name: 'Carbon Fiber' },
  { minXp: 20000, name: 'Obsidian' },
  { minXp: 35000, name: 'Gold' },
]
function getTierNameFromXp(xp: number): string {
  let current = XP_TIER_NAMES[0]
  for (const t of XP_TIER_NAMES) {
    if (xp >= t.minXp) current = t
    else break
  }
  return current.name
}

function getSubscriptionLabel(tier: string | null | undefined): string {
  const v = String(tier || '').trim().toLowerCase()
  if (v === 'ignition') return 'Ignition'
  if (v === 'apex') return 'Apex'
  return 'None'
}

interface AddClientFlowProps {
  isOpen: boolean
  onClose: () => void
  partnerId: string
  onSuccess?: () => void
}

type Step = 1 | 2 | 3 | 4

export function AddClientFlow({ isOpen, onClose, partnerId, onSuccess }: AddClientFlowProps) {
  const [step, setStep] = useState<Step>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<ClientRow[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedClient, setSelectedClient] = useState<ClientRow | null>(null)
  const [hasFireballAccount, setHasFireballAccount] = useState<'yes' | 'no' | null>(null)
  const [findEmail, setFindEmail] = useState('')
  const [findAccountLoading, setFindAccountLoading] = useState(false)
  const [findAccountProfile, setFindAccountProfile] = useState<{
    full_name: string
    vehicles: VehicleRow[]
    tier_label?: string
    subscription_label?: string
  } | null>(null)
  const [emailSuggestions, setEmailSuggestions] = useState<Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string
    xp?: number
    subscription_tier?: string | null
  }>>([])
  const [emailSuggestionsLoading, setEmailSuggestionsLoading] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientPhone, setNewClientPhone] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [createClientLoading, setCreateClientLoading] = useState(false)
  const [createdClientId, setCreatedClientId] = useState<string | null>(null)
  const [clientVehicles, setClientVehicles] = useState<VehicleRow[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)
  const [showAddVehicleForm, setShowAddVehicleForm] = useState(false)
  const [newVehicleMake, setNewVehicleMake] = useState('')
  const [newVehicleModel, setNewVehicleModel] = useState('')
  const [newVehicleYear, setNewVehicleYear] = useState(new Date().getFullYear())
  const [newVehicleColor, setNewVehicleColor] = useState('')
  const [newVehicleLicense, setNewVehicleLicense] = useState('')
  const [saveVehicleLoading, setSaveVehicleLoading] = useState(false)
  const [serviceType, setServiceType] = useState('ceramic')
  const [productUsed, setProductUsed] = useState(COATING_PRODUCTS[0]?.id ?? 'aegis')
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().slice(0, 10))
  const [registerLoading, setRegisterLoading] = useState(false)
  const [error, setError] = useState('')
  const emailSuggestionsRef = useRef<HTMLDivElement>(null)

  const currentClientId = selectedClient?.id ?? createdClientId

  const runSearch = useCallback(async () => {
    if (!partnerId) return
    setSearching(true)
    setError('')
    const q = searchQuery.trim().toLowerCase()
    const { data } = await supabase
      .from('partner_clients')
      .select('id,full_name,email,phone,user_id')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(50)
    const list = (data ?? []) as ClientRow[]
    const filtered = q
      ? list.filter(
          (c) =>
            c.full_name.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q) ||
            (c.phone || '').toLowerCase().includes(q)
        )
      : list
    setSearchResults(filtered.slice(0, 10))
    setSearching(false)
  }, [partnerId, searchQuery])

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(runSearch, 300)
    return () => clearTimeout(t)
  }, [isOpen, searchQuery, runSearch])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emailSuggestionsRef.current && !emailSuggestionsRef.current.contains(e.target as Node)) {
        setEmailSuggestions([])
      }
    }
    if (emailSuggestions.length > 0) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [emailSuggestions.length])

  // Suggestions as you type (email lookup step 2). RPC can 404 if SQL not run in Supabase.
  useEffect(() => {
    if (step !== 2 || hasFireballAccount !== 'yes') {
      setEmailSuggestions([])
      return
    }
    const q = findEmail.trim()
    if (q.length < 2) {
      setEmailSuggestions([])
      return
    }
    let cancelled = false
    const t = setTimeout(async () => {
      setEmailSuggestionsLoading(true)
      try {
        const { data: rows, error } = await supabase.rpc('search_profiles_by_email_for_partner', {
          email_input: q,
        })
        if (cancelled) return
        if (!error && Array.isArray(rows)) setEmailSuggestions(rows as Array<{ id: string; first_name: string | null; last_name: string | null; email: string; xp?: number; subscription_tier?: string | null }>)
        else setEmailSuggestions([])
      } catch {
        if (!cancelled) setEmailSuggestions([])
      } finally {
        if (!cancelled) setEmailSuggestionsLoading(false)
      }
    }, 350)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [step, hasFireballAccount, findEmail])

  const handleCreateNewClient = () => {
    setSelectedClient(null)
    setSearchQuery('')
    setSearchResults([])
    setStep(2)
    setHasFireballAccount(null)
    setFindEmail('')
    setFindAccountProfile(null)
    setEmailSuggestions([])
    setNewClientName('')
    setNewClientPhone('')
    setNewClientEmail('')
    setCreatedClientId(null)
    setError('')
  }

  const handleSelectClient = (client: ClientRow) => {
    setSelectedClient(client)
    setStep(3)
    loadClientVehicles(client.id)
    setSelectedVehicleId(null)
    setShowAddVehicleForm(false)
    setError('')
  }

  const loadClientVehicles = async (clientId: string) => {
    const { data } = await supabase
      .from('partner_vehicles')
      .select('id,brand,model,year,color')
      .eq('client_id', clientId)
      .eq('partner_id', partnerId)
    setClientVehicles((data ?? []) as VehicleRow[])
  }

  const applyProfileAsFound = useCallback(
    async (profile: {
      id: string
      first_name: string | null
      last_name: string | null
      email: string
      xp?: number
      subscription_tier?: string | null
    }) => {
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Member'
      const xp = typeof profile.xp === 'number' ? profile.xp : 0
      const tier_label = getTierNameFromXp(xp)
      const subscription_label = getSubscriptionLabel(profile.subscription_tier)
      setFindAccountProfile({ full_name: fullName, vehicles: [], tier_label, subscription_label })
      let vehicles: VehicleRow[] = []
      // Véhicules déjà liés à ce client chez le partenaire
      const { data: clientRow } = await supabase
        .from('partner_clients')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('email', profile.email)
        .maybeSingle()
      if (clientRow) {
        const { data: vList } = await supabase
          .from('partner_vehicles')
          .select('id,brand,model,year,color')
          .eq('client_id', (clientRow as { id: string }).id)
        vehicles = (vList ?? []) as VehicleRow[]
      }
      // Véhicules du garage Fireball du compte (ignoré si la RPC n'existe pas encore en base)
      let garageVehicles: VehicleRow[] = []
      try {
        const { data: garageRows } = await supabase.rpc('get_garage_vehicles_for_partner', {
          profile_id: profile.id,
        })
        garageVehicles = (Array.isArray(garageRows) ? garageRows : []) as VehicleRow[]
      } catch {
        garageVehicles = []
      }
      const seen = new Set(vehicles.map((v) => v.id))
      garageVehicles.forEach((v) => {
        if (!seen.has(v.id)) {
          seen.add(v.id)
          vehicles.push(v)
        }
      })
      setFindAccountProfile((p) => ({ ...p!, vehicles }))
    },
    [partnerId]
  )

  const handleSelectEmailSuggestion = (profile: { id: string; first_name: string | null; last_name: string | null; email: string }) => {
    setFindEmail(profile.email)
    setEmailSuggestions([])
    setError('')
    applyProfileAsFound(profile)
  }

  const handleFindAccount = async () => {
    if (!findEmail.trim()) {
      setError('Enter an email address.')
      return
    }
    setFindAccountLoading(true)
    setError('')
    const { data: profileRows, error: rpcError } = await supabase.rpc('get_profile_by_email_for_partner', {
      email_input: findEmail.trim(),
    })
    const profile = Array.isArray(profileRows) && profileRows.length > 0 ? profileRows[0] : null
    if (rpcError) {
      setError(rpcError.message || 'Unable to search. If the function is missing, run supabase_partner_lookup_profile.sql in Supabase.')
      setFindAccountLoading(false)
      return
    }
    if (profile) {
      await applyProfileAsFound(profile)
    } else {
      setError('No Fireball account found for this email.')
    }
    setFindAccountLoading(false)
  }

  const handleLinkExistingAccount = async () => {
    if (!findAccountProfile || !findEmail.trim()) return
    setCreateClientLoading(true)
    setError('')
    const { data: inserted, error: insertError } = await supabase
      .from('partner_clients')
      .insert({
        partner_id: partnerId,
        full_name: findAccountProfile.full_name,
        email: findEmail.trim(),
        phone: null,
      })
      .select('id')
      .single()
    if (insertError) {
      setError(insertError.message || 'Failed to add client.')
      setCreateClientLoading(false)
      return
    }
    setCreatedClientId((inserted as { id: string }).id)
    setClientVehicles(findAccountProfile.vehicles)
    setStep(3)
    setCreateClientLoading(false)
  }

  const handleCreateClientNoAccount = async () => {
    if (!newClientName.trim()) {
      setError('Full name is required.')
      return
    }
    setCreateClientLoading(true)
    setError('')
    const { data: inserted, error: insertError } = await supabase
      .from('partner_clients')
      .insert({
        partner_id: partnerId,
        full_name: newClientName.trim(),
        email: newClientEmail.trim() || 'no-email@placeholder.local',
        phone: newClientPhone.trim() || null,
      })
      .select('id')
      .single()
    if (insertError) {
      setError(insertError.message || 'Failed to create client.')
      setCreateClientLoading(false)
      return
    }
    setCreatedClientId((inserted as { id: string }).id)
    setClientVehicles([])
    setStep(3)
    setCreateClientLoading(false)
  }

  const handleSaveVehicle = async () => {
    if (!currentClientId || !newVehicleMake.trim() || !newVehicleModel.trim()) {
      setError('Make and model are required.')
      return
    }
    setSaveVehicleLoading(true)
    setError('')
    const { data: inserted, error: insertError } = await supabase
      .from('partner_vehicles')
      .insert({
        client_id: currentClientId,
        partner_id: partnerId,
        brand: newVehicleMake.trim(),
        model: newVehicleModel.trim(),
        year: newVehicleYear,
        color: newVehicleColor.trim() || null,
      })
      .select('id,brand,model,year,color')
      .single()
    if (insertError) {
      setError(insertError.message || 'Failed to save vehicle.')
      setSaveVehicleLoading(false)
      return
    }
    setClientVehicles((prev) => [...prev, inserted as VehicleRow])
    setNewVehicleMake('')
    setNewVehicleModel('')
    setNewVehicleYear(new Date().getFullYear())
    setNewVehicleColor('')
    setNewVehicleLicense('')
    setShowAddVehicleForm(false)
    setSaveVehicleLoading(false)
  }

  const handleRegisterInstallation = async () => {
    const vehicleId = selectedVehicleId || clientVehicles[0]?.id
    if (!currentClientId || !vehicleId) {
      setError('Please select or add a vehicle.')
      return
    }
    setRegisterLoading(true)
    setError('')
    const coating = getCoatingById(productUsed)
    const productLabel = coating?.label ?? productUsed
    const warrantyLabel = coating ? coating.warrantyLabel : null
    const recommendedNext = coating ? getRecommendedNextServiceDate(installationDate, productUsed) : null
    const notesPayload = recommendedNext ? { recommended_next_service: recommendedNext } : {}
    const notes = Object.keys(notesPayload).length > 0 ? JSON.stringify(notesPayload) : null
    const { error: insertError } = await supabase.from('partner_warranties').insert({
      partner_id: partnerId,
      client_id: currentClientId,
      vehicle_id: vehicleId,
      product_used: productLabel,
      installation_date: installationDate,
      warranty_length: warrantyLabel,
      notes,
      photos: [],
    })
    if (insertError) {
      setError(insertError.message || 'Failed to register installation.')
      setRegisterLoading(false)
      return
    }
    onSuccess?.()
    onClose()
    setRegisterLoading(false)
  }

  const handleSaveClientOnly = () => {
    onSuccess?.()
    onClose()
  }

  const resetAndClose = () => {
    setStep(1)
    setSearchQuery('')
    setSearchResults([])
    setSelectedClient(null)
    setHasFireballAccount(null)
    setCreatedClientId(null)
    setClientVehicles([])
    setSelectedVehicleId(null)
    setShowAddVehicleForm(false)
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-[160] bg-black/50" onClick={resetAndClose} aria-hidden />
      <div className="fixed right-0 top-0 z-[161] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#0f0f0f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <h2 className="text-lg font-semibold text-white">
            {step === 1 && 'Find or create a client'}
            {step === 2 && 'Client account'}
            {step === 3 && 'Vehicle selection'}
            {step === 4 && 'Service details'}
          </h2>
          <button
            type="button"
            onClick={resetAndClose}
            className="flex h-[40px] w-[40px] items-center justify-center rounded-[14px] text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 rounded-[14px] border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <>
              <p className="mb-2 text-xs text-white/50">Search by: Email, Phone, Name</p>
              <div className="relative mb-6">
                <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search client by name, email or phone…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-[14px] border border-white/10 bg-black/30 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
                />
              </div>
              {searching && <p className="text-sm text-white/50">Searching…</p>}
              {!searching && searchQuery.trim() && searchResults.length > 0 && (
                <div className="space-y-3">
                  {searchResults.map((client) => (
                    <div
                      key={client.id}
                      className="rounded-[14px] border border-white/10 bg-black/30 p-4"
                    >
                      <p className="font-medium text-white">{client.full_name}</p>
                      <p className="text-xs text-white/50">{client.email}</p>
                      <button
                        type="button"
                        onClick={() => handleSelectClient(client)}
                        className="mt-3 h-[40px] min-h-[40px] rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF]"
                      >
                        Select Client
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!searching && searchQuery.trim() && searchResults.length === 0 && (
                <p className="mb-4 text-sm text-white/50">No client found.</p>
              )}
              <button
                type="button"
                onClick={handleCreateNewClient}
                className="mt-4 h-[40px] min-h-[40px] rounded-[14px] border border-white/20 bg-[#2C2C2E] px-8 text-center text-sm text-white hover:bg-[#3A3A3C]"
              >
                Create New Client
              </button>
            </>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <>
              <p className="mb-4 text-sm text-white/70">Does the client already have a Fireball account?</p>
              <div className="mb-6 flex gap-4">
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="hasAccount"
                    checked={hasFireballAccount === 'yes'}
                    onChange={() => setHasFireballAccount('yes')}
                    className="h-4 w-4 accent-[#0A84FF]"
                  />
                  <span className="text-white">Yes – Find their account</span>
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="hasAccount"
                    checked={hasFireballAccount === 'no'}
                    onChange={() => setHasFireballAccount('no')}
                    className="h-4 w-4 accent-[#0A84FF]"
                  />
                  <span className="text-white">No – Create a new client profile</span>
                </label>
              </div>

              {hasFireballAccount === 'yes' && (
                <div className="space-y-3" ref={emailSuggestionsRef}>
                  <label className="block text-white/80 text-sm mb-2 font-medium">Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={findEmail}
                      onChange={(e) => {
                        setFindEmail(e.target.value)
                        setFindAccountProfile(null)
                      }}
                      placeholder="Start typing to see suggestions…"
                      className="w-full rounded-xl px-4 py-3 text-left text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-white/[0.06] border border-white/15 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]"
                    />
                    {emailSuggestions.length > 0 && (
                      <div
                        className="absolute z-50 w-full mt-2 rounded-2xl border border-white/20 shadow-[0_18px_40px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.24)] overflow-hidden"
                        style={{
                          background: 'rgba(20, 20, 20, 0.95)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          maxHeight: '280px',
                        }}
                      >
                        <div className="overflow-y-auto p-1.5" style={{ maxHeight: '260px' }}>
                          {emailSuggestions.map((p) => {
                            const fullName = [p.first_name, p.last_name].filter(Boolean).join(' ') || p.email
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectEmailSuggestion(p)}
                                className="w-full px-3 py-2.5 rounded-xl text-left text-xs font-medium text-white/90 hover:bg-white/10 hover:text-white transition-colors"
                              >
                                <span className="font-semibold text-white">{fullName}</span>
                                <span className="ml-2 text-white/60">{p.email}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                    {emailSuggestionsLoading && findEmail.trim().length >= 2 && (
                      <p className="mt-1.5 text-xs text-white/50">Searching…</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleFindAccount}
                    disabled={findAccountLoading}
                    className="h-[40px] min-h-[40px] rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                  >
                    {findAccountLoading ? 'Searching…' : 'Find account'}
                  </button>
                  {findAccountProfile && (
                    <div className="rounded-[14px] border border-white/10 bg-black/30 p-4">
                      <p className="font-medium text-white">{findAccountProfile.full_name}</p>
                      <p className="text-xs text-white/50">{findEmail}</p>
                      <p className="mt-2 text-[11px] text-white/70">
                        Fireball Member – {findAccountProfile.tier_label ?? 'Brushed Silver'} Tier
                      </p>
                      <p className="text-[11px] text-white/50">
                        Abonnement : {findAccountProfile.subscription_label ?? 'None'}
                      </p>
                      <button
                        type="button"
                        onClick={handleLinkExistingAccount}
                        disabled={createClientLoading}
                        className="mt-3 h-[40px] min-h-[40px] rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                      >
                        {createClientLoading ? 'Adding…' : 'Create Client'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {hasFireballAccount === 'no' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      placeholder="Full name"
                      className="w-full rounded-[14px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={newClientPhone}
                      onChange={(e) => setNewClientPhone(e.target.value)}
                      placeholder="Phone"
                      className="w-full rounded-[14px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-white/60 mb-1">Email (optional)</label>
                    <input
                      type="email"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-[14px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateClientNoAccount}
                    disabled={createClientLoading}
                    className="h-[40px] min-h-[40px] rounded-[14px] bg-[#0A84FF] px-8 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                  >
                    {createClientLoading ? 'Creating…' : 'Create Client'}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <>
              <p className="mb-3 text-xs text-white/50">Vehicles</p>
              {clientVehicles.length > 0 && (
                <div className="mb-4 space-y-2">
                  {clientVehicles.map((v) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between rounded-[14px] border border-white/10 bg-black/30 px-4 py-3"
                    >
                      <span className="text-white">
                        {v.brand} {v.model} {v.year}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVehicleId(v.id)
                          setStep(4)
                        }}
                        className="h-[40px] min-h-[40px] rounded-[14px] bg-[#0A84FF] px-4 text-center text-sm text-white hover:bg-[#007AFF]"
                      >
                        Select Vehicle
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {!showAddVehicleForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddVehicleForm(true)}
                  className="h-[40px] min-h-[40px] rounded-[14px] border border-white/20 bg-[#2C2C2E] px-6 text-center text-sm text-white hover:bg-[#3A3A3C]"
                >
                  Add New Vehicle
                </button>
              ) : (
                <div className="rounded-[14px] border border-white/10 bg-black/30 p-4 space-y-3">
                  <input
                    type="text"
                    placeholder="Vehicle Make"
                    value={newVehicleMake}
                    onChange={(e) => setNewVehicleMake(e.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Vehicle Model"
                    value={newVehicleModel}
                    onChange={(e) => setNewVehicleModel(e.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Year"
                    value={newVehicleYear}
                    onChange={(e) => setNewVehicleYear(Number(e.target.value))}
                    className="w-full rounded-[14px] border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Color"
                    value={newVehicleColor}
                    onChange={(e) => setNewVehicleColor(e.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <input
                    type="text"
                    placeholder="License Plate (optional)"
                    value={newVehicleLicense}
                    onChange={(e) => setNewVehicleLicense(e.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-black/50 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveVehicle}
                    disabled={saveVehicleLoading}
                    className="h-[40px] min-h-[40px] w-full rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                  >
                    {saveVehicleLoading ? 'Saving…' : 'Save Vehicle'}
                  </button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setStep(4)}
                className="mt-4 h-[40px] min-h-[40px] rounded-[14px] border border-white/20 bg-[#2C2C2E] px-6 text-center text-sm text-white hover:bg-[#3A3A3C]"
              >
                Continue to service
              </button>
            </>
          )}

          {/* Step 4 — Service: uniquement type + sous-options si Ceramic */}
          {step === 4 && (
            <>
              <p className="mb-3 text-xs font-medium text-white/80">Service</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {SERVICE_TYPES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setServiceType(s.value)}
                    className={`h-[40px] min-h-[40px] rounded-xl px-4 text-sm font-medium transition-all ${
                      serviceType === s.value
                        ? 'bg-[#0A84FF] text-white'
                        : 'bg-white/[0.06] border border-white/15 text-white/80 hover:bg-white/10'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>

              {serviceType === 'ceramic' && (
                <div className="space-y-4 mb-6">
                  <LiquidGlassSelect
                    label="Produit Fireball"
                    value={productUsed}
                    options={COATING_OPTIONS}
                    onChange={setProductUsed}
                    searchable={false}
                  />
                  <div>
                    <label className="block text-white/80 text-sm mb-2 font-medium">Date d’installation</label>
                    <IOSStyleCalendar value={installationDate} onChange={setInstallationDate} />
                  </div>
                  {(() => {
                    const coating = getCoatingById(productUsed)
                    const warrantyEnd = coating ? getWarrantyEndDate(installationDate, productUsed) : null
                    const nextService = coating ? getRecommendedNextServiceDate(installationDate, productUsed) : null
                    return (
                      <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                        {coating && (
                          <>
                            <p className="text-xs text-white/50">Garantie : {coating.warrantyLabel}</p>
                            {warrantyEnd && (
                              <p className="text-sm text-white/80">Fin garantie : {new Date(warrantyEnd).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            )}
                            {nextService && (
                              <p className="text-sm text-[#0A84FF]">Prochain service conseillé : {new Date(nextService).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} (visible dans My Garage pour le client)</p>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {serviceType !== 'ceramic' && (
                <div className="mb-6">
                  <label className="block text-white/80 text-sm mb-2 font-medium">Date</label>
                  <IOSStyleCalendar value={installationDate} onChange={setInstallationDate} />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegisterInstallation}
                  disabled={registerLoading || !(selectedVehicleId || clientVehicles[0]?.id)}
                  className="h-[40px] min-h-[40px] flex-1 rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                >
                  {registerLoading ? 'Enregistrement…' : 'Register Installation'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientOnly}
                  className="h-[40px] min-h-[40px] rounded-[14px] border border-white/20 bg-[#2C2C2E] px-6 text-center text-sm text-white hover:bg-[#3A3A3C]"
                >
                  Save Client
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  )
}
