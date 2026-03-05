import { useState, useEffect, useCallback } from 'react'
import { IconSearch, IconX } from '@tabler/icons-react'
import { LiquidGlassSelect } from '@/components/LiquidGlassSelect'
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

const FIREBALL_PRODUCTS = [
  { value: 'aegis', label: 'Aegis' },
  { value: 'typhoon', label: 'Typhoon' },
  { value: 'devils_blood', label: "Devil's Blood" },
  { value: 'dok_do', label: 'Dok Do' },
  { value: 'silla', label: 'Silla' },
]

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
  const [findAccountProfile, setFindAccountProfile] = useState<{ full_name: string; vehicles: VehicleRow[] } | null>(null)
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
  const [productUsed, setProductUsed] = useState('aegis')
  const [installationDate, setInstallationDate] = useState(new Date().toISOString().slice(0, 10))
  const [activateWarranty, setActivateWarranty] = useState(true)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [error, setError] = useState('')

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

  const handleCreateNewClient = () => {
    setSelectedClient(null)
    setSearchQuery('')
    setSearchResults([])
    setStep(2)
    setHasFireballAccount(null)
    setFindEmail('')
    setFindAccountProfile(null)
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

  const handleFindAccount = async () => {
    if (!findEmail.trim()) {
      setError('Enter an email address.')
      return
    }
    setFindAccountLoading(true)
    setError('')
    // RPC allows partners to look up a profile by email (RLS blocks direct profiles read for other users)
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
      const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Member'
      setFindAccountProfile({ full_name: fullName, vehicles: [] })
      const { data: vehicles } = await supabase
        .from('partner_vehicles')
        .select('id,brand,model,year,color')
        .eq('partner_id', partnerId)
      const clientRows = await supabase
        .from('partner_clients')
        .select('id')
        .eq('partner_id', partnerId)
        .eq('email', profile.email)
        .maybeSingle()
      if (clientRows.data) {
        const { data: vList } = await supabase
          .from('partner_vehicles')
          .select('id,brand,model,year,color')
          .eq('client_id', (clientRows.data as { id: string }).id)
        setFindAccountProfile((p) => ({ ...p!, vehicles: (vList ?? []) as VehicleRow[] }))
      }
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
    const productLabel = FIREBALL_PRODUCTS.find((p) => p.value === productUsed)?.label ?? productUsed
    const { error: insertError } = await supabase.from('partner_warranties').insert({
      partner_id: partnerId,
      client_id: currentClientId,
      vehicle_id: vehicleId,
      product_used: productLabel,
      installation_date: installationDate,
      warranty_length: activateWarranty ? 'Standard' : null,
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
      <div className="fixed right-0 top-0 z-[161] flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#1C1C1E] shadow-2xl">
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
                      <p className="mt-2 text-[11px] text-white/40">Fireball Member – Carbon Tier</p>
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
                <div className="space-y-3">
                  <label className="block text-xs text-white/60">Email</label>
                  <input
                    type="email"
                    value={findEmail}
                    onChange={(e) => setFindEmail(e.target.value)}
                    placeholder="Client email"
                    className="w-full rounded-[14px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/40 focus:outline-none"
                  />
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

          {/* Step 4 */}
          {step === 4 && (
            <>
              <p className="mb-3 text-xs text-white/50">Service Details</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-white/60 mb-1">Service Type</label>
                  <LiquidGlassSelect
                    label=""
                    value={serviceType}
                    options={SERVICE_TYPES}
                    onChange={setServiceType}
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Fireball Product Used</label>
                  <LiquidGlassSelect
                    label=""
                    value={productUsed}
                    options={FIREBALL_PRODUCTS}
                    onChange={setProductUsed}
                    searchable={false}
                  />
                </div>
                <div>
                  <label className="block text-xs text-white/60 mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full rounded-[14px] border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white focus:outline-none"
                  />
                </div>
                <label className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={activateWarranty}
                    onChange={(e) => setActivateWarranty(e.target.checked)}
                    className="h-4 w-4 rounded accent-[#0A84FF]"
                  />
                  <span className="text-white">Activate Fireball Warranty?</span>
                </label>
                <p className="text-xs text-white/50">Upload photos (optional)</p>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleRegisterInstallation}
                  disabled={registerLoading || !(selectedVehicleId || clientVehicles[0]?.id)}
                  className="h-[40px] min-h-[40px] flex-1 rounded-[14px] bg-[#0A84FF] px-6 text-center text-sm text-white hover:bg-[#007AFF] disabled:opacity-50"
                >
                  {registerLoading ? 'Registering…' : 'Register Installation'}
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
