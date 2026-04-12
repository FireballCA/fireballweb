/**
 * Zustand importe en default depuis `…/shim/with-selector.js`.
 * On délègue à l’entrée non-shim du paquet (utilise déjà React.useSyncExternalStore).
 */
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js'

export default {
  useSyncExternalStoreWithSelector,
}
