import { useCallback, useEffect, useState } from 'react'
import { AppleCapsuleLabel } from '@/components/ui/AppleInfoPill'
import { AppleButton } from '@/components/ui/AppleButton'
import {
  buildPartnerShareText,
  fetchServiceRequestsForAdmin,
  markServiceRequestSharedWithPartners,
  type ServiceRequestRow,
} from '@/utils/serviceRequests'
import { useNotifications } from '@/context/NotificationsContext'
import { AdminServiceRequestPhotosSection } from '@/components/business/admin/AdminServiceRequestPhotosSection'

export function AdminServiceRequestsPage() {
  const { notify } = useNotifications()
  const [rows, setRows] = useState<ServiceRequestRow[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const data = await fetchServiceRequestsForAdmin()
    setRows(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleShare = useCallback(
    async (row: ServiceRequestRow) => {
      const text = buildPartnerShareText(row)
      try {
        if (navigator.share) {
          await navigator.share({ title: `Service ${row.reference}`, text })
        } else {
          await navigator.clipboard.writeText(text)
        }
      } catch (e) {
        if ((e as Error).name === 'AbortError') return
        try {
          await navigator.clipboard.writeText(text)
        } catch {
          notify({ title: 'Unable to share or copy.', message: '', kind: 'error' })
          return
        }
      }
      const ok = await markServiceRequestSharedWithPartners(row.id)
      if (ok) {
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? { ...r, shared_with_partners: true, shared_with_partners_at: new Date().toISOString() }
              : r,
          ),
        )
        notify({
          title: 'Partner summary sent (or copied) and logged as shared.',
          message: '',
          kind: 'success',
        })
      }
    },
    [notify],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-[11px] font-nav font-bold uppercase tracking-[0.16em] text-slate-400">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 md:text-3xl">Service requests</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Demandes issues du Service Builder (parcours complet) ou du Quick service sur la carte installateurs. Les
          demandes « map » incluent la boutique liée. Utilisez Partager pour envoyer un résumé aux autres partenaires.
        </p>
        <AppleButton type="button" className="mt-4 !text-sm" onClick={() => void load()}>
          Refresh
        </AppleButton>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
          No service requests yet. Submissions from the site will appear here once the database migration is applied.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <p className="font-mono text-sm font-semibold text-slate-900">{row.reference}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(row.created_at).toLocaleString('fr-CA', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <AppleCapsuleLabel>
                    {row.source === 'quick_service_map' ? 'Quick service' : 'Service Builder'}
                  </AppleCapsuleLabel>
                  {row.shared_with_partners ? (
                    <span className="text-[11px] font-medium text-emerald-700">Shared with partners</span>
                  ) : null}
                </div>
              </div>

              {row.stockist_snapshot ? (
                <p className="mt-3 text-sm text-slate-700">
                  <span className="font-semibold text-slate-900">Shop:</span> {row.stockist_snapshot}
                </p>
              ) : null}

              <div className="mt-4 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                <p>
                  <span className="font-semibold text-slate-900">Vehicle:</span> {row.vehicle_year}{' '}
                  {row.vehicle_make} {row.vehicle_model} · {row.vehicle_size} · {row.paint_condition}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Coating:</span> {row.coating_name}
                  {row.wax_name ? ` + ${row.wax_name}` : ''}
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Estimate:</span> $
                  {Number(row.estimate_cad).toFixed(0)} CAD
                </p>
                <p>
                  <span className="font-semibold text-slate-900">Contact:</span> {row.contact_first_name}{' '}
                  {row.contact_last_name} · {row.contact_email} · {row.contact_phone}
                </p>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-800">
                <span className="font-semibold text-slate-900">Service location:</span> {row.service_address}
              </div>

              {row.custom_message ? (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{row.custom_message}</p>
              ) : null}
              <AdminServiceRequestPhotosSection row={row} />

              <div className="mt-4 flex flex-wrap gap-2">
                <AppleButton
                  type="button"
                  className="!text-sm"
                  onClick={() => void handleShare(row)}
                >
                  Share with other partners
                </AppleButton>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
