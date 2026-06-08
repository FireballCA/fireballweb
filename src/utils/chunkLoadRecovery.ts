/** Session flag : une seule tentative de rechargement après échec de chunk (post-déploiement). */
export const CHUNK_RELOAD_SESSION_KEY = 'fb-chunk-reload-v1'

export function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  const name = error instanceof Error ? error.name : ''
  return (
    name === 'ChunkLoadError' ||
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /MIME type.*text\/html/i.test(message) ||
    /Loading chunk \d+ failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message)
  )
}

/**
 * Après un déploiement Vite, un onglet ouvert garde l’ancien `index-*.js` qui pointe
 * vers des fichiers `/assets/*.js` supprimés. Le CDN renvoie alors `index.html` (SPA fallback)
 * → erreur MIME + page blanche. Un rechargement récupère le nouvel index et les bons hashes.
 */
export function reloadForStaleChunks(): void {
  if (typeof window === 'undefined') return
  if (sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) return
  sessionStorage.setItem(CHUNK_RELOAD_SESSION_KEY, '1')
  window.location.reload()
}

export function clearChunkReloadFlag(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CHUNK_RELOAD_SESSION_KEY)
}

export function importWithChunkRecovery<T>(importer: () => Promise<T>): () => Promise<T> {
  return async () => {
    try {
      const mod = await importer()
      clearChunkReloadFlag()
      return mod
    } catch (error) {
      if (isChunkLoadError(error) && !sessionStorage.getItem(CHUNK_RELOAD_SESSION_KEY)) {
        reloadForStaleChunks()
        return new Promise<T>(() => {
          /* rechargement en cours */
        })
      }
      throw error
    }
  }
}

export function registerChunkLoadRecoveryListeners(): void {
  if (typeof window === 'undefined') return

  window.addEventListener('unhandledrejection', (event) => {
    if (!isChunkLoadError(event.reason)) return
    event.preventDefault()
    reloadForStaleChunks()
  })

  window.addEventListener('error', (event) => {
    if (!isChunkLoadError(event.error ?? event.message)) return
    reloadForStaleChunks()
  })
}
