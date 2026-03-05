import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUserProfile } from '@/utils/supabaseAuth'

interface ClientRow {
  id: string
  full_name: string
  email: string
  phone: string | null
  created_at: string
}

export function PartnerClients() {
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [list, setList] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'add' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  const loadPartnerAndClients = async () => {
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
    const { data } = await supabase
      .from('partner_clients')
      .select('id,full_name,email,phone,created_at')
      .eq('partner_id', pid)
      .order('created_at', { ascending: false })
    setList((data ?? []) as ClientRow[])
  }

  useEffect(() => {
    let mounted = true
    loadPartnerAndClients().then(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, [])

  const openAdd = () => {
    setEditingId(null)
    setFullName('')
    setEmail('')
    setPhone('')
    setError('')
    setModal('add')
  }
  const openEdit = (row: ClientRow) => {
    setEditingId(row.id)
    setFullName(row.full_name)
    setEmail(row.email)
    setPhone(row.phone || '')
    setError('')
    setModal('edit')
  }
  const save = async () => {
    if (!partnerId) return
    setError('')
    if (modal === 'add') {
      const { error: e } = await supabase.from('partner_clients').insert({
        partner_id: partnerId,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
      })
      if (e) {
        setError(e.message || 'Failed to add client.')
        return
      }
    } else if (editingId) {
      const { error: e } = await supabase
        .from('partner_clients')
        .update({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
        })
        .eq('id', editingId)
      if (e) {
        setError(e.message || 'Failed to update.')
        return
      }
    }
    setModal(null)
    loadPartnerAndClients()
  }
  const remove = async (id: string) => {
    if (!confirm('Delete this client?')) return
    await supabase.from('partner_clients').delete().eq('id', id)
    loadPartnerAndClients()
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
        <h1 className="text-2xl font-semibold text-white">Clients</h1>
        <button
          type="button"
          onClick={openAdd}
          className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
        >
          Add client
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
        {list.length === 0 ? (
          <div className="p-8 text-center text-white/50 text-sm">No clients yet. Add one to get started.</div>
        ) : (
          <ul className="divide-y divide-white/10">
            {list.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-white font-medium">{row.full_name}</p>
                  <p className="text-sm text-white/60">{row.email}</p>
                  {row.phone && <p className="text-xs text-white/45">{row.phone}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEdit(row)}
                    className="rounded-lg px-3 py-1.5 text-xs text-white/80 hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row.id)}
                    className="rounded-lg px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111] p-6">
            <h2 className="text-lg font-semibold text-white mb-4">{modal === 'add' ? 'Add client' : 'Edit client'}</h2>
            {error && <p className="mb-3 text-sm text-red-400">{error}</p>}
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 rounded-xl border border-white/20 py-2 text-sm text-white/80"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                className="flex-1 rounded-xl bg-white text-black py-2 text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
