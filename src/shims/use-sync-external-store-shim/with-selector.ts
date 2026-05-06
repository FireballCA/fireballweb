/**
 * Zustand importe en default depuis le shim with-selector.
 * On délègue à l'entrée non-shim du paquet (utilise déjà React.useSyncExternalStore).
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useSyncExternalStoreWithSelector } from 'use-sync-external-store/with-selector.js'

export default {
  useSyncExternalStoreWithSelector,
}
