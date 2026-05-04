import { useCallback, useEffect, useState } from 'react'
import { AppleButton } from '@/components/ui/AppleButton'
import {
  createSignedUrlsForServiceRequestPhotos,
  isServiceRequestStoragePhotoPath,
  parseServiceRequestPhotoManifest,
  type ServiceRequestRow,
} from '@/utils/serviceRequests'
import { useNotifications } from '@/context/NotificationsContext'

function zipFolderNameForClient(row: ServiceRequestRow): string {
  const name = `${row.contact_first_name.trim()}_${row.contact_last_name.trim()}`.replace(/\s+/g, '_')
  const safe = name.replace(/[\\/:*?"<>|]/g, '_').replace(/_+/g, '_').slice(0, 120)
  return safe || row.reference.replace(/[\\/:*?"<>|]/g, '_')
}

type Props = {
  row: ServiceRequestRow
}

export function AdminServiceRequestPhotosSection({ row }: Props) {
  const { notify } = useNotifications()
  const entries = parseServiceRequestPhotoManifest(row.photo_manifest)
  const legacyOnly = entries.filter((e) => !isServiceRequestStoragePhotoPath(e))
  const hasStoragePaths = entries.some(isServiceRequestStoragePhotoPath)

  const [signed, setSigned] = useState<{ path: string; signedUrl: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [zipBusy, setZipBusy] = useState(false)

  useEffect(() => {
    const storagePaths = parseServiceRequestPhotoManifest(row.photo_manifest).filter(isServiceRequestStoragePhotoPath)
    if (!storagePaths.length) {
      setSigned([])
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void createSignedUrlsForServiceRequestPhotos(storagePaths).then((urls) => {
      if (!cancelled) {
        setSigned(urls)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [row.photo_manifest])

  const handleDownloadZip = useCallback(async () => {
    if (signed.length === 0) return
    setZipBusy(true)
    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()
      const folder = zipFolderNameForClient(row)
      const root = zip.folder(folder)
      if (!root) {
        notify({ title: 'ZIP', message: 'Impossible de créer le dossier dans l’archive.', kind: 'error' })
        return
      }
      for (const { path, signedUrl } of signed) {
        const res = await fetch(signedUrl)
        if (!res.ok) continue
        const blob = await res.blob()
        const fileName = path.includes('/') ? path.split('/').pop() || 'photo.jpg' : path
        root.file(fileName, blob)
      }
      const out = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(out)
      const a = document.createElement('a')
      a.href = url
      a.download = `${folder}.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur inconnue'
      notify({ title: 'ZIP impossible', message, kind: 'error' })
    } finally {
      setZipBusy(false)
    }
  }, [notify, row, signed])

  if (!entries.length) return null

  return (
    <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Photos véhicule</p>

      {loading ? (
        <p className="mt-2 text-sm text-slate-600">Chargement des images…</p>
      ) : signed.length > 0 ? (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {signed.map(({ path, signedUrl }) => {
              const label = path.split('/').pop() || path
              return (
                <a
                  key={path}
                  href={signedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
                >
                  <img
                    src={signedUrl}
                    alt={label}
                    className="h-full w-full object-cover transition group-hover:opacity-95"
                    loading="lazy"
                  />
                  <span className="absolute inset-x-0 bottom-0 truncate bg-black/55 px-1.5 py-1 text-[10px] font-medium text-white">
                    {label}
                  </span>
                </a>
              )
            })}
          </div>
          <div className="mt-3">
            <AppleButton
              type="button"
              className="!text-sm"
              disabled={zipBusy}
              onClick={() => void handleDownloadZip()}
            >
              {zipBusy ? 'Préparation du ZIP…' : 'Télécharger les photos (ZIP)'}
            </AppleButton>
            <p className="mt-1.5 text-[11px] text-slate-500">
              Le dossier dans l’archive porte le nom du client : <span className="font-mono">{zipFolderNameForClient(row)}</span>
            </p>
          </div>
        </>
      ) : !loading && hasStoragePaths && signed.length === 0 ? (
        <p className="mt-2 text-xs text-red-600">
          Impossible de charger les images (vérifiez la migration storage, les droits admin et le bucket{' '}
          <span className="font-mono">service-request-images</span>).
        </p>
      ) : null}

      {legacyOnly.length > 0 ? (
        <p className="mt-2 text-xs leading-relaxed text-amber-800">
          Ancienne soumission : seuls des noms de fichiers sont enregistrés (pas de fichier sur le serveur) :{' '}
          <span className="font-mono text-[11px]">{legacyOnly.join(', ')}</span>
        </p>
      ) : null}
    </div>
  )
}
