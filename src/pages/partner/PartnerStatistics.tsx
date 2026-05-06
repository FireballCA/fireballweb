import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

type TimeRange = '30d' | '90d' | '12m' | 'all'

interface ClientRow {
  id: string
  full_name: string
  created_at: string
}

interface VehicleRow {
  id: string
  client_id: string
  brand: string
  model: string
  year: number
  created_at: string
}

interface WarrantyRow {
  id: string
  client_id: string
  vehicle_id: string
  product_used: string
  installation_date: string
  created_at: string
}

interface ActivityEvent {
  id: string
  type: 'client' | 'vehicle' | 'installation'
  label: string
  date: Date
  meta?: string
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })
}

function formatShortDate(d: Date | null): string {
  if (!d) return '-'
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}

function getTimeRangeStart(range: TimeRange): Date | null {
  const now = new Date()
  if (range === 'all') return null
  const d = new Date(now)
  if (range === '30d') {
    d.setDate(d.getDate() - 30)
  } else if (range === '90d') {
    d.setDate(d.getDate() - 90)
  } else if (range === '12m') {
    d.setMonth(d.getMonth() - 11)
    d.setDate(1)
  }
  return d
}

function buildMonthlySeries(
  dates: Date[],
  range: TimeRange,
): { label: string; key: string; count: number }[] {
  if (!dates.length) return []
  const now = new Date()
  const start = getTimeRangeStart(range)
  const buckets = new Map<string, { label: string; count: number }>()

  const sourceDates =
    range === '12m'
      ? (() => {
          const arr: Date[] = []
          const cursor = start ? new Date(start) : new Date(now.getFullYear(), now.getMonth() - 11, 1)
          for (let i = 0; i < 12; i += 1) {
            arr.push(new Date(cursor.getFullYear(), cursor.getMonth() + i, 1))
          }
          return arr
        })()
      : dates

  sourceDates.forEach((d) => {
    if (start && d < start) return
    if (d > now) return
    const key = monthKey(d)
    if (!buckets.has(key)) {
      buckets.set(key, { label: formatMonthLabel(d), count: 0 })
    }
  })

  dates.forEach((d) => {
    if (start && d < start) return
    if (d > now) return
    const key = monthKey(d)
    const existing = buckets.get(key)
    if (existing) existing.count += 1
  })

  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([key, value]) => ({ key, label: value.label, count: value.count }))
}

function buildBrandDistribution(vehicles: VehicleRow[]): { label: string; count: number }[] {
  const map = new Map<string, number>()
  vehicles.forEach((v) => {
    const brand = (v.brand || 'Autre').trim() || 'Autre'
    map.set(brand, (map.get(brand) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

function buildYearDistribution(vehicles: VehicleRow[]): { label: string; count: number }[] {
  const map = new Map<number, number>()
  vehicles.forEach((v) => {
    if (!v.year) return
    map.set(v.year, (map.get(v.year) ?? 0) + 1)
  })
  return Array.from(map.entries())
    .map(([year, count]) => ({ label: String(year), count }))
    .sort((a, b) => Number(a.label) - Number(b.label))
}

function buildProductStats(warranties: WarrantyRow[]) {
  const map = new Map<
    string,
    {
      product: string
      installations: number
      vehicleIds: Set<string>
    }
  >()
  warranties.forEach((w) => {
    const name = (w.product_used || 'Autre produit').trim() || 'Autre produit'
    const key = name.toLowerCase()
    const entry = map.get(key) ?? { product: name, installations: 0, vehicleIds: new Set<string>() }
    entry.installations += 1
    if (w.vehicle_id) entry.vehicleIds.add(w.vehicle_id)
    map.set(key, entry)
  })
  const list = Array.from(map.values()).map((p) => ({
    product: p.product,
    installations: p.installations,
    vehiclesProtected: p.vehicleIds.size,
  }))
  const totalInstallations = list.reduce((sum, p) => sum + p.installations, 0) || 1
  return {
    list: list
      .map((p) => ({
        ...p,
        percentage: (p.installations / totalInstallations) * 100,
      }))
      .sort((a, b) => b.installations - a.installations),
    totalInstallations,
  }
}

function buildClientInstallationStats(
  clients: ClientRow[],
  vehicles: VehicleRow[],
  warranties: WarrantyRow[],
) {
  const vehiclesByClient = new Map<string, VehicleRow[]>()
  vehicles.forEach((v) => {
    if (!v.client_id) return
    const arr = vehiclesByClient.get(v.client_id) ?? []
    arr.push(v)
    vehiclesByClient.set(v.client_id, arr)
  })

  const warrantiesByClient = new Map<string, WarrantyRow[]>()
  warranties.forEach((w) => {
    if (!w.client_id) return
    const arr = warrantiesByClient.get(w.client_id) ?? []
    arr.push(w)
    warrantiesByClient.set(w.client_id, arr)
  })

  const rows = clients.map((c) => {
    const clientVehicles = vehiclesByClient.get(c.id) ?? []
    const clientInstalls = warrantiesByClient.get(c.id) ?? []
    const lastService = clientInstalls
      .map((w) => parseDate(w.installation_date))
      .filter((d): d is Date => !!d)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null
    return {
      client: c,
      vehicles: clientVehicles,
      installations: clientInstalls,
      lastService,
    }
  })

  return {
    rows,
    topClients: [...rows]
      .filter((r) => r.installations.length > 0)
      .sort((a, b) => b.installations.length - a.installations.length)
      .slice(0, 8),
  }
}

function buildActivityFeed(
  clients: ClientRow[],
  vehicles: VehicleRow[],
  warranties: WarrantyRow[],
  clientById: Map<string, ClientRow>,
  vehicleById: Map<string, VehicleRow>,
): ActivityEvent[] {
  const events: ActivityEvent[] = []
  clients.forEach((c) => {
    const d = parseDate(c.created_at)
    if (!d) return
    events.push({
      id: `client-${c.id}`,
      type: 'client',
      label: `Nouveau client ajouté · ${c.full_name}`,
      date: d,
    })
  })
  vehicles.forEach((v) => {
    const d = parseDate(v.created_at)
    if (!d) return
    const client = clientById.get(v.client_id)
    events.push({
      id: `vehicle-${v.id}`,
      type: 'vehicle',
      label: `Véhicule ajouté · ${v.brand} ${v.model}`,
      date: d,
      meta: client ? client.full_name : undefined,
    })
  })
  warranties.forEach((w) => {
    const d = parseDate(w.installation_date) ?? parseDate(w.created_at)
    if (!d) return
    const vehicle = vehicleById.get(w.vehicle_id)
    const client = w.client_id ? clientById.get(w.client_id) : undefined
    const vehicleLabel = vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Véhicule'
    const product = w.product_used || 'Produit Fireball'
    events.push({
      id: `installation-${w.id}`,
      type: 'installation',
      label: `${product} installé sur ${vehicleLabel}`,
      date: d,
      meta: client?.full_name,
    })
  })
  return events.sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 30)
}

function SimpleBarChart({ data }: { data: { label: string; count: number }[] }) {
  const max = data.reduce((m, d) => (d.count > m ? d.count : m), 0) || 1
  return (
    <div className="space-y-2">
      {data.length === 0 && (
        <p className="text-xs text-white/50">Pas encore de données.</p>
      )}
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-28 text-[11px] text-white/60 truncate">{d.label}</div>
          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#FF375F]"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 text-right text-[11px] text-white/75">{d.count}</div>
        </div>
      ))}
    </div>
  )
}

function SimpleAreaChart({ data }: { data: { label: string; count: number }[] }) {
  const max = data.reduce((m, d) => (d.count > m ? d.count : m), 0) || 1
  return (
    <div className="h-40 relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 via-white/0 to-transparent pointer-events-none" />
      <div className="absolute inset-3 flex items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-full bg-gradient-to-t from-[#0A84FF] to-[#FF375F]"
              style={{ height: `${(d.count / max) * 100 || 4}%` }}
            />
            <span className="mt-1 text-[10px] text-white/45 truncate">{d.label}</span>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-white/50">Pas encore de données.</p>
        </div>
      )}
    </div>
  )
}

function SimpleDonutChart({ data }: { data: { label: string; value: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0) || 1
  let cumulative = 0
  const segments = data.map((d, index) => {
    const start = cumulative / total
    const length = d.value / total
    cumulative += d.value
    const strokeDasharray = `${length * 100} ${100 - length * 100}`
    const strokeDashoffset = -start * 100
    const colors = ['#0A84FF', '#FF375F', '#32D74B', '#FF9F0A', '#BF5AF2', '#64D2FF']
    const color = colors[index % colors.length]
    return { label: d.label, value: d.value, strokeDasharray, strokeDashoffset, color }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 36 36" className="w-28 h-28 -rotate-90">
        <circle
          cx="18"
          cy="18"
          r="14"
          fill="transparent"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="4"
        />
        {segments.map((s) => (
          <circle
            key={s.label}
            cx="18"
            cy="18"
            r="14"
            fill="transparent"
            stroke={s.color}
            strokeWidth="4"
            strokeDasharray={s.strokeDasharray}
            strokeDashoffset={s.strokeDashoffset}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex-1 space-y-1.5">
        {data.length === 0 && (
          <p className="text-xs text-white/50">Pas encore de données.</p>
        )}
        {segments.map((s) => {
          const percent = (s.value / total) * 100
          return (
            <div key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-white/80">{s.label}</span>
              </div>
              <span className="text-white/60">{percent.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function PartnerStatistics() {
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>('12m')
  const [clients, setClients] = useState<ClientRow[]>([])
  const [vehicles, setVehicles] = useState<VehicleRow[]>([])
  const [warranties, setWarranties] = useState<WarrantyRow[]>([])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const profile = await getCurrentUserProfile()
      if (!profile?.id) {
        setLoading(false)
        return
      }
      const { data: pc } = await supabase
        .from('partner_companies')
        .select('id')
        .eq('user_id', profile.id)
        .eq('status', 'partner')
        .maybeSingle()
      if (!pc) {
        setLoading(false)
        return
      }
      const partnerId = (pc as { id: string }).id

      const [clientsRes, vehiclesRes, warrantiesRes] = await Promise.all([
        supabase
          .from('partner_clients')
          .select('id,full_name,created_at')
          .eq('partner_id', partnerId),
        supabase
          .from('partner_vehicles')
          .select('id,client_id,brand,model,year,created_at')
          .eq('partner_id', partnerId),
        supabase
          .from('partner_warranties')
          .select('id,client_id,vehicle_id,product_used,installation_date,created_at')
          .eq('partner_id', partnerId),
      ])

      if (!mounted) return
      setClients((clientsRes.data ?? []) as ClientRow[])
      setVehicles((vehiclesRes.data ?? []) as VehicleRow[])
      setWarranties((warrantiesRes.data ?? []) as WarrantyRow[])
      setLoading(false)
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c] as const)),
    [clients],
  )
  const vehicleById = useMemo(
    () => new Map(vehicles.map((v) => [v.id, v] as const)),
    [vehicles],
  )

  const installationDates = useMemo(
    () =>
      warranties
        .map((w) => parseDate(w.installation_date))
        .filter((d): d is Date => !!d),
    [warranties],
  )

  const now = new Date()
  const thisMonthInstallations = installationDates.filter((d) => isSameMonth(d, now)).length
  const thisYearInstallations = installationDates.filter(
    (d) => d.getFullYear() === now.getFullYear(),
  ).length

  const clientCreatedDates = useMemo(
    () =>
      clients
        .map((c) => parseDate(c.created_at))
        .filter((d): d is Date => !!d),
    [clients],
  )
  const thisMonthClients = clientCreatedDates.filter((d) => isSameMonth(d, now)).length

  const vehicleCreatedDates = useMemo(
    () =>
      vehicles
        .map((v) => parseDate(v.created_at))
        .filter((d): d is Date => !!d),
    [vehicles],
  )
  const thisMonthVehicles = vehicleCreatedDates.filter((d) => isSameMonth(d, now)).length

  const vehicleIdsWithInstall = useMemo(() => {
    const s = new Set<string>()
    warranties.forEach((w) => {
      if (w.vehicle_id) s.add(w.vehicle_id)
    })
    return s
  }, [warranties])
  const protectedVehiclesCount = vehicles.filter((v) => vehicleIdsWithInstall.has(v.id)).length

  const warrantiesByClient = useMemo(() => {
    const map = new Map<string, WarrantyRow[]>()
    warranties.forEach((w) => {
      if (!w.client_id) return
      const arr = map.get(w.client_id) ?? []
      arr.push(w)
      map.set(w.client_id, arr)
    })
    return map
  }, [warranties])

  const vehiclesByClient = useMemo(() => {
    const map = new Map<string, VehicleRow[]>()
    vehicles.forEach((v) => {
      if (!v.client_id) return
      const arr = map.get(v.client_id) ?? []
      arr.push(v)
      map.set(v.client_id, arr)
    })
    return map
  }, [vehicles])

  const totalClients = clients.length
  const totalVehicles = vehicles.length
  const totalInstallations = warranties.length

  const avgInstallsPerClient = totalClients ? totalInstallations / totalClients : 0
  const avgVehiclesPerClient = totalClients ? totalVehicles / totalClients : 0

  const clientsWithInstalls = Array.from(warrantiesByClient.values()).filter(
    (arr) => arr.length > 0,
  )
  const returningClientsCount = clientsWithInstalls.filter((arr) => arr.length >= 2).length
  const returningClientsRate =
    clientsWithInstalls.length === 0
      ? 0
      : (returningClientsCount / clientsWithInstalls.length) * 100

  const installsPerClient = clients.map((c) => warrantiesByClient.get(c.id)?.length ?? 0)
  const installsPerClientWithMultiple = installsPerClient.filter((n) => n >= 2)
  let avgTimeBetweenServicesDays = 0
  if (clientsWithInstalls.length > 0) {
    const diffs: number[] = []
    warrantiesByClient.forEach((list) => {
      const dates = list
        .map((w) => parseDate(w.installation_date))
        .filter((d): d is Date => !!d)
        .sort((a, b) => a.getTime() - b.getTime())
      for (let i = 1; i < dates.length; i += 1) {
        const diffDays = (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
        if (diffDays > 0) diffs.push(diffDays)
      }
    })
    if (diffs.length > 0) {
      avgTimeBetweenServicesDays = diffs.reduce((sum, d) => sum + d, 0) / diffs.length
    }
  }

  const monthlyInstallationsSeries = useMemo(
    () => buildMonthlySeries(installationDates, timeRange),
    [installationDates, timeRange],
  )
  const monthlyClientsSeries = useMemo(
    () => buildMonthlySeries(clientCreatedDates, timeRange),
    [clientCreatedDates, timeRange],
  )
  const monthlyVehiclesSeries = useMemo(
    () => buildMonthlySeries(vehicleCreatedDates, timeRange),
    [vehicleCreatedDates, timeRange],
  )

  const weeklyInstallationsSeries = useMemo(() => {
    const map = new Map<string, number>()
    warranties.forEach((w) => {
      const d = parseDate(w.installation_date)
      if (!d) return
      const start = getTimeRangeStart('90d')
      if (start && d < start) return
      const weekStart = new Date(d)
      const day = weekStart.getDay()
      const diff = (day + 6) % 7
      weekStart.setDate(weekStart.getDate() - diff)
      const key = weekStart.toISOString().slice(0, 10)
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    const entries = Array.from(map.entries())
      .map(([key, count]) => ({
        key,
        date: new Date(key),
        count,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
    return entries.map((e) => ({
      label: e.date.toLocaleDateString('fr-CA', { month: 'short', day: 'numeric' }),
      count: e.count,
    }))
  }, [warranties])

  const monthsSpan =
    installationDates.length === 0
      ? 0
      : (() => {
          const sorted = [...installationDates].sort(
            (a, b) => a.getTime() - b.getTime(),
          )
          const first = sorted[0]
          const last = sorted[sorted.length - 1]
          return (
            (last.getFullYear() - first.getFullYear()) * 12 +
            (last.getMonth() - first.getMonth()) +
            1
          )
        })()
  const avgInstallationsPerMonth = monthsSpan ? totalInstallations / monthsSpan : 0

  const productStats = useMemo(() => buildProductStats(warranties), [warranties])

  const brandDistributionAll = useMemo(
    () => buildBrandDistribution(vehicles),
    [vehicles],
  )
  const brandDistributionProtected = useMemo(
    () => buildBrandDistribution(vehicles.filter((v) => vehicleIdsWithInstall.has(v.id))),
    [vehicles, vehicleIdsWithInstall],
  )
  const yearDistribution = useMemo(
    () => buildYearDistribution(vehicles),
    [vehicles],
  )

  const { rows: _clientRows, topClients } = useMemo(
    () => buildClientInstallationStats(clients, vehicles, warranties),
    [clients, vehicles, warranties],
  )

  const recentClients = [...clients]
    .sort((a, b) => {
      const da = parseDate(a.created_at)?.getTime() ?? 0
      const db = parseDate(b.created_at)?.getTime() ?? 0
      return db - da
    })
    .slice(0, 8)

  const recentInstallations = [...warranties]
    .sort((a, b) => {
      const da = parseDate(a.installation_date)?.getTime() ?? 0
      const db = parseDate(b.installation_date)?.getTime() ?? 0
      return db - da
    })
    .slice(0, 12)

  const activityFeed = useMemo(
    () => buildActivityFeed(clients, vehicles, warranties, clientById, vehicleById),
    [clients, vehicles, warranties, clientById, vehicleById],
  )

  const mostActiveClient = topClients[0] ?? null
  const installsByVehicle = useMemo(() => {
    const m = new Map<string, number>()
    warranties.forEach((w) => {
      if (!w.vehicle_id) return
      m.set(w.vehicle_id, (m.get(w.vehicle_id) ?? 0) + 1)
    })
    return m
  }, [warranties])
  const mostServicedVehicle = (() => {
    let bestId: string | null = null
    let bestCount = 0
    installsByVehicle.forEach((count, vid) => {
      if (count > bestCount) {
        bestCount = count
        bestId = vid
      }
    })
    return bestId ? { vehicle: vehicleById.get(bestId) ?? null, count: bestCount } : null
  })()

  const mostInstalledProduct = productStats.list[0] ?? null

  const installsByMonth = monthlyInstallationsSeries
  const mostActiveMonth =
    installsByMonth.length > 0
      ? installsByMonth.reduce(
          (best, cur) => (cur.count > best.count ? cur : best),
          installsByMonth[0],
        )
      : null

  const protectionCoverageRate =
    totalVehicles === 0 ? 0 : (protectedVehiclesCount / totalVehicles) * 100

  const smartMostActiveMonth = mostActiveMonth

  const productUsageForPie = useMemo(() => {
    const groups = ['Typhoon', "Devil's Blood", 'Butterfly', 'Dok Do'] as const
    const map = new Map<string, number>()
    warranties.forEach((w) => {
      const name = (w.product_used || '').toLowerCase()
      let key = 'Autres produits'
      if (name.includes('typhoon')) key = 'Typhoon'
      else if (name.includes('devil')) key = "Devil's Blood"
      else if (name.includes('butterfly')) key = 'Butterfly'
      else if (name.includes('dok do') || name.includes('dokdo')) key = 'Dok Do'
      map.set(key, (map.get(key) ?? 0) + 1)
    })
    const data: { label: string; value: number }[] = []
    groups.forEach((g) => {
      const v = map.get(g)
      if (v) data.push({ label: g, value: v })
    })
    const other = map.get('Autres produits')
    if (other) data.push({ label: 'Autres produits Fireball', value: other })
    return data
  }, [warranties])

  const formatNumber = (n: number) =>
    Number.isFinite(n) ? n.toLocaleString('fr-CA', { maximumFractionDigits: 1 }) : '0'

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse rounded-3xl bg-white/5 h-40 w-full mb-6" />
        <div className="animate-pulse rounded-3xl bg-white/5 h-80 w-full" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-nav uppercase tracking-[0.18em] text-white/50">
            Fireball Business
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">
            Statistiques installateur
          </h1>
          <p className="text-sm text-white/60 max-w-2xl">
            Vue unifiée de vos clients, véhicules, installations et produits Fireball – toutes les
            métriques sont reliées aux mêmes enregistrements.
          </p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-white/55">
            Basé sur les tables&nbsp;
            <span className="font-mono text-white/80">partner_clients</span>,{' '}
            <span className="font-mono text-white/80">partner_vehicles</span>,{' '}
            <span className="font-mono text-white/80">partner_warranties</span>.
          </p>
          <div className="inline-flex items-center gap-1 rounded-full bg-white/[0.04] border border-white/10 p-1">
            {[
              { value: '30d', label: '30 jours' },
              { value: '90d', label: '90 jours' },
              { value: '12m', label: '12 mois' },
              { value: 'all', label: 'Tout' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setTimeRange(opt.value as TimeRange)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  timeRange === opt.value
                    ? 'bg-white text-black'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard label="Total clients" value={formatNumber(totalClients)} />
          <KpiCard label="Total véhicules" value={formatNumber(totalVehicles)} />
          <KpiCard label="Véhicules protégés" value={formatNumber(protectedVehiclesCount)} />
          <KpiCard label="Total installations" value={formatNumber(totalInstallations)} />
          <KpiCard label="Installations ce mois-ci" value={formatNumber(thisMonthInstallations)} />
          <KpiCard label="Nouveaux clients ce mois-ci" value={formatNumber(thisMonthClients)} />
          <KpiCard label="Véhicules ajoutés ce mois-ci" value={formatNumber(thisMonthVehicles)} />
          <KpiCard
            label="Moy. installations / client"
            value={formatNumber(avgInstallsPerClient)}
          />
          <KpiCard
            label="Moy. véhicules / client"
            value={formatNumber(avgVehiclesPerClient)}
          />
          <KpiCard
            label="Taux de clients récurrents"
            value={`${formatNumber(returningClientsRate)} %`}
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 shadow-[0_24px_80px_rgba(0,0,0,0.7)]">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Installations dans le temps
              </p>
              <p className="mt-1 text-sm text-white/70">
                Chaque point représente des installations réelles issues de vos enregistrements.
              </p>
            </div>
            <div className="text-right text-xs text-white/50">
              Total&nbsp;:{' '}
              <span className="text-white/80 font-medium">{formatNumber(totalInstallations)}</span>
            </div>
          </div>
          <SimpleAreaChart
            data={monthlyInstallationsSeries.map((p) => ({ label: p.label, count: p.count }))}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Croissance clients
              </p>
              <p className="text-xs text-white/55">
                Total&nbsp;:{' '}
                <span className="text-white/80 font-medium">
                  {formatNumber(totalClients)}
                </span>
              </p>
            </div>
            <SimpleAreaChart
              data={monthlyClientsSeries.map((p) => ({ label: p.label, count: p.count }))}
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Croissance véhicules
              </p>
              <p className="text-xs text-white/55">
                Total&nbsp;:{' '}
                <span className="text-white/80 font-medium">
                  {formatNumber(totalVehicles)}
                </span>
              </p>
            </div>
            <SimpleAreaChart
              data={monthlyVehiclesSeries.map((p) => ({ label: p.label, count: p.count }))}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Répartition produits Fireball
              </p>
              <p className="mt-1 text-xs text-white/60">
                Basé uniquement sur les produits utilisés dans vos installations.
              </p>
            </div>
            <div className="text-right text-xs text-white/55">
              Installations&nbsp;:{' '}
              <span className="text-white/80 font-medium">
                {formatNumber(productStats.totalInstallations)}
              </span>
            </div>
          </div>
          <SimpleDonutChart data={productUsageForPie} />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-5">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Top produits installés
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-white/50 border-b border-white/10">
                  <th className="py-2 text-left font-medium">Produit</th>
                  <th className="py-2 text-right font-medium">Installations</th>
                  <th className="py-2 text-right font-medium">Véhicules protégés</th>
                  <th className="py-2 text-right font-medium">% du total</th>
                </tr>
              </thead>
              <tbody>
                {productStats.list.length === 0 && (
                  <tr>
                    <td className="py-4 text-xs text-white/55" colSpan={4}>
                      Aucune installation enregistrée pour le moment.
                    </td>
                  </tr>
                )}
                {productStats.list.slice(0, 10).map((p) => (
                  <tr key={p.product} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-4 text-white/90">{p.product}</td>
                    <td className="py-2 text-right text-white/80">
                      {formatNumber(p.installations)}
                    </td>
                    <td className="py-2 text-right text-white/80">
                      {formatNumber(p.vehiclesProtected)}
                    </td>
                    <td className="py-2 text-right text-white/70">
                      {p.percentage.toFixed(1)} %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Top clients (installations)
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-white/50 border-b border-white/10">
                    <th className="py-2 text-left font-medium">Client</th>
                    <th className="py-2 text-right font-medium">Véhicules</th>
                    <th className="py-2 text-right font-medium">Installations</th>
                    <th className="py-2 text-right font-medium">Dernier service</th>
                  </tr>
                </thead>
                <tbody>
                  {topClients.length === 0 && (
                    <tr>
                      <td className="py-4 text-xs text-white/55" colSpan={4}>
                        Aucun client avec installations pour le moment.
                      </td>
                    </tr>
                  )}
                  {topClients.map((row) => (
                    <tr
                      key={row.client.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-2 pr-4 text-white/90">{row.client.full_name}</td>
                      <td className="py-2 text-right text-white/80">
                        {row.vehicles.length}
                      </td>
                      <td className="py-2 text-right text-white/80">
                        {row.installations.length}
                      </td>
                      <td className="py-2 text-right text-white/70">
                        {formatShortDate(row.lastService)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Répartition marques de véhicules
            </p>
            <SimpleBarChart
              data={brandDistributionAll.slice(0, 10).map((b) => ({
                label: b.label,
                count: b.count,
              }))}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Installations récentes
            </p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-xs text-white/50 border-b border-white/10">
                    <th className="py-2 text-left font-medium">Véhicule</th>
                    <th className="py-2 text-left font-medium">Client</th>
                    <th className="py-2 text-left font-medium">Produit</th>
                    <th className="py-2 text-right font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInstallations.length === 0 && (
                    <tr>
                      <td className="py-4 text-xs text-white/55" colSpan={4}>
                        Aucune installation enregistrée pour le moment.
                      </td>
                    </tr>
                  )}
                  {recentInstallations.map((w) => {
                    const v = w.vehicle_id ? vehicleById.get(w.vehicle_id) : null
                    const c = w.client_id ? clientById.get(w.client_id) : null
                    const d = parseDate(w.installation_date)
                    return (
                      <tr key={w.id} className="border-b border-white/5 last:border-0">
                        <td className="py-2 pr-3 text-white/90">
                          {v ? `${v.brand} ${v.model} (${v.year})` : 'Véhicule'}
                        </td>
                        <td className="py-2 pr-3 text-white/80">
                          {c ? c.full_name : 'Client'}
                        </td>
                        <td className="py-2 pr-3 text-white/80">
                          {w.product_used || 'Produit Fireball'}
                        </td>
                        <td className="py-2 text-right text-white/70">
                          {formatShortDate(d)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Flux d&apos;activité
            </p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {activityFeed.length === 0 && (
                <p className="text-xs text-white/55">
                  Aucune activité enregistrée pour le moment.
                </p>
              )}
              {activityFeed.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 text-xs text-white/80"
                >
                  <span
                    className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                    style={{
                      background:
                        e.type === 'installation'
                          ? 'rgba(10,132,255,0.18)'
                          : e.type === 'vehicle'
                            ? 'rgba(52,199,89,0.18)'
                            : 'rgba(255,149,0,0.18)',
                      color:
                        e.type === 'installation'
                          ? '#0A84FF'
                          : e.type === 'vehicle'
                            ? '#34C759'
                            : '#FF9F0A',
                    }}
                  >
                    {e.type === 'installation' && 'I'}
                    {e.type === 'vehicle' && 'V'}
                    {e.type === 'client' && 'C'}
                  </span>
                  <div className="flex-1">
                    <p className="text-[11px] text-white/90">{e.label}</p>
                    {e.meta && (
                      <p className="text-[10px] text-white/55 mt-0.5">{e.meta}</p>
                    )}
                    <p className="text-[10px] text-white/45 mt-0.5">
                      {e.date.toLocaleString('fr-CA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Installations cette année"
            value={formatNumber(thisYearInstallations)}
          />
          <KpiCard
            label="Moy. installations / mois"
            value={formatNumber(avgInstallationsPerMonth)}
          />
          <KpiCard
            label="Clients avec >1 installation"
            value={formatNumber(installsPerClientWithMultiple.length)}
          />
          <KpiCard
            label="Délai moyen entre services (jours)"
            value={formatNumber(avgTimeBetweenServicesDays)}
          />
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Installations par mois
              </p>
            </div>
            <SimpleAreaChart
              data={monthlyInstallationsSeries.map((p) => ({ label: p.label, count: p.count }))}
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
                Installations par semaine
              </p>
            </div>
            <SimpleAreaChart data={weeklyInstallationsSeries} />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Performances de protection
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <MiniStat label="Véhicules protégés" value={formatNumber(protectedVehiclesCount)} />
              <MiniStat
                label="Taux de couverture"
                value={`${formatNumber(protectionCoverageRate)} %`}
              />
              <MiniStat
                label="Moy. installations / mois"
                value={formatNumber(avgInstallationsPerMonth)}
              />
              <MiniStat
                label="Mois le plus actif"
                value={smartMostActiveMonth ? smartMostActiveMonth.label : '—'}
              />
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Véhicules protégés par marque
            </p>
            <SimpleBarChart
              data={brandDistributionProtected.slice(0, 10).map((b) => ({
                label: b.label,
                count: b.count,
              }))}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Répartition âge véhicules
            </p>
            <SimpleBarChart
              data={yearDistribution.map((y) => ({
                label: y.label,
                count: y.count,
              }))}
            />
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Distribution rétention clients
            </p>
            <SimpleBarChart
              data={[
                {
                  label: '1 installation',
                  count: installsPerClient.filter((n) => n === 1).length,
                },
                {
                  label: '2–3 installations',
                  count: installsPerClient.filter((n) => n >= 2 && n <= 3).length,
                },
                {
                  label: '4+ installations',
                  count: installsPerClient.filter((n) => n >= 4).length,
                },
              ]}
            />
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Client le plus actif"
            value={mostActiveClient ? mostActiveClient.client.full_name : '—'}
            subtitle={
              mostActiveClient
                ? `${mostActiveClient.installations.length} installations`
                : undefined
            }
          />
          <KpiCard
            label="Véhicule le plus servi"
            value={
              mostServicedVehicle?.vehicle
                ? `${mostServicedVehicle.vehicle.brand} ${mostServicedVehicle.vehicle.model}`
                : '—'
            }
            subtitle={
              mostServicedVehicle ? `${mostServicedVehicle.count} installations` : undefined
            }
          />
          <KpiCard
            label="Produit le plus installé"
            value={mostInstalledProduct ? mostInstalledProduct.product : '—'}
            subtitle={
              mostInstalledProduct
                ? `${mostInstalledProduct.installations} installations`
                : undefined
            }
          />
          <KpiCard
            label="Mois le plus actif"
            value={mostActiveMonth ? mostActiveMonth.label : '—'}
            subtitle={
              mostActiveMonth ? `${mostActiveMonth.count} installations` : undefined
            }
          />
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] px-5 py-5 md:px-6 md:py-6 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-white/50">
              Clients récents
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-xs text-white/50 border-b border-white/10">
                  <th className="py-2 text-left font-medium">Client</th>
                  <th className="py-2 text-right font-medium">Véhicules</th>
                  <th className="py-2 text-right font-medium">Installations</th>
                  <th className="py-2 text-right font-medium">Créé le</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.length === 0 && (
                  <tr>
                    <td className="py-4 text-xs text-white/55" colSpan={4}>
                      Aucun client pour l&apos;instant.
                    </td>
                  </tr>
                )}
                {recentClients.map((c) => {
                  const vc = vehiclesByClient.get(c.id)?.length ?? 0
                  const ic = warrantiesByClient.get(c.id)?.length ?? 0
                  const created = parseDate(c.created_at)
                  return (
                    <tr key={c.id} className="border-b border-white/5 last:border-0">
                      <td className="py-2 pr-3 text-white/90">{c.full_name}</td>
                      <td className="py-2 text-right text-white/80">{vc}</td>
                      <td className="py-2 text-right text-white/80">{ic}</td>
                      <td className="py-2 text-right text-white/70">
                        {formatShortDate(created)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  subtitle,
}: {
  label: string
  value: string
  subtitle?: string
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-4 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.6)]">
      <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-white/55 mb-1.5">
        {label}
      </p>
      <p className="text-2xl font-semibold text-white leading-tight">{value}</p>
      {subtitle && (
        <p className="mt-1 text-[11px] text-white/55 truncate">{subtitle}</p>
      )}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-black/40 border border-white/10 px-4 py-3 flex flex-col gap-1">
      <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-white/55">
        {label}
      </p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  )
}

