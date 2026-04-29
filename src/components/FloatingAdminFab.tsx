import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAdmin } from '@/context/AdminContext'
import { supabase } from '@/lib/supabase'
import {
  fetchCarClubSettings,
  saveCarClubSettings,
  type CarClubSettings,
} from '@/utils/supabaseCarClub'

// ─── Default fallback values ──────────────────────────────────────────────────
const DEFAULT_IGNITION_FEATURES = [
  'Official Fireball digital member card',
  'Exclusive member-only pricing',
  'Access to Fireball Car Club platform',
  'Certified installer network access',
  'Priority product availability over public releases',
  'Early announcements & private updates',
]
const DEFAULT_APEX_FEATURES = [
  '$100 annual product credit',
  'Exclusive Apex-only discounts',
  'Priority access to limited inventory',
  'Premium black Apex digital card',
  'Early access to unreleased technologies',
  'Invitations to private Fireball events',
  'Elevated status within the Fireball ecosystem',
]
const DEFAULT_SETTINGS: CarClubSettings = {
  ignition_price: '$59 / month',
  ignition_features: DEFAULT_IGNITION_FEATURES,
  apex_price: '$99 / month',
  apex_features: DEFAULT_APEX_FEATURES,
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-[10px] border border-[#d2d2d7] bg-[#f5f5f7] px-3 py-2 text-[13px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15 transition-all'

const btnPrimaryCls =
  'inline-flex items-center justify-center rounded-full bg-[#1d1d1f] px-4 py-2 text-[13px] font-semibold text-white transition-opacity hover:opacity-80 active:opacity-60 disabled:opacity-40'

// ─── Separator ────────────────────────────────────────────────────────────────
function Sep() {
  return <div className="h-px bg-[#e5e5e5] my-1" />
}

// ─── Pill tab ─────────────────────────────────────────────────────────────────
function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-full py-1.5 text-[12px] font-semibold transition-all ${
        active
          ? 'bg-[#1d1d1f] text-white shadow-sm'
          : 'text-[#86868b] hover:text-[#1d1d1f]'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Feature list editor ──────────────────────────────────────────────────────
function FeatureEditor({
  features,
  onChange,
}: {
  features: string[]
  onChange: (f: string[]) => void
}) {
  const [draft, setDraft] = useState('')

  function add() {
    const t = draft.trim()
    if (!t) return
    onChange([...features, t])
    setDraft('')
  }

  function remove(i: number) {
    onChange(features.filter((_, idx) => idx !== i))
  }

  function edit(i: number, val: string) {
    onChange(features.map((f, idx) => (idx === i ? val : f)))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto pr-0.5">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              className={inputCls + ' flex-1 py-1.5 text-[12px]'}
              value={f}
              onChange={(e) => edit(i, e.target.value)}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-[#ff3b30]/10 text-[#ff3b30] flex items-center justify-center text-[14px] leading-none hover:bg-[#ff3b30]/20 transition-colors"
              aria-label="Supprimer"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input
          className={inputCls + ' flex-1 py-1.5 text-[12px]'}
          placeholder="Nouvel avantage…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button
          type="button"
          onClick={add}
          className="flex-shrink-0 w-7 h-7 rounded-full bg-[#34c759]/15 text-[#34c759] flex items-center justify-center text-[18px] leading-none hover:bg-[#34c759]/25 transition-colors font-bold"
          aria-label="Ajouter"
        >
          +
        </button>
      </div>
    </div>
  )
}

// ─── CarClub admin panel ──────────────────────────────────────────────────────
function CarClubPanel({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [tab, setTab] = useState<'ignition' | 'apex'>('ignition')
  const [settings, setSettings] = useState<CarClubSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    fetchCarClubSettings().then((s) => {
      if (mounted && s) setSettings(s)
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [])

  async function save() {
    setSaving(true)
    const { error } = await saveCarClubSettings(settings)
    setSaving(false)
    if (!error) onSuccess('Sauvegardé !')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-5 h-5 border-2 border-[#d2d2d7] border-t-[#1d1d1f] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Tab selector */}
      <div className="flex gap-1 bg-[#f0f0f0] rounded-full p-1">
        <Tab active={tab === 'ignition'} onClick={() => setTab('ignition')}>Ignition</Tab>
        <Tab active={tab === 'apex'} onClick={() => setTab('apex')}>Apex</Tab>
      </div>

      {tab === 'ignition' && (
        <div className="flex flex-col gap-3">
          <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Avantages Ignition</label>
          <FeatureEditor
            features={settings.ignition_features}
            onChange={(f) => setSettings((s) => ({ ...s, ignition_features: f }))}
          />
        </div>
      )}

      {tab === 'apex' && (
        <div className="flex flex-col gap-3">
          <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Avantages Apex</label>
          <FeatureEditor
            features={settings.apex_features}
            onChange={(f) => setSettings((s) => ({ ...s, apex_features: f }))}
          />
        </div>
      )}

      <Sep />
      <button type="button" onClick={save} disabled={saving} className={btnPrimaryCls + ' w-full'}>
        {saving ? 'Sauvegarde…' : 'Sauvegarder les changements'}
      </button>
    </div>
  )
}

// ─── Dashboard XP panel ───────────────────────────────────────────────────────
function DashboardPanel({ onSuccess }: { onSuccess: (msg: string) => void }) {
  const [email, setEmail] = useState('')
  const [delta, setDelta] = useState('')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  async function addXp() {
    const xpDelta = parseInt(delta, 10)
    if (!email.trim() || isNaN(xpDelta) || xpDelta <= 0) {
      setErrMsg('Email valide et XP > 0 requis.')
      return
    }
    setErrMsg('')
    setBusy(true)
    try {
      // Find user by email in profiles
      const { data: profile, error: findErr } = await supabase
        .from('profiles')
        .select('id, xp')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle()

      if (findErr || !profile) {
        setErrMsg('Utilisateur introuvable.')
        return
      }

      const newXp = (profile.xp ?? 0) + xpDelta
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ xp: newXp })
        .eq('id', profile.id)

      if (updateErr) { setErrMsg(updateErr.message); return }
      onSuccess(`+${xpDelta} XP ajouté à ${email.trim()} (total: ${newXp})`)
      setEmail('')
      setDelta('')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Email utilisateur</label>
        <input
          className={inputCls}
          placeholder="user@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
          autoComplete="off"
        />
      </div>
      <div>
        <label className="block text-[11px] font-semibold text-[#86868b] uppercase tracking-wider mb-1">Ajouter XP</label>
        <input
          className={inputCls}
          placeholder="500"
          value={delta}
          onChange={(e) => setDelta(e.target.value)}
          type="number"
          min={1}
        />
      </div>
      {errMsg && <p className="text-[12px] text-[#ff3b30]">{errMsg}</p>}
      <Sep />
      <button type="button" onClick={addXp} disabled={busy} className={btnPrimaryCls + ' w-full'}>
        {busy ? 'En cours…' : 'Ajouter XP'}
      </button>
    </div>
  )
}

export const ADMIN_OPEN_PRODUCT_EDITOR = 'admin:open-product-editor'

// ─── Page config ──────────────────────────────────────────────────────────────
type PageConfig =
  | { kind: 'panel'; label: string; title: string; content: (props: { onSuccess: (msg: string) => void }) => React.ReactElement }
  | { kind: 'trigger'; label: string; event: string }

function getPageConfig(pathname: string): PageConfig | null {
  if (pathname === '/car-club') {
    return {
      kind: 'panel',
      label: 'Car Club',
      title: 'Gérer Car Club',
      content: ({ onSuccess }) => <CarClubPanel onSuccess={onSuccess} />,
    }
  }
  if (pathname === '/account/dashboard') {
    return {
      kind: 'panel',
      label: 'Dashboard',
      title: 'Ajouter XP',
      content: ({ onSuccess }) => <DashboardPanel onSuccess={onSuccess} />,
    }
  }
  if (pathname.startsWith('/products/') || pathname.startsWith('/product/')) {
    return { kind: 'trigger', label: 'Produit', event: ADMIN_OPEN_PRODUCT_EDITOR }
  }
  return null
}

// ─── Main FAB ─────────────────────────────────────────────────────────────────
export function FloatingAdminFab() {
  const { isAdmin, loading } = useAdmin()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const pageConfig = getPageConfig(location.pathname)

  const showSuccess = useCallback((msg: string) => {
    setToast(msg)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 3000)
  }, [])

  // Close panel on route change
  useEffect(() => { setOpen(false) }, [location.pathname])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (loading || !isAdmin || !pageConfig) return null

  function handleFabClick() {
    if (pageConfig!.kind === 'trigger') {
      document.dispatchEvent(new CustomEvent(pageConfig!.event))
    } else {
      setOpen((o) => !o)
    }
  }

  const isTrigger = pageConfig.kind === 'trigger'

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-[9900] flex flex-col items-end gap-3">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-[12px] bg-[#1d1d1f] text-white text-[12px] font-medium px-4 py-2.5 shadow-lg max-w-[260px] text-right"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel (only for panel-kind pages) */}
      <AnimatePresence>
        {!isTrigger && open && pageConfig.kind === 'panel' && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-[320px] rounded-[20px] bg-white shadow-[0_8px_40px_rgba(0,0,0,0.14),0_2px_8px_rgba(0,0,0,0.06)] border border-[#e5e5e5] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868b]">
                  Admin · {pageConfig.label}
                </span>
                <h3 className="text-[15px] font-bold text-[#1d1d1f] tracking-tight leading-tight">
                  {pageConfig.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="w-7 h-7 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[#86868b] hover:bg-[#e5e5e5] transition-colors text-[16px] leading-none"
                aria-label="Fermer"
              >
                ×
              </button>
            </div>

            {/* Divider */}
            <div className="h-px bg-[#e5e5e5] mx-5" />

            {/* Content */}
            <div className="px-5 py-4">
              <pageConfig.content onSuccess={showSuccess} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB button */}
      <motion.button
        type="button"
        onClick={handleFabClick}
        whileTap={{ scale: 0.9 }}
        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-[0_4px_16px_rgba(0,0,0,0.14)] border transition-all ${
          !isTrigger && open
            ? 'bg-[#1d1d1f] border-[#1d1d1f] text-white'
            : 'bg-white border-[#d2d2d7] text-[#1d1d1f] hover:shadow-[0_6px_20px_rgba(0,0,0,0.18)]'
        }`}
        aria-label="Admin panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 22c-3.806-1.45-7-3.966-7-9V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1v4"/>
          <path d="M14.923 16.547 14 16.164"/>
          <path d="m14.923 18.843-.923.383"/>
          <path d="M16.547 14.923 16.164 14"/>
          <path d="m16.547 20.467-.383.924"/>
          <path d="m18.843 14.923.383-.923"/>
          <path d="m19.225 21.391-.382-.924"/>
          <path d="m20.467 16.547.923-.383"/>
          <path d="m20.467 18.843.923.383"/>
          <circle cx="17.695" cy="17.695" r="3"/>
        </svg>
      </motion.button>
    </div>
  )
}
