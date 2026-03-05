import { useEffect, useState } from 'react'
import {
  IconSearch,
  IconPlus,
  IconCar,
  IconChevronRight,
  IconX,
  IconPhoto,
  IconNote,
  IconCalendar,
  IconCertificate,
} from '@tabler/icons-react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'
import { cn } from '@/lib/utils'

interface ClientRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

interface VehicleRow {
  id: string
  brand: string
  model: string
  year: number
  color: string | null
}

interface WarrantyRow {
  id: string
  product_used: string
  installation_date: string
  vehicle_id: string
}

const FILTER_OPTIONS = [
  { value: 'all', label: 'All Clients' },
  { value: 'recent', label: 'Recent Clients' },
  { value: 'active', label: 'With Active Coating' },
  { value: 'vip', label: 'VIP Clients' },
]

export function BusinessClientsPage() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientRow[]>([])
  const [vehiclesByClient, setVehiclesByClient] = useState<Record<string, VehicleRow[]>>({})
  const [warrantiesByClient, setWarrantiesByClient] = useState<Record<string, WarrantyRow[]>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [filterOpen, setFilterOpen] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)

  const loadData = async () => {
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

    const { data: clientsData } = await supabase
      .from('partner_clients')
      .select('id,full_name,email,phone,created_at')
      .eq('partner_id', pid)
      .order('created_at', { ascending: false })
    const clientList = (clientsData ?? []) as ClientRow[]
    setClients(clientList)

    const clientIds = clientList.map((c) => c.id)
    if (clientIds.length > 0) {
      const { data: vehiclesData } = await supabase
        .from('partner_vehicles')
        .select('id,client_id,brand,model,year,color')
        .in('client_id', clientIds)
      const vehicles = (vehiclesData ?? []) as (VehicleRow & { client_id: string })[]
      const byClient: Record<string, VehicleRow[]> = {}
      vehicles.forEach((v) => {
        const { client_id, ...rest } = v
        if (!byClient[client_id]) byClient[client_id] = []
        byClient[client_id].push(rest)
      })
      setVehiclesByClient(byClient)

      const { data: warrantiesData } = await supabase
        .from('partner_warranties')
        .select('id,client_id,product_used,installation_date,vehicle_id')
        .in('client_id', clientIds)
      const warranties = (warrantiesData ?? []) as (WarrantyRow & { client_id: string })[]
      const byClientW: Record<string, WarrantyRow[]> = {}
      warranties.forEach((w) => {
        const { client_id, ...rest } = w
        if (!byClientW[client_id]) byClientW[client_id] = []
        byClientW[client_id].push(rest)
      })
      setWarrantiesByClient(byClientW)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase()
    if (q && !c.full_name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q) && !(c.phone || '').includes(q)) return false
    return true
  })

  const selectedClient = selectedClientId ? clients.find((c) => c.id === selectedClientId) : null
  const selectedVehicles = selectedClientId ? vehiclesByClient[selectedClientId] ?? [] : []
  const selectedWarranties = selectedClientId ? warrantiesByClient[selectedClientId] ?? [] : []

  const openClientDetail = (id: string) => {
    setSelectedClientId(id)
    setDetailPanelOpen(true)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* 1. Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white tracking-tight">Clients</h1>
          <p className="mt-1 text-sm text-white/60">Manage your customers, vehicles, and service history.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0A84FF] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#007AFF]"
          >
            <IconPlus className="h-4 w-4" />
            Add Client
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-[#2C2C2E] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3A3A3C]"
          >
            New Installation
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            type="search"
            placeholder="Search clients, vehicles, or phone number"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#1C1C1E] py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 focus:border-white/30 focus:outline-none"
          />
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen(!filterOpen)}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#1C1C1E] px-4 py-2.5 text-sm text-white/90"
          >
            {FILTER_OPTIONS.find((f) => f.value === filter)?.label ?? 'All Clients'}
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {filterOpen && (
            <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-white/10 bg-[#1C1C1E] py-1 shadow-xl">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setFilter(opt.value)
                    setFilterOpen(false)
                  }}
                  className={cn(
                    'w-full px-4 py-2 text-left text-sm',
                    filter === opt.value ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Client List */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-[#1C1C1E]/80 p-5 animate-pulse">
              <div className="h-12 w-12 rounded-full bg-white/10" />
              <div className="mt-3 h-5 w-3/4 rounded bg-white/10" />
              <div className="mt-2 h-4 w-1/2 rounded bg-white/10" />
            </div>
          ))
        ) : filteredClients.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-white/10 bg-[#1C1C1E]/50 p-12 text-center text-white/60">
            No clients found. Add your first client to get started.
          </div>
        ) : (
          filteredClients.map((client) => {
            const vehicles = vehiclesByClient[client.id] ?? []
            const warranties = warrantiesByClient[client.id] ?? []
            const lastWarranty = warranties.sort((a, b) => b.installation_date.localeCompare(a.installation_date))[0]
            const vehicleLabel = vehicles.length > 0 ? `${vehicles[0].brand} ${vehicles[0].model} ${vehicles[0].year}` : 'No vehicle'
            const statusBadge = warranties.length > 0 ? 'Active Protection' : null
            return (
              <button
                key={client.id}
                type="button"
                onClick={() => openClientDetail(client.id)}
                className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-5 text-left transition-colors hover:border-white/20 hover:bg-[#1C1C1E]/90"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0A84FF]/20 text-lg font-semibold text-[#0A84FF]">
                    {client.full_name.charAt(0).toUpperCase()}
                  </div>
                  <IconChevronRight className="h-5 w-5 shrink-0 text-white/40" />
                </div>
                <h3 className="mt-3 text-base font-semibold text-white">{client.full_name}</h3>
                <div className="mt-1 flex items-center gap-2 text-sm text-white/60">
                  <IconCar className="h-4 w-4 shrink-0" />
                  {vehicleLabel}
                </div>
                <p className="mt-1 text-xs text-white/50">
                  {lastWarranty ? `Ceramic Coating · Last visit: ${new Date(lastWarranty.installation_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : 'No service yet'}
                </p>
                <p className="mt-1 text-xs text-white/50">Installations: {warranties.length}</p>
                {statusBadge && (
                  <span className="mt-3 inline-block rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-emerald-300">
                    {statusBadge}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* 3. Client Details Panel (slide-over) */}
      {detailPanelOpen && selectedClient && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setDetailPanelOpen(false)}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-white/10 bg-[#1C1C1E] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className="text-lg font-semibold text-white">Client details</h2>
              <button
                type="button"
                onClick={() => setDetailPanelOpen(false)}
                className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Client Information */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Client information</h3>
                <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                  <p className="text-white font-medium">{selectedClient.full_name}</p>
                  <p className="text-sm text-white/70">{selectedClient.email}</p>
                  {selectedClient.phone && <p className="text-sm text-white/70">{selectedClient.phone}</p>}
                  <p className="text-sm text-white/50">Address — To be added</p>
                </div>
              </section>

              {/* Vehicles */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Vehicles</h3>
                {selectedVehicles.length === 0 ? (
                  <p className="text-sm text-white/50">No vehicles registered.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedVehicles.map((v) => (
                      <div key={v.id} className="rounded-xl border border-white/10 bg-black/30 p-4">
                        <p className="font-medium text-white">{v.brand} {v.model}</p>
                        <p className="text-sm text-white/60">{v.year} · {v.color || '—'}</p>
                        <p className="text-xs text-white/50">License plate — To be added</p>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Service History */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Service history</h3>
                {selectedWarranties.length === 0 ? (
                  <p className="text-sm text-white/50">No services yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {selectedWarranties
                      .sort((a, b) => b.installation_date.localeCompare(a.installation_date))
                      .map((w) => (
                        <li key={w.id} className="rounded-xl border border-white/10 bg-black/30 px-4 py-3">
                          <p className="text-white">{w.product_used}</p>
                          <p className="text-xs text-white/50">Date: {new Date(w.installation_date).toLocaleDateString()}</p>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              {/* Installation Photos placeholder */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Installation photos</h3>
                <div className="rounded-xl border border-dashed border-white/20 bg-black/20 p-8 text-center text-white/50 text-sm">
                  Grid gallery — upload photos from actions below
                </div>
              </section>

              {/* Actions */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Actions</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 py-2.5 text-sm text-white hover:bg-[#3A3A3C]">
                    <IconCar className="h-4 w-4" /> Add Vehicle
                  </button>
                  <button type="button" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 py-2.5 text-sm text-white hover:bg-[#3A3A3C]">
                    <IconCertificate className="h-4 w-4" /> Add Service
                  </button>
                  <button type="button" className="flex items-center gap-2 rounded-xl bg-[#0A84FF] px-3 py-2.5 text-sm text-white hover:bg-[#007AFF]">
                    <IconCertificate className="h-4 w-4" /> Register Fireball Installation
                  </button>
                  <button type="button" className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 py-2.5 text-sm text-white hover:bg-[#3A3A3C]">
                    <IconPhoto className="h-4 w-4" /> Upload Photos
                  </button>
                  <button type="button" className="col-span-2 flex items-center gap-2 rounded-xl border border-white/10 bg-[#2C2C2E] px-3 py-2.5 text-sm text-white hover:bg-[#3A3A3C]">
                    <IconNote className="h-4 w-4" /> Add Notes
                  </button>
                </div>
              </section>

              {/* Client Notes (internal) */}
              <section className="mb-8">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Client notes</h3>
                <p className="text-sm text-white/50 italic">Internal notes only visible to you. e.g. Customer prefers hand wash only.</p>
                <textarea
                  placeholder="Add a note…"
                  className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/20"
                  rows={2}
                />
              </section>

              {/* Reminders */}
              <section>
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-white/50 mb-3">Reminders</h3>
                <ul className="space-y-2 text-sm text-white/60">
                  <li className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 shrink-0 text-amber-400/80" />
                    Coating inspection due in 12 months
                  </li>
                  <li className="flex items-center gap-2">
                    <IconCalendar className="h-4 w-4 shrink-0 text-amber-400/80" />
                    Maintenance wash recommended
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
