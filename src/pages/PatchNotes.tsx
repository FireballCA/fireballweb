import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

// ── Types ──────────────────────────────────────────────────────────────────────

type ChangeType = 'added' | 'changed' | 'fixed' | 'removed'

interface PatchChange {
  type: ChangeType
  text: string
}

interface PatchNote {
  id: string
  version: string
  title: string
  note_date: string
  changes: PatchChange[]
}

// ── Config ─────────────────────────────────────────────────────────────────────

const CHANGE_CONFIG: Record<ChangeType, { label: string; dot: string; text: string; bg: string }> = {
  added:   { label: 'Added',   dot: 'bg-[#34C759]', text: 'text-[#1A7A33]', bg: 'bg-[#E8F5EC]' },
  changed: { label: 'Changed', dot: 'bg-[#0485F7]', text: 'text-[#0366C7]', bg: 'bg-[#E5F0FE]' },
  fixed:   { label: 'Fixed',   dot: 'bg-[#FF9500]', text: 'text-[#C47200]', bg: 'bg-[#FFF4E5]' },
  removed: { label: 'Removed', dot: 'bg-[#FF3B30]', text: 'text-[#C4312A]', bg: 'bg-[#FFEDEC]' },
}

const CHANGE_TYPES: ChangeType[] = ['added', 'changed', 'fixed', 'removed']

// ── Seed data ──────────────────────────────────────────────────────────────────
// Supabase SQL:
//   create table if not exists patch_notes (
//     id uuid primary key default gen_random_uuid(),
//     version text not null, title text not null,
//     note_date date not null default current_date,
//     changes jsonb not null default '[]'::jsonb,
//     created_at timestamptz not null default now()
//   );
//   alter table patch_notes enable row level security;
//   create policy "public_read" on patch_notes for select using (true);
//   create policy "admin_all"   on patch_notes for all    using (true);

const SEED_PATCHES: PatchNote[] = [
  {
    id: 'seed-v1-0-0',
    version: '1.0.0',
    title: 'Platform launch',
    note_date: '2025-05-06',
    changes: [
      { type: 'added', text: 'Home page with product lineup & full-screen hero' },
      { type: 'added', text: 'Shop with product grid, category filters & sort' },
      { type: 'added', text: 'Individual product pages with variant selector' },
      { type: 'added', text: 'Shopify Storefront API integration for live product data' },
      { type: 'added', text: 'Member account system (Supabase Auth)' },
      { type: 'added', text: 'Cart & Shopify checkout redirect flow' },
      { type: 'added', text: 'Academy training request & booking system' },
      { type: 'added', text: 'Partner portal with dashboard, warranties & statistics' },
      { type: 'added', text: 'Admin panel — user management, notifications, XP tools' },
      { type: 'added', text: 'Member dashboard with XP progression, garage & leaderboard' },
      { type: 'added', text: 'In-app notifications system' },
      { type: 'added', text: 'Lenis smooth scroll with premium feel' },
    ],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso + 'T12:00:00').toLocaleDateString('en-CA', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
  } catch { return iso }
}

// ── Shared form fields component ───────────────────────────────────────────────

function PatchForm({
  title: formTitle,
  version,
  date,
  changes,
  saving,
  canSubmit,
  onVersionChange,
  onTitleChange,
  onDateChange,
  onChangesUpdate,
  onAddLine,
  onRemoveLine,
  onSave,
  onCancel,
  saveLabel = 'Save patch',
}: {
  title: string
  version: string
  date: string
  changes: { type: ChangeType; text: string }[]
  saving: boolean
  canSubmit: boolean
  onVersionChange: (v: string) => void
  onTitleChange: (v: string) => void
  onDateChange: (v: string) => void
  onChangesUpdate: (i: number, field: 'type' | 'text', val: string) => void
  onAddLine: () => void
  onRemoveLine: (i: number) => void
  onSave: () => void
  onCancel: () => void
  saveLabel?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E2E2E2] bg-white px-6 py-6 shadow-sm">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#1d1d1f]">Version</label>
          <input
            type="text"
            placeholder="e.g. 1.1.0"
            value={version}
            onChange={(e) => onVersionChange(e.target.value)}
            className="w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3.5 py-2.5 text-[14px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[12px] font-semibold text-[#1d1d1f]">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3.5 py-2.5 text-[14px] text-[#1d1d1f] outline-none focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block text-[12px] font-semibold text-[#1d1d1f]">Title</label>
        <input
          type="text"
          placeholder="Brief description of this release"
          value={formTitle}
          onChange={(e) => onTitleChange(e.target.value)}
          className="w-full rounded-[10px] border border-[#D2D2D7] bg-white px-3.5 py-2.5 text-[14px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
        />
      </div>

      <div className="mt-5">
        <div className="mb-3 flex items-center justify-between">
          <label className="text-[12px] font-semibold text-[#1d1d1f]">Changes</label>
          <button type="button" onClick={onAddLine} className="text-[12px] font-semibold text-[#0485F7] hover:text-[#0366c7]">
            + Add line
          </button>
        </div>
        <div className="space-y-2">
          {changes.map((change, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex flex-wrap gap-1 shrink-0">
                {CHANGE_TYPES.map((t) => {
                  const cfg = CHANGE_CONFIG[t]
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onChangesUpdate(i, 'type', t)}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors ${
                        change.type === t
                          ? `${cfg.bg} ${cfg.text}`
                          : 'bg-[#F5F5F7] text-[#8A8A8A] hover:bg-[#EBEBEB]'
                      }`}
                    >
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
              <input
                type="text"
                placeholder="Describe the change…"
                value={change.text}
                onChange={(e) => onChangesUpdate(i, 'text', e.target.value)}
                className="min-w-0 flex-1 rounded-[8px] border border-[#D2D2D7] bg-white px-3 py-2 text-[13px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              />
              {changes.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveLine(i)}
                  className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[8px] text-[#C8C8C8] transition-colors hover:bg-[#FFF0EF] hover:text-[#FF3B30]"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3 border-t border-[#F0F0F0] pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full px-5 py-2.5 text-[13px] font-semibold text-[#1d1d1f] transition-colors hover:bg-[#F0F0F0] active:scale-95"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving || !canSubmit}
          className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#333] active:scale-95 disabled:opacity-40"
        >
          {saving ? 'Saving…' : saveLabel}
        </button>
      </div>
    </div>
  )
}

// ── PatchCard (read view) ──────────────────────────────────────────────────────

function PatchCard({
  patch,
  isLatest,
  isAdmin,
  onEdit,
  onDelete,
}: {
  patch: PatchNote
  isLatest: boolean
  isAdmin: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  const grouped = CHANGE_TYPES.map((type) => ({
    type,
    items: patch.changes.filter((c) => c.type === type),
  })).filter((g) => g.items.length > 0)

  return (
    <article className="rounded-2xl border border-[#E8E8E8] bg-white px-6 py-5 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#1d1d1f] px-3 py-1 text-[12px] font-bold leading-none text-white">
            v{patch.version}
          </span>
          {isLatest && (
            <span className="rounded-full bg-[#E8F5EC] px-2.5 py-1 text-[11px] font-semibold leading-none text-[#1F7A3E]">
              Latest
            </span>
          )}
          <span className="text-[12px] text-[#8A8A8A]">{formatDate(patch.note_date)}</span>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-1">
            {/* Edit */}
            <button
              type="button"
              onClick={onEdit}
              className="rounded-lg p-1.5 text-[#C8C8C8] transition-colors hover:bg-[#F0F4FF] hover:text-[#0485F7]"
              aria-label="Edit patch note"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-1.414.929l-3.536.707.707-3.536A4 4 0 019 13z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-lg p-1.5 text-[#C8C8C8] transition-colors hover:bg-[#FFF0EF] hover:text-[#FF3B30]"
              aria-label="Delete patch note"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <h2 className="mb-4 text-[17px] font-semibold leading-snug text-[#1d1d1f]">{patch.title}</h2>

      <div className="space-y-3">
        {grouped.map(({ type, items }) => {
          const cfg = CHANGE_CONFIG[type]
          return (
            <div key={type}>
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                <span className={`text-[11px] font-bold uppercase tracking-[0.1em] ${cfg.text}`}>{cfg.label}</span>
              </div>
              <ul className="space-y-1 pl-3.5">
                {items.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] leading-[1.5] text-[#4A4A4A]">
                    <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-[#C8C8C8]" />
                    {c.text}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </article>
  )
}

// ── Inline edit wrapper ────────────────────────────────────────────────────────

function EditCard({
  patch,
  onSaved,
  onCancel,
}: {
  patch: PatchNote
  // originalId = ID de l'entrée à remplacer dans la liste (peut différer si seed→DB)
  onSaved: (updated: PatchNote, originalId: string) => void
  onCancel: () => void
}) {
  const [version, setVersion] = useState(patch.version)
  const [title, setTitle] = useState(patch.title)
  const [date, setDate] = useState(patch.note_date)
  const [changes, setChanges] = useState<{ type: ChangeType; text: string }[]>(
    patch.changes.length > 0 ? patch.changes : [{ type: 'added', text: '' }],
  )
  const [saving, setSaving] = useState(false)

  const updateChange = (i: number, field: 'type' | 'text', val: string) =>
    setChanges((prev) => prev.map((c, j) => (j === i ? { ...c, [field]: val } : c)))

  const canSubmit = version.trim() && title.trim() && changes.some((c) => c.text.trim())

  const handleSave = async () => {
    const cleanChanges = changes.filter((c) => c.text.trim())
    if (!version.trim() || !title.trim() || cleanChanges.length === 0) return
    setSaving(true)

    const fields = { version: version.trim(), title: title.trim(), note_date: date, changes: cleanChanges }
    // Fallback local si Supabase échoue
    const localFallback: PatchNote = { id: patch.id, ...fields }

    try {
      if (patch.id.startsWith('seed-')) {
        // Les IDs seed ne sont pas des UUIDs valides → INSERT simple, nouvel UUID généré par Supabase
        const { data, error } = await supabase
          .from('patch_notes')
          .insert(fields)
          .select('id, version, title, note_date, changes')
          .single()
        onSaved((!error && data ? data as PatchNote : localFallback), patch.id)
      } else {
        const { data, error } = await supabase
          .from('patch_notes')
          .update(fields)
          .eq('id', patch.id)
          .select('id, version, title, note_date, changes')
          .single()
        onSaved((!error && data ? data as PatchNote : localFallback), patch.id)
      }
    } catch {
      onSaved(localFallback, patch.id)
    } finally {
      setSaving(false)
    }
  }

  return (
    <PatchForm
      title={title}
      version={version}
      date={date}
      changes={changes}
      saving={saving}
      canSubmit={!!canSubmit}
      onVersionChange={setVersion}
      onTitleChange={setTitle}
      onDateChange={setDate}
      onChangesUpdate={updateChange}
      onAddLine={() => setChanges((prev) => [...prev, { type: 'added', text: '' }])}
      onRemoveLine={(i) => setChanges((prev) => prev.filter((_, j) => j !== i))}
      onSave={handleSave}
      onCancel={onCancel}
      saveLabel="Save changes"
    />
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export function PatchNotes() {
  const navigate = useNavigate()
  const [patches, setPatches] = useState<PatchNote[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tableError, setTableError] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  // New patch form state
  const [nVersion, setNVersion] = useState('')
  const [nTitle, setNTitle] = useState('')
  const [nDate, setNDate] = useState(() => new Date().toISOString().split('T')[0])
  const [nChanges, setNChanges] = useState<{ type: ChangeType; text: string }[]>([{ type: 'added', text: '' }])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const profile = await getCurrentUserProfile()
      const admin = String(profile?.role || '').trim().toLowerCase() === 'admin'
      if (!cancelled) setIsAdmin(admin)

      try {
        const { data, error } = await supabase
          .from('patch_notes')
          .select('id, version, title, note_date, changes')
          .order('note_date', { ascending: false })
        if (error) throw error

        const dbIds = new Set((data ?? []).map((p) => p.id))
        const dismissed = new Set<string>(JSON.parse(localStorage.getItem('pn_dismissed_seeds') ?? '[]'))
        const seedNotInDb = SEED_PATCHES.filter((p) => !dbIds.has(p.id) && !dismissed.has(p.id))
        const merged = [...(data as PatchNote[]), ...seedNotInDb].sort((a, b) =>
          b.note_date.localeCompare(a.note_date),
        )
        if (!cancelled) setPatches(merged)
      } catch {
        if (!cancelled) {
          setTableError(true)
          const dismissed = new Set<string>(JSON.parse(localStorage.getItem('pn_dismissed_seeds') ?? '[]'))
          setPatches([...SEED_PATCHES].filter((p) => !dismissed.has(p.id)).sort((a, b) => b.note_date.localeCompare(a.note_date)))
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  const resetNewForm = () => {
    setNVersion('')
    setNTitle('')
    setNDate(new Date().toISOString().split('T')[0])
    setNChanges([{ type: 'added', text: '' }])
    setShowNewForm(false)
  }

  const handleCreate = async () => {
    const cleanChanges = nChanges.filter((c) => c.text.trim())
    if (!nVersion.trim() || !nTitle.trim() || cleanChanges.length === 0) return
    setSaving(true)
    try {
      const { data, error } = await supabase
        .from('patch_notes')
        .insert({ version: nVersion.trim(), title: nTitle.trim(), note_date: nDate, changes: cleanChanges })
        .select('id, version, title, note_date, changes')
        .single()
      if (!error && data) {
        setPatches((prev) =>
          [data as PatchNote, ...prev].sort((a, b) => b.note_date.localeCompare(a.note_date)),
        )
        resetNewForm()
      }
    } finally {
      setSaving(false)
    }
  }

  const handleSaved = (updated: PatchNote, originalId: string) => {
    setPatches((prev) =>
      prev
        .map((p) => p.id === originalId ? updated : p)
        .sort((a, b) => b.note_date.localeCompare(a.note_date)),
    )
    setEditingId(null)
  }

  const handleDelete = async (id: string) => {
    setDeleting(id)
    if (id.startsWith('seed-')) {
      const prev = JSON.parse(localStorage.getItem('pn_dismissed_seeds') ?? '[]') as string[]
      localStorage.setItem('pn_dismissed_seeds', JSON.stringify([...new Set([...prev, id])]))
    }
    try {
      await supabase.from('patch_notes').delete().eq('id', id)
      setPatches((prev) => prev.filter((p) => p.id !== id))
    } finally {
      setDeleting(null)
    }
  }

  const updateNChange = (i: number, field: 'type' | 'text', val: string) =>
    setNChanges((prev) => prev.map((c, j) => (j === i ? { ...c, [field]: val } : c)))

  const latestVersion = patches[0]?.version ?? '…'
  const canSubmitNew = nVersion.trim() && nTitle.trim() && nChanges.some((c) => c.text.trim())

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-[720px] px-5 py-12">

        {/* Back */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-1.5 text-sm text-[#6B6B6B] transition-colors hover:text-[#1d1d1f]"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#E8E8E8] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#34C759]" />
              <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#1d1d1f]">
                v{latestVersion} · Latest
              </span>
            </div>
            <h1 className="text-[32px] font-bold leading-tight text-[#1d1d1f]">Patch Notes</h1>
            <p className="mt-1.5 text-sm text-[#6B6B6B]">Platform changelog · Fireball Canada</p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => { setShowNewForm((v) => !v); setEditingId(null) }}
              className="mt-1 flex shrink-0 items-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#333] active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              New patch
            </button>
          )}
        </div>

        {/* Supabase setup notice */}
        {tableError && isAdmin && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <p className="text-sm font-semibold text-amber-900">Table not found in Supabase</p>
            <p className="mt-1 text-xs leading-relaxed text-amber-700">
              Run the SQL below in your Supabase SQL editor to enable saving patches:
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-amber-100 bg-white px-4 py-3 text-[11px] leading-relaxed text-amber-900">
{`create table if not exists patch_notes (
  id         uuid primary key default gen_random_uuid(),
  version    text not null,
  title      text not null,
  note_date  date not null default current_date,
  changes    jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
alter table patch_notes enable row level security;
create policy "public_read" on patch_notes for select using (true);
create policy "admin_all"   on patch_notes for all    using (true);`}
            </pre>
          </div>
        )}

        {/* New patch form */}
        {showNewForm && isAdmin && (
          <div className="mb-8">
            <p className="mb-3 text-[13px] font-bold uppercase tracking-[0.08em] text-[#1d1d1f]">New Patch Note</p>
            <PatchForm
              title={nTitle}
              version={nVersion}
              date={nDate}
              changes={nChanges}
              saving={saving}
              canSubmit={!!canSubmitNew}
              onVersionChange={setNVersion}
              onTitleChange={setNTitle}
              onDateChange={setNDate}
              onChangesUpdate={updateNChange}
              onAddLine={() => setNChanges((prev) => [...prev, { type: 'added', text: '' }])}
              onRemoveLine={(i) => setNChanges((prev) => prev.filter((_, j) => j !== i))}
              onSave={handleCreate}
              onCancel={resetNewForm}
              saveLabel="Save patch"
            />
          </div>
        )}

        {/* Patch list */}
        {loading ? (
          <div className="space-y-4">
            {[200, 160, 230].map((h, i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-[#EBEBEB]" style={{ height: h }} />
            ))}
          </div>
        ) : patches.length === 0 ? (
          <p className="py-16 text-center text-sm text-[#8A8A8A]">No patch notes yet.</p>
        ) : (
          <div className="space-y-4">
            {patches.map((patch, idx) => (
              <div
                key={patch.id}
                className={deleting === patch.id ? 'pointer-events-none opacity-40 transition-opacity' : ''}
              >
                {editingId === patch.id ? (
                  <EditCard
                    patch={patch}
                    onSaved={(updated, originalId) => handleSaved(updated, originalId)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <PatchCard
                    patch={patch}
                    isLatest={idx === 0}
                    isAdmin={isAdmin}
                    onEdit={() => { setEditingId(patch.id); setShowNewForm(false) }}
                    onDelete={() => { void handleDelete(patch.id) }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && patches.length > 0 && (
          <p className="mt-8 text-center text-[12px] text-[#C8C8C8]">
            {patches.length} {patches.length === 1 ? 'release' : 'releases'} total
          </p>
        )}

      </div>
    </div>
  )
}
