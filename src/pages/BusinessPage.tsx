import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  IconArrowLeft,
  IconChartBar,
  IconUsers,
  IconBook,
  IconShoppingBag,
  IconSettings,
  IconShieldLock,
  IconChevronRight,
} from '@tabler/icons-react'
import { BusinessClientsPage } from '@/pages/business/BusinessClientsPage'
import { AdminPanelContent } from '@/components/AdminPanelSheet'
import { AdminConfigurationPage } from '@/components/business/admin/AdminPages'
import { getCurrentUserProfile, isAuthenticated } from '@/utils/supabaseAuth'
import { supabase } from '@/lib/supabase'
import { FireballLoading } from '@/components/FireballLoading'
import { cn } from '@/lib/utils'
import { SITE_PAGES, type SitePage } from '@/constants/sitePages'
import { CATEGORIES, PRODUCTS, type Product as LocalProduct } from '@/data/products'
import { getClientCache, setClientCache } from '@/utils/clientCache'
import { fetchProductsFromShopify } from '@/utils/shopifyStorefront'

type View = 'loading' | 'denied' | 'form' | 'dashboard'

type TimeRange = '30d' | '90d' | '12m' | 'all'

interface ClientRow {
  id: string
  full_name: string
  email: string
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

type BusinessCacheSnapshot = {
  view: View
  isAdmin: boolean
  userDisplayName: string
  companyName: string
  companyNameInput: string
  companyLogo: string
  companyAddress: string
  phone: string
  website: string
  description: string
  clients: ClientRow[]
  vehicles: VehicleRow[]
  warranties: WarrantyRow[]
}

const BUSINESS_CACHE_KEY = 'business_dashboard_snapshot_v1'
const BUSINESS_CACHE_TTL_MS = 1000 * 60 * 8

type AnnouncementSettings = {
  navbar_banners?: BannerItem[] | null
  navbar_banner_text: string | null
  navbar_banner_link: string | null
  navbar_banner_enabled: boolean
  navbar_banner_button_text?: string | null
  navbar_banner_button_to?: string | null
  featured_collection_name: string | null
  featured_collection_description: string | null
  featured_collection_image: string | null
  home_collection_eyebrow?: string | null
  home_collection_headline?: string | null
  home_collection_description?: string | null
  home_collection_image?: string | null
  home_collection_href?: string | null
  home_collection_button1_label?: string | null
  home_collection_button1_href?: string | null
  home_collection_button2_label?: string | null
  home_collection_button2_href?: string | null
}

type BannerItem = {
  id: string
  enabled: boolean
  text: string
  button_text: string | null
  button_to: string | null
}

type ProductPageContent = {
  why: string | null
  how_to_use_steps: string[] | null
}

type ProductPagesSettings = Record<string, ProductPageContent | undefined>

function normalizeStepsFromTextarea(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

function stepsToTextarea(steps: string[] | null | undefined): string {
  return Array.isArray(steps) ? steps.join('\n') : ''
}

function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth() + 1}`
}

function formatMonthLabel(d: Date): string {
  return d.toLocaleDateString('fr-CA', { month: 'short', year: 'numeric' })
}

function formatShortDate(d: Date | null): string {
  if (!d) return '-'
  return d.toLocaleDateString('fr-CA', { year: 'numeric', month: 'short', day: 'numeric' })
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
      {data.length === 0 && <p className="text-xs text-slate-400">Pas encore de données.</p>}
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <div className="w-28 text-[11px] text-slate-500 truncate">{d.label}</div>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#FF375F]"
              style={{ width: `${(d.count / max) * 100}%` }}
            />
          </div>
          <div className="w-10 text-right text-[11px] text-slate-600">{d.count}</div>
        </div>
      ))}
    </div>
  )
}

function SimpleAreaChart({ data }: { data: { label: string; count: number }[] }) {
  const max = data.reduce((m, d) => (d.count > m ? d.count : m), 0) || 1
  return (
    <div className="h-44 relative">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-slate-50 via-white to-white pointer-events-none" />
      <div className="absolute inset-3 flex items-end gap-2">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <div
              className="w-full rounded-full bg-gradient-to-t from-[#0A84FF] to-[#FF375F]"
              style={{ height: `${(d.count / max) * 100 || 4}%` }}
            />
            <span className="mt-1 text-[10px] text-slate-400 truncate">{d.label}</span>
          </div>
        ))}
      </div>
      {data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs text-slate-400">Pas encore de données.</p>
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
          stroke="rgba(148,163,184,0.3)"
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
        {data.length === 0 && <p className="text-xs text-slate-400">Pas encore de données.</p>}
        {segments.map((s) => {
          const percent = (s.value / total) * 100
          return (
            <div key={s.label} className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-slate-700">{s.label}</span>
              </div>
              <span className="text-slate-500">{percent.toFixed(1)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function BusinessAdminAnnouncements() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [banners, setBanners] = useState<BannerItem[]>([])
  const [pageQuery, setPageQuery] = useState('')
  const [pagePickerBannerId, setPagePickerBannerId] = useState<string | null>(null)
  const [pagePickerMode, setPagePickerMode] = useState<'all' | 'pages' | 'categories'>('all')
  const [featuredName, setFeaturedName] = useState('')
  const [featuredDescription, setFeaturedDescription] = useState('')
  const [featuredImage, setFeaturedImage] = useState('')
  const [homeEyebrow, setHomeEyebrow] = useState('')
  const [homeHeadline, setHomeHeadline] = useState('')
  const [homeDescription, setHomeDescription] = useState('')
  const [homeImage, setHomeImage] = useState('')
  const [homeHref, setHomeHref] = useState('')
  const [homeBtn1Label, setHomeBtn1Label] = useState('')
  const [homeBtn1Href, setHomeBtn1Href] = useState('')
  const [homeBtn2Label, setHomeBtn2Label] = useState('')
  const [homeBtn2Href, setHomeBtn2Href] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError('')
      try {
        const { data, error: fetchError } = await supabase
          .from('site_settings')
          .select('*')
          .eq('key', 'announcements')
          .maybeSingle()

        if (fetchError) {
          throw fetchError
        }

        const settings = (data?.value ?? null) as AnnouncementSettings | null
        if (mounted && settings) {
          // Multi banners (new)
          const multi = Array.isArray(settings.navbar_banners) ? settings.navbar_banners : null
          if (multi && multi.length > 0) {
            setBanners(
              multi.map((b) => ({
                id: String(b.id),
                enabled: Boolean((b as any).enabled),
                text: String((b as any).text ?? ''),
                button_text: (b as any).button_text != null ? String((b as any).button_text) : null,
                button_to: (b as any).button_to != null ? String((b as any).button_to) : null,
              })),
            )
          } else {
            // Back-compat (single banner old)
            const oldEnabled = Boolean(settings.navbar_banner_enabled)
            const oldText = settings.navbar_banner_text ?? ''
            const oldTo = settings.navbar_banner_link ?? null
            const oldBtnText = (settings as any).navbar_banner_button_text ?? null
            const oldBtnTo = (settings as any).navbar_banner_button_to ?? null
            setBanners([
              {
                id: 'banner-1',
                enabled: oldEnabled,
                text: oldText,
                button_text: oldBtnText ? String(oldBtnText) : null,
                button_to: oldBtnTo ? String(oldBtnTo) : oldTo ? String(oldTo) : null,
              },
            ])
          }
          setFeaturedName(settings.featured_collection_name ?? '')
          setFeaturedDescription(settings.featured_collection_description ?? '')
          setFeaturedImage(settings.featured_collection_image ?? '')
          setHomeEyebrow(settings.home_collection_eyebrow ?? '')
          setHomeHeadline(settings.home_collection_headline ?? '')
          setHomeDescription(settings.home_collection_description ?? '')
          setHomeImage(settings.home_collection_image ?? '')
          setHomeHref(settings.home_collection_href ?? '')
          setHomeBtn1Label(settings.home_collection_button1_label ?? '')
          setHomeBtn1Href(settings.home_collection_button1_href ?? '')
          setHomeBtn2Label(settings.home_collection_button2_label ?? '')
          setHomeBtn2Href(settings.home_collection_button2_href ?? '')
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load settings.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async () => {
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const normalizedBanners: BannerItem[] = banners.map((b) => ({
        ...b,
        text: (b.text ?? '').trim(),
        button_text: b.button_text ? b.button_text.trim() : null,
        button_to: b.button_to ? b.button_to.trim() : null,
      }))

      const settings: AnnouncementSettings = {
        navbar_banners: normalizedBanners,
        // keep old keys too (back-compat) but they won't be used once multi exists
        navbar_banner_text: normalizedBanners[0]?.text ?? null,
        navbar_banner_link: normalizedBanners[0]?.button_to ?? null,
        navbar_banner_enabled: Boolean(normalizedBanners[0]?.enabled),
        navbar_banner_button_text: normalizedBanners[0]?.button_text ?? null,
        navbar_banner_button_to: normalizedBanners[0]?.button_to ?? null,
        featured_collection_name: featuredName.trim() || null,
        featured_collection_description: featuredDescription.trim() || null,
        featured_collection_image: featuredImage.trim() || null,
        home_collection_eyebrow: homeEyebrow.trim() || null,
        home_collection_headline: homeHeadline.trim() || null,
        home_collection_description: homeDescription.trim() || null,
        home_collection_image: homeImage.trim() || null,
        home_collection_href: homeHref.trim() || null,
        home_collection_button1_label: homeBtn1Label.trim() || null,
        home_collection_button1_href: homeBtn1Href.trim() || null,
        home_collection_button2_label: homeBtn2Label.trim() || null,
        home_collection_button2_href: homeBtn2Href.trim() || null,
      }

      const { data: existing, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'announcements')
        .maybeSingle()
      if (existingError) throw existingError

      const write = existing
        ? supabase
            .from('site_settings')
            .update({ value: settings, updated_at: new Date().toISOString() })
            .eq('key', 'announcements')
        : supabase
            .from('site_settings')
            .insert({ key: 'announcements', value: settings, updated_at: new Date().toISOString() })

      const result = await write
      if (result.error) throw result.error

      setSuccess('Saved.')
      window.setTimeout(() => setSuccess(''), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">
            Admin
          </p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
            Announcements
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Créez la bannière navbar et la collection “featured” (mega menu Shop).
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 rounded-full bg-[#4318FF] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3312C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      )}

      {!loading && (error || success) && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {error || success}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
            Navbar banners (rotation)
          </p>

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-700">
              Ajoute plusieurs bannières, active celles que tu veux, elles tourneront automatiquement.
            </p>
            <button
              type="button"
              onClick={() => {
                const id = `banner-${Date.now()}`
                setBanners((prev) => [
                  ...prev,
                  { id, enabled: true, text: '', button_text: 'Contact us', button_to: '/contact' },
                ])
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              + Add banner
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {banners.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Aucune bannière pour le moment.
              </div>
            ) : (
              banners.map((b, idx) => (
                <div key={b.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={b.enabled}
                        onChange={(e) => {
                          const enabled = e.target.checked
                          setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, enabled } : x)))
                        }}
                      />
                      <p className="text-sm font-semibold text-slate-900">Banner {idx + 1}</p>
                      <span className="text-xs text-slate-500">{b.enabled ? 'Active' : 'Disabled'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === 0) return
                          setBanners((prev) => {
                            const copy = [...prev]
                            const [item] = copy.splice(idx, 1)
                            copy.splice(idx - 1, 0, item)
                            return copy
                          })
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (idx === banners.length - 1) return
                          setBanners((prev) => {
                            const copy = [...prev]
                            const [item] = copy.splice(idx, 1)
                            copy.splice(idx + 1, 0, item)
                            return copy
                          })
                        }}
                        className="text-xs font-medium text-slate-600 hover:text-slate-900"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        onClick={() => setBanners((prev) => prev.filter((x) => x.id !== b.id))}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Texte</label>
                      <input
                        value={b.text}
                        onChange={(e) => {
                          const text = e.target.value
                          setBanners((prev) => prev.map((x) => (x.id === b.id ? { ...x, text } : x)))
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                        placeholder="Ex: Livraison gratuite dès 99$ · Retours 30 jours"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Texte du bouton</label>
                        <input
                          value={b.button_text ?? ''}
                          onChange={(e) => {
                            const button_text = e.target.value
                            setBanners((prev) =>
                              prev.map((x) => (x.id === b.id ? { ...x, button_text } : x)),
                            )
                          }}
                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                          placeholder="Contact us"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Destination</label>
                        <div className="flex items-center gap-2">
                          <input
                            value={b.button_to ?? ''}
                            onChange={(e) => {
                              const button_to = e.target.value
                              setBanners((prev) =>
                                prev.map((x) => (x.id === b.id ? { ...x, button_to } : x)),
                              )
                            }}
                            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                            placeholder="/contact"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPageQuery('')
                              setPagePickerBannerId(b.id)
                            }}
                            className="shrink-0 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Choisir…
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
            Featured collection (Shop mega menu)
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Nom</label>
              <input
                value={featuredName}
                onChange={(e) => setFeaturedName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                placeholder="Featured Collection"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
              <textarea
                value={featuredDescription}
                onChange={(e) => setFeaturedDescription(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none"
                placeholder="Décrivez la collection mise en avant."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Image URL (optionnel)</label>
              <input
                value={featuredImage}
                onChange={(e) => setFeaturedImage(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                placeholder="https://..."
              />
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <p className="text-xs font-semibold text-slate-700">Accueil — bannière plein écran (séparé du menu Shop)</p>
              <p className="text-[11px] text-slate-500">Texte et boutons en bas à gauche.</p>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Image bannière</label>
                <input
                  value={homeImage}
                  onChange={(e) => setHomeImage(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  placeholder="/Assets/Coatings/Coatings%20Banner.png"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Surtitre</label>
                <input
                  value={homeEyebrow}
                  onChange={(e) => setHomeEyebrow(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  placeholder="Surface Technology"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Titre</label>
                <input
                  value={homeHeadline}
                  onChange={(e) => setHomeHeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  placeholder="Coatings"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Description</label>
                <textarea
                  value={homeDescription}
                  onChange={(e) => setHomeDescription(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-none"
                  placeholder="Excellence in every detail"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Lien clic sur l’image</label>
                <input
                  value={homeHref}
                  onChange={(e) => setHomeHref(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  placeholder="/coatings"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bouton 1 — libellé</label>
                  <input
                    value={homeBtn1Label}
                    onChange={(e) => setHomeBtn1Label(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    placeholder="Shop coatings"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bouton 1 — URL</label>
                  <input
                    value={homeBtn1Href}
                    onChange={(e) => setHomeBtn1Href(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    placeholder="/coatings"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bouton 2 — libellé</label>
                  <input
                    value={homeBtn2Label}
                    onChange={(e) => setHomeBtn2Label(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    placeholder="Learn more"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Bouton 2 — URL</label>
                  <input
                    value={homeBtn2Href}
                    onChange={(e) => setHomeBtn2Href(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                    placeholder="/all-coatings"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Page picker (search) */}
      {pagePickerBannerId && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setPagePickerBannerId(null)}
            aria-label="Close"
          />
          <div className="relative w-full max-w-2xl rounded-3xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-slate-900">Choisir une page</p>
              <button
                type="button"
                onClick={() => setPagePickerBannerId(null)}
                className="text-sm font-semibold text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            <div className="mt-3">
              <div className="mb-3 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setPagePickerMode('all')}
                  className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
                    pagePickerMode === 'all' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  Tous
                </button>
                <button
                  type="button"
                  onClick={() => setPagePickerMode('pages')}
                  className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
                    pagePickerMode === 'pages' ? 'bg-slate-900 text-white' : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  Pages
                </button>
                <button
                  type="button"
                  onClick={() => setPagePickerMode('categories')}
                  className={cn(
                    'px-3 py-1 rounded-full text-[11px] font-medium transition-colors',
                    pagePickerMode === 'categories'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100',
                  )}
                >
                  Catégories
                </button>
              </div>
              <input
                value={pageQuery}
                onChange={(e) => setPageQuery(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                placeholder="Rechercher une page…"
                autoFocus
              />
              <div className="mt-3 max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200">
                {(() => {
                  const q = pageQuery.trim().toLowerCase()
                  const pageOptions = SITE_PAGES.map((p) => ({
                    kind: 'Page' as const,
                    label: p.label,
                    to: p.to,
                    keywords: p.keywords ?? [],
                  }))
                  const categoryOptions = CATEGORIES.map((c) => ({
                    kind: 'Category' as const,
                    label: c.name,
                    to: `/shop/${c.id}`,
                    keywords: [c.id, c.description],
                  }))
                  const base =
                    pagePickerMode === 'pages'
                      ? pageOptions
                      : pagePickerMode === 'categories'
                        ? categoryOptions
                        : [...pageOptions, ...categoryOptions]

                  const options = base.filter((opt) => {
                    if (!q) return true
                    const hay = `${opt.kind} ${opt.label} ${opt.to} ${opt.keywords.join(' ')}`.toLowerCase()
                    return hay.includes(q)
                  })

                  return options.map((opt) => (
                    <button
                      key={`${opt.kind}:${opt.to}`}
                      type="button"
                      onClick={() => {
                        const to = opt.to
                        setBanners((prev) =>
                          prev.map((x) => (x.id === pagePickerBannerId ? { ...x, button_to: to } : x)),
                        )
                        setPagePickerBannerId(null)
                      }}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="min-w-0">
                        <span className="text-sm font-medium text-slate-900">{opt.label}</span>
                        <p className="text-xs text-slate-500 truncate">{opt.to}</p>
                      </div>
                      <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600">
                        {opt.kind}
                      </span>
                    </button>
                  ))
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BusinessAdminProductPages() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [products, setProducts] = useState<LocalProduct[]>(PRODUCTS)
  const [selectedSlug, setSelectedSlug] = useState<string>(PRODUCTS[0]?.slug ?? '')
  const [settings, setSettings] = useState<ProductPagesSettings>({})

  const selectedProduct = products.find((p) => p.slug === selectedSlug) ?? null
  const current = settings[selectedSlug] ?? { why: null, how_to_use_steps: null }

  const [whyText, setWhyText] = useState('')
  const [stepsText, setStepsText] = useState('')

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setError('')
      setSuccess('')
      setLoading(true)
      try {
        const [productsRes, settingsRes] = await Promise.allSettled([
          fetchProductsFromShopify(),
          supabase.from('site_settings').select('value').eq('key', 'product_pages').maybeSingle(),
        ])

        if (!mounted) return

        if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value) && productsRes.value.length > 0) {
          setProducts(productsRes.value)
          setSelectedSlug((prev) => prev || productsRes.value[0]?.slug || '')
        } else {
          setProducts(PRODUCTS)
          setSelectedSlug((prev) => prev || PRODUCTS[0]?.slug || '')
        }

        if (settingsRes.status === 'fulfilled') {
          const row = settingsRes.value
          const raw = (row.data?.value ?? {}) as unknown
          const next = raw && typeof raw === 'object' ? (raw as ProductPagesSettings) : {}
          setSettings(next)
        }
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load product settings.')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    setWhyText(current.why ?? '')
    setStepsText(stepsToTextarea(current.how_to_use_steps))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug])

  const handleSave = async () => {
    if (!selectedSlug) return
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const nextEntry: ProductPageContent = {
        why: whyText.trim() ? whyText.trim() : null,
        how_to_use_steps: normalizeStepsFromTextarea(stepsText).length
          ? normalizeStepsFromTextarea(stepsText)
          : null,
      }
      const nextSettings: ProductPagesSettings = { ...settings, [selectedSlug]: nextEntry }

      const { data: existing, error: existingError } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', 'product_pages')
        .maybeSingle()
      if (existingError) throw existingError

      const write = existing
        ? supabase
            .from('site_settings')
            .update({ value: nextSettings, updated_at: new Date().toISOString() })
            .eq('key', 'product_pages')
        : supabase
            .from('site_settings')
            .insert({ key: 'product_pages', value: nextSettings, updated_at: new Date().toISOString() })

      const res = await write
      if (res.error) throw res.error

      setSettings(nextSettings)
      setSuccess('Saved.')
      window.setTimeout(() => setSuccess(''), 2200)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save product settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">
            Admin
          </p>
          <h2 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
            Configuration produits
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure “Why [PRODUCT]?” et “How to use” affichés sur les pages produit.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={loading || saving || !selectedSlug}
          className="inline-flex items-center gap-2 rounded-full bg-[#4318FF] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3312C8] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>

      {loading && (
        <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
          <p className="text-sm text-slate-500">Loading…</p>
        </div>
      )}

      {!loading && (error || success) && (
        <div
          className={cn(
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : 'border-emerald-200 bg-emerald-50 text-emerald-800',
          )}
        >
          {error || success}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
            <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
              Produit
            </p>
            <select
              value={selectedSlug}
              onChange={(e) => setSelectedSlug(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-slate-400"
            >
              {products.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                Titre affiché
              </p>
              <p className="text-base font-semibold text-slate-900">
                Why {selectedProduct?.name ?? selectedSlug}?
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm space-y-4">
            <div>
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                Why (texte)
              </p>
              <textarea
                value={whyText}
                onChange={(e) => setWhyText(e.target.value)}
                rows={7}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-vertical"
                placeholder={`Example:\nWhy ${selectedProduct?.name ?? '[PRODUCT]'}?\nWater spots are caused by mineral deposits...`}
              />
            </div>

            <div>
              <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                How to use (1 étape par ligne)
              </p>
              <textarea
                value={stepsText}
                onChange={(e) => setStepsText(e.target.value)}
                rows={7}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 resize-vertical"
                placeholder={'Step 1...\nStep 2...\nStep 3...'}
              />
              <p className="mt-2 text-xs text-slate-500">
                Les lignes vides sont ignorées.
              </p>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export function BusinessPage() {
  const location = useLocation()
  const initialCacheRef = useRef<BusinessCacheSnapshot | null>(
    getClientCache<BusinessCacheSnapshot>(BUSINESS_CACHE_KEY),
  )
  const initialCache = initialCacheRef.current

  const [view, setView] = useState<View>(initialCache?.view ?? 'loading')
  const [timeRange, setTimeRange] = useState<TimeRange>('12m')
  const [isAdmin, setIsAdmin] = useState(Boolean(initialCache?.isAdmin))
  const [userDisplayName, setUserDisplayName] = useState(initialCache?.userDisplayName ?? '')
  const [companyName, setCompanyName] = useState(initialCache?.companyName ?? '')
  const [stats, setStats] = useState({ clients: 0, vehicles: 0, warranties: 0 })
  const [clients, setClients] = useState<ClientRow[]>(
    Array.isArray(initialCache?.clients) ? initialCache.clients : [],
  )
  const [vehicles, setVehicles] = useState<VehicleRow[]>(
    Array.isArray(initialCache?.vehicles) ? initialCache.vehicles : [],
  )
  const [warranties, setWarranties] = useState<WarrantyRow[]>(
    Array.isArray(initialCache?.warranties) ? initialCache.warranties : [],
  )
  const isAdminPath =
    location.pathname.includes('/business/admin') || location.pathname.includes('/account/business/admin')
  const isClientsPath =
    location.pathname.includes('/business/clients') || location.pathname.includes('/account/business/clients')
  const adminSection = location.pathname.includes('/admin/partners')
    ? 'partners'
    : location.pathname.includes('/admin/configuration') ||
        location.pathname.includes('/admin/notifications') ||
        location.pathname.includes('/admin/announcements') ||
        location.pathname.includes('/admin/products')
      ? 'configuration'
          : 'stats'

  const [companyNameInput, setCompanyNameInput] = useState(initialCache?.companyNameInput ?? '')
  const [companyLogo, setCompanyLogo] = useState(initialCache?.companyLogo ?? '')
  const [companyAddress, setCompanyAddress] = useState(initialCache?.companyAddress ?? '')
  const [phone, setPhone] = useState(initialCache?.phone ?? '')
  const [website, setWebsite] = useState(initialCache?.website ?? '')
  const [description, setDescription] = useState(initialCache?.description ?? '')
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showQuickActions, setShowQuickActions] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement | null>(null)

  // Verrouille le scroll global de la page Business :
  // seule la zone interne (business-scroll) doit scroller.
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prev = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      htmlOverscroll: html.style.overscrollBehavior,
      bodyOverscroll: body.style.overscrollBehavior,
      bodyTouchAction: body.style.touchAction,
    }

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    html.style.overscrollBehavior = 'none'
    body.style.overscrollBehavior = 'none'
    body.style.touchAction = 'auto'

    return () => {
      html.style.overflow = prev.htmlOverflow
      body.style.overflow = prev.bodyOverflow
      html.style.overscrollBehavior = prev.htmlOverscroll
      body.style.overscrollBehavior = prev.bodyOverscroll
      body.style.touchAction = prev.bodyTouchAction
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const auth = await isAuthenticated()
      if (!mounted) return
      if (!auth) {
        setView('denied')
        return
      }
      const profile = await getCurrentUserProfile()
      if (!mounted || !profile) {
        setView('denied')
        return
      }
      const partnerStatus = (profile.partner_status || '').toLowerCase()
      const role = (profile.role || '').toLowerCase()
      const isPartner = role === 'partner' || partnerStatus === 'partner'
      if (!mounted) return
      setIsAdmin(role === 'admin')
      const first = (profile.first_name || '').trim()
      const last = (profile.last_name || '').trim()
      setUserDisplayName([first, last].filter(Boolean).join(' ') || profile.email || 'Account')
      if (!isPartner) {
        setView('denied')
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
        const [cRes, vRes, wRes, clientsRes, vehiclesRes, warrantiesRes] = await Promise.all([
          supabase.from('partner_clients').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
          supabase.from('partner_vehicles').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
          supabase.from('partner_warranties').select('id', { count: 'exact', head: true }).eq('partner_id', row.id),
          supabase.from('partner_clients').select('id,full_name,email,created_at').eq('partner_id', row.id),
          supabase.from('partner_vehicles').select('id,client_id,brand,model,year,created_at').eq('partner_id', row.id),
          supabase.from('partner_warranties').select('id,client_id,vehicle_id,product_used,installation_date,created_at').eq('partner_id', row.id),
        ])
        if (mounted) {
          setStats({
            clients: cRes.count ?? 0,
            vehicles: vRes.count ?? 0,
            warranties: wRes.count ?? 0,
          })
          setClients((clientsRes.data ?? []) as ClientRow[])
          setVehicles((vehiclesRes.data ?? []) as VehicleRow[])
          setWarranties((warrantiesRes.data ?? []) as WarrantyRow[])
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
    }
    load()
    return () => { mounted = false }
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
  const clientCreatedDates = useMemo(
    () =>
      clients
        .map((c) => parseDate(c.created_at))
        .filter((d): d is Date => !!d),
    [clients],
  )
  const vehicleCreatedDates = useMemo(
    () =>
      vehicles
        .map((v) => parseDate(v.created_at))
        .filter((d): d is Date => !!d),
    [vehicles],
  )

  const now = new Date()
  const thisMonthInstallations = installationDates.filter((d) => isSameMonth(d, now)).length
  const thisYearInstallations = installationDates.filter(
    (d) => d.getFullYear() === now.getFullYear(),
  ).length
  const thisMonthClients = clientCreatedDates.filter((d) => isSameMonth(d, now)).length
  const thisMonthVehicles = vehicleCreatedDates.filter((d) => isSameMonth(d, now)).length

  const vehicleIdsWithInstall = useMemo(() => {
    const s = new Set<string>()
    warranties.forEach((w) => {
      if (w.vehicle_id) s.add(w.vehicle_id)
    })
    return s
  }, [warranties])

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
  const protectedVehiclesCount = vehicles.filter((v) => vehicleIdsWithInstall.has(v.id)).length

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

  const { rows: clientRows, topClients } = useMemo(
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
    .slice(0, 10)

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
  const leastInstalledProduct =
    productStats.list.length > 0 ? productStats.list[productStats.list.length - 1] : null

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
      setStats({ clients: 0, vehicles: 0, warranties: 0 })
      setView('dashboard')
    } catch {
      setFormError('An error occurred.')
    }
    setFormLoading(false)
  }

  // Cacher la barre quick actions seulement tout en bas de la section
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return

    const onScroll = () => {
      const { scrollTop, clientHeight, scrollHeight } = el
      const nearBottomThreshold = 4
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - nearBottomThreshold
      setShowQuickActions(!isAtBottom)
    }

    onScroll()
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
    }
  }, [])

  useEffect(() => {
    if (view === 'loading' || view === 'denied') return
    const snapshot: BusinessCacheSnapshot = {
      view,
      isAdmin,
      userDisplayName,
      companyName,
      companyNameInput,
      companyLogo,
      companyAddress,
      phone,
      website,
      description,
      clients,
      vehicles,
      warranties,
    }
    setClientCache(BUSINESS_CACHE_KEY, snapshot, BUSINESS_CACHE_TTL_MS)
  }, [
    view,
    isAdmin,
    userDisplayName,
    companyName,
    companyNameInput,
    companyLogo,
    companyAddress,
    phone,
    website,
    description,
    clients,
    vehicles,
    warranties,
  ])

  if (view === 'loading') return <FireballLoading />
  if (view === 'denied') return <Navigate to="/account/dashboard" replace />

  const handleHeaderImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFormError('')
    setFormLoading(true)
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Session expired. Please sign in again.')
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `header-${user.id}-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('business-assets').upload(filePath, file, {
        upsert: true,
      })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from('business-assets').getPublicUrl(filePath)
      if (!data?.publicUrl) {
        throw new Error('Unable to get public URL for image.')
      }

      setCompanyLogo(data.publicUrl)
    } catch (err) {
      console.error('Error uploading header image:', err)
      setFormError(
        err instanceof Error
          ? err.message
          : 'Unable to upload image. Please try again or contact support.',
      )
    } finally {
      setFormLoading(false)
      // reset file input so same file can be selected again if needed
      e.target.value = ''
    }
  }

  if (view === 'form') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md flex flex-col bg-black rounded-xl border border-white/10 shadow-[0_22px_55px_rgba(0,0,0,0.7)] overflow-hidden">
          <div className="w-full bg-black px-6 sm:px-10 py-6 sm:py-10">
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-1">Create your business</h1>
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
                <label className="block text-white/70 text-xs mb-2 font-medium">
                  Header image URL (16:9, optional)
                </label>
                <input
                  type="url"
                  value={companyLogo}
                  onChange={(e) => setCompanyLogo(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none transition-all bg-[#121212] border border-[#1a1a1a] focus:bg-[#1a1a1a] focus:border-[#444]"
                  placeholder="https://..."
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#121212] px-3 py-2 text-xs text-white/80 cursor-pointer hover:bg-[#1a1a1a] transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleHeaderImageUpload}
                    />
                    <span>Upload header image</span>
                  </label>
                  {companyLogo && (
                    <span className="text-[11px] text-white/50 truncate max-w-[180px]">
                      Image set
                    </span>
                  )}
                </div>
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
                className="h-[40px] w-full rounded-[14px] border-none bg-[#0A84FF] px-8 text-center text-white font-semibold transition-colors hover:bg-[#007AFF] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formLoading ? 'Saving…' : 'Save and continue'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const iconClass = 'h-5 w-5 shrink-0'
  const mainLinks = [
    { label: 'Statistics', href: '/business', icon: <IconChartBar className={iconClass} /> },
    { label: 'Clients', href: '/business/clients', icon: <IconUsers className={iconClass} /> },
    { label: 'Technical Library', href: '/business/library', icon: <IconBook className={iconClass} /> },
    { label: 'Pro Shop', href: '/business/shop', icon: <IconShoppingBag className={iconClass} /> },
    { label: 'Business Settings', href: '/business/settings', icon: <IconSettings className={iconClass} /> },
  ]
  const adminSubLinks = isAdmin
    ? [
        { label: 'Stats', href: '/business/admin/stats', icon: <IconChartBar className="h-4 w-4 shrink-0 text-red-400" /> },
        { label: 'Partners', href: '/business/admin/partners', icon: <IconUsers className="h-4 w-4 shrink-0 text-red-400" /> },
        { label: 'Configuration', href: '/business/admin/configuration', icon: <IconSettings className="h-4 w-4 shrink-0 text-red-400" /> },
      ]
    : []
  const backLink = {
    label: 'Back to dashboard',
    href: '/account/dashboard',
    icon: <IconArrowLeft className={iconClass} />,
  }
  const initialLetter = (userDisplayName || 'A').charAt(0).toUpperCase()

  return (
    <div
      className={cn(
        'business-layout flex w-full flex-1 min-h-0 overflow-hidden',
        'h-[calc(100vh-5rem)] min-h-[calc(100vh-5rem)] bg-white'
      )}
    >
      {/* Purity-like sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.08)]">
        <div className="flex items-center px-6 pt-6 pb-4 border-b border-slate-100">
          <img
            src="/Assets/FireballBuisness B.png"
            alt="Fireball Business"
            className="h-8 w-auto object-contain max-w-[180px]"
          />
        </div>
        <nav className="business-sidebar-scroll flex-1 overflow-y-auto px-3 py-4">
          <p className="px-3 mb-2 text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
            Main
          </p>
          <div className="space-y-1">
            {mainLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                {link.icon}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>
          {adminSubLinks.length > 0 && (
            <>
              <p className="px-3 mt-6 mb-2 text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                Admin
              </p>
              <div className="space-y-1">
                {adminSubLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    {link.icon}
                    <span>{link.label}</span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </nav>
        <div className="border-t border-slate-100 px-4 py-4">
          <Link
            to={backLink.href}
            className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-3 text-sm font-medium text-white hover:bg-black transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#4318FF] text-sm font-semibold text-white">
                {initialLetter}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm">{userDisplayName || 'Account'}</p>
                <p className="truncate text-[11px] text-slate-300">Back to main dashboard</p>
              </div>
            </div>
            <IconChevronRight className="h-4 w-4 shrink-0 text-slate-200" />
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 bg-white">
        <div className="flex h-full min-h-0 w-full flex-1 p-4 md:p-6">
          <section className="relative z-10 flex min-h-0 flex-1 flex-col">
            <div
              ref={scrollContainerRef}
              data-no-smooth-scroll
              data-lenis-prevent
              className="business-scroll flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto overflow-x-hidden rounded-[20px] border border-slate-100 bg-white p-6 pb-6 shadow-[0_18px_40px_rgba(15,23,42,0.12)] md:p-10 md:pb-10"
            >
            {isAdminPath ? (
              !isAdmin ? (
                <Navigate to="/business" replace />
              ) : (
                <div className="flex flex-col gap-6">
                  {adminSection === 'configuration' ? (
                    <AdminConfigurationPage
                      announcementsContent={<BusinessAdminAnnouncements />}
                      productsContent={<BusinessAdminProductPages />}
                    />
                  ) : adminSection === 'partners' ? (
                    <AdminPanelContent section="partners" />
                  ) : (
                    <AdminPanelContent section="stats" />
                  )}
                </div>
              )
            ) : isClientsPath ? (
              <BusinessClientsPage />
            ) : (
              <div className="flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                      <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">
                        Statistics
                      </p>
                    <h1 className="mt-1 text-2xl md:text-3xl font-semibold text-slate-900">
                      {companyName || 'Your installer statistics'}
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                      Vue unifiée de vos clients, véhicules, installations et produits Fireball.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to="/business/clients"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <IconUsers className="h-4 w-4" />
                      Ouvrir les clients
                    </Link>
                    <Link
                      to="/business/settings"
                      className="inline-flex items-center gap-2 rounded-full bg-[#4318FF] text-white px-4 py-2 text-sm font-semibold hover:bg-[#3312C8] transition-colors"
                    >
                      <IconSettings className="h-4 w-4" />
                      Paramètres business
                    </Link>
                  </div>
                </div>

                {/* KPI overview */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Total clients
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(totalClients)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Total véhicules
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(totalVehicles)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Véhicules protégés
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(protectedVehiclesCount)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Installations
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(totalInstallations)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Installs ce mois-ci
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(thisMonthInstallations)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Nouveaux clients (mois)
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(thisMonthClients)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Véhicules ajoutés (mois)
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(thisMonthVehicles)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Moy. installs / client
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(avgInstallsPerClient)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Moy. véhicules / client
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {formatNumber(avgVehiclesPerClient)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Clients récurrents
                    </p>
                    <p className="text-2xl font-semibold text-slate-900">
                      {`${formatNumber(returningClientsRate)} %`}
                    </p>
                  </div>
                </div>

                {/* Installations over time */}
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Installations dans le temps
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        Chaque point représente des installations réelles.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1 rounded-full bg-slate-50 border border-slate-200 p-1">
                      {['30d', '90d', '12m', 'all'].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setTimeRange(v as TimeRange)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                            timeRange === v
                              ? 'bg-slate-900 text-white'
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {v === '30d' && '30j'}
                          {v === '90d' && '90j'}
                          {v === '12m' && '12m'}
                          {v === 'all' && 'Tout'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <SimpleAreaChart
                    data={monthlyInstallationsSeries.map((p) => ({ label: p.label, count: p.count }))}
                  />
                </div>

                {/* Client & vehicle growth */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Croissance clients
                      </p>
                    </div>
                    <SimpleAreaChart
                      data={monthlyClientsSeries.map((p) => ({ label: p.label, count: p.count }))}
                    />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Croissance véhicules
                      </p>
                    </div>
                    <SimpleAreaChart
                      data={monthlyVehiclesSeries.map((p) => ({ label: p.label, count: p.count }))}
                    />
                  </div>
                </div>

                {/* Product usage pie */}
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                        Répartition produits Fireball
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Basé uniquement sur les produits utilisés dans vos installations.
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      Installs&nbsp;:{' '}
                      <span className="text-slate-800 font-medium">
                        {formatNumber(productStats.totalInstallations)}
                      </span>
                    </div>
                  </div>
                  <SimpleDonutChart data={productUsageForPie} />
                </div>

                {/* Top products */}
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
                    Top produits installés
                  </p>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="py-2 text-left font-medium">Produit</th>
                          <th className="py-2 text-right font-medium">Installations</th>
                          <th className="py-2 text-right font-medium">Véhicules protégés</th>
                          <th className="py-2 text-right font-medium">% du total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {productStats.list.length === 0 && (
                          <tr>
                            <td className="py-4 text-xs text-slate-500" colSpan={4}>
                              Aucune installation enregistrée pour le moment.
                            </td>
                          </tr>
                        )}
                        {productStats.list.slice(0, 10).map((p) => (
                          <tr key={p.product} className="border-b border-slate-100 last:border-0">
                            <td className="py-2 pr-4 text-slate-800">{p.product}</td>
                            <td className="py-2 text-right text-slate-700">
                              {formatNumber(p.installations)}
                            </td>
                            <td className="py-2 text-right text-slate-700">
                              {formatNumber(p.vehiclesProtected)}
                            </td>
                            <td className="py-2 text-right text-slate-600">
                              {p.percentage.toFixed(1)} %
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top clients & brand distribution */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
                      Top clients (installations)
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-400 border-b border-slate-100">
                            <th className="py-2 text-left font-medium">Client</th>
                            <th className="py-2 text-right font-medium">Véhicules</th>
                            <th className="py-2 text-right font-medium">Installations</th>
                            <th className="py-2 text-right font-medium">Dernier service</th>
                          </tr>
                        </thead>
                        <tbody>
                          {topClients.length === 0 && (
                            <tr>
                              <td className="py-4 text-xs text-slate-500" colSpan={4}>
                                Aucun client avec installations pour le moment.
                              </td>
                            </tr>
                          )}
                          {topClients.map((row) => (
                            <tr
                              key={row.client.id}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="py-2 pr-4 text-slate-800">{row.client.full_name}</td>
                              <td className="py-2 text-right text-slate-700">
                                {row.vehicles.length}
                              </td>
                              <td className="py-2 text-right text-slate-700">
                                {row.installations.length}
                              </td>
                              <td className="py-2 text-right text-slate-600">
                                {formatShortDate(row.lastService)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
                      Répartition marques véhicules
                    </p>
                    <SimpleBarChart
                      data={brandDistributionAll.slice(0, 10).map((b) => ({
                        label: b.label,
                        count: b.count,
                      }))}
                    />
                  </div>
                </div>

                {/* Recent installs & activity feed */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
                      Installations récentes
                    </p>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-xs text-slate-400 border-b border-slate-100">
                            <th className="py-2 text-left font-medium">Véhicule</th>
                            <th className="py-2 text-left font-medium">Client</th>
                            <th className="py-2 text-left font-medium">Produit</th>
                            <th className="py-2 text-right font-medium">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentInstallations.length === 0 && (
                            <tr>
                              <td className="py-4 text-xs text-slate-500" colSpan={4}>
                                Aucune installation enregistrée pour le moment.
                              </td>
                            </tr>
                          )}
                          {recentInstallations.map((w) => {
                            const v = w.vehicle_id ? vehicleById.get(w.vehicle_id) : null
                            const c = w.client_id ? clientById.get(w.client_id) : null
                            const d = parseDate(w.installation_date)
                            return (
                              <tr key={w.id} className="border-b border-slate-100 last:border-0">
                                <td className="py-2 pr-3 text-slate-800">
                                  {v ? `${v.brand} ${v.model} (${v.year})` : 'Véhicule'}
                                </td>
                                <td className="py-2 pr-3 text-slate-700">
                                  {c ? c.full_name : 'Client'}
                                </td>
                                <td className="py-2 pr-3 text-slate-700">
                                  {w.product_used || 'Produit Fireball'}
                                </td>
                                <td className="py-2 text-right text-slate-600">
                                  {formatShortDate(d)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-3">
                      Flux d&apos;activité
                    </p>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {activityFeed.length === 0 && (
                        <p className="text-xs text-slate-500">
                          Aucune activité enregistrée pour le moment.
                        </p>
                      )}
                      {activityFeed.map((e) => (
                        <div
                          key={e.id}
                          className="flex items-start gap-3 text-xs text-slate-800"
                        >
                          <span
                            className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                            style={{
                              background:
                                e.type === 'installation'
                                  ? 'rgba(10,132,255,0.08)'
                                  : e.type === 'vehicle'
                                    ? 'rgba(52,199,89,0.08)'
                                    : 'rgba(255,149,0,0.08)',
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
                            <p className="text-[11px] text-slate-900">{e.label}</p>
                            {e.meta && (
                              <p className="text-[10px] text-slate-500 mt-0.5">{e.meta}</p>
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
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
                </div>

                {/* Retention & protection */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm space-y-4">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                      Rétention & services
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Installs cette année
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(thisYearInstallations)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Moy. installs / mois
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(avgInstallationsPerMonth)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Clients avec &gt;1 install
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(installsPerClientWithMultiple.length)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Délai moyen entre services (j)
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(avgTimeBetweenServicesDays)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm space-y-4">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                      Couverture de protection
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Véhicules protégés
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {formatNumber(protectedVehiclesCount)}
                        </p>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-3 flex flex-col gap-1">
                        <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-500">
                          Taux de couverture
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {`${formatNumber(protectionCoverageRate)} %`}
                        </p>
                      </div>
                    </div>
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-2">
                      Véhicules protégés par marque
                    </p>
                    <SimpleBarChart
                      data={brandDistributionProtected.slice(0, 10).map((b) => ({
                        label: b.label,
                        count: b.count,
                      }))}
                    />
                  </div>
                </div>

                {/* Smart business insights */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Client le plus actif
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {mostActiveClient ? mostActiveClient.client.full_name : '—'}
                    </p>
                    {mostActiveClient && (
                      <p className="text-[11px] text-slate-500">
                        {mostActiveClient.installations.length} installations
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Véhicule le plus servi
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {mostServicedVehicle?.vehicle
                        ? `${mostServicedVehicle.vehicle.brand} ${mostServicedVehicle.vehicle.model}`
                        : '—'}
                    </p>
                    {mostServicedVehicle && (
                      <p className="text-[11px] text-slate-500">
                        {mostServicedVehicle.count} installations
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Produit le plus installé
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {mostInstalledProduct ? mostInstalledProduct.product : '—'}
                    </p>
                    {mostInstalledProduct && (
                      <p className="text-[11px] text-slate-500">
                        {mostInstalledProduct.installations} installations
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-nav uppercase tracking-[0.16em] text-slate-400 mb-1">
                      Mois le plus actif
                    </p>
                    <p className="text-sm font-semibold text-slate-900">
                      {mostActiveMonth ? mostActiveMonth.label : '—'}
                    </p>
                    {mostActiveMonth && (
                      <p className="text-[11px] text-slate-500">
                        {mostActiveMonth.count} installations
                      </p>
                    )}
                  </div>
                </div>

                {/* Recent clients */}
                <div className="rounded-2xl border border-slate-100 bg-white px-5 py-4 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-nav uppercase tracking-[0.16em] text-slate-400">
                      Clients récents
                    </p>
                    <Link
                      to="/business/clients"
                      className="text-xs font-medium text-[#4318FF] hover:text-[#3312C8] transition-colors"
                    >
                      Ouvrir les clients
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="text-xs text-slate-400 border-b border-slate-100">
                          <th className="py-2 text-left font-medium">Client</th>
                          <th className="py-2 text-right font-medium">Véhicules</th>
                          <th className="py-2 text-right font-medium">Installations</th>
                          <th className="py-2 text-right font-medium">Créé le</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentClients.length === 0 && (
                          <tr>
                            <td className="py-4 text-xs text-slate-500" colSpan={4}>
                              Aucun client pour l&apos;instant.
                            </td>
                          </tr>
                        )}
                        {recentClients.map((c) => {
                          const vc = vehiclesByClient.get(c.id)?.length ?? 0
                          const ic = warrantiesByClient.get(c.id)?.length ?? 0
                          const created = parseDate(c.created_at)
                          return (
                            <tr key={c.id} className="border-b border-slate-100 last:border-0">
                              <td className="py-2 pr-3 text-slate-800">{c.full_name}</td>
                              <td className="py-2 text-right text-slate-700">{vc}</td>
                              <td className="py-2 text-right text-slate-700">{ic}</td>
                              <td className="py-2 text-right text-slate-600">
                                {formatShortDate(created)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

              {/* Quick actions bar removed (per request) */}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
