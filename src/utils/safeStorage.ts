const get = (s: Storage, k: string) => { try { return s.getItem(k) } catch { return null } }
const set = (s: Storage, k: string, v: string) => { try { s.setItem(k, v) } catch {} }
const remove = (s: Storage, k: string) => { try { s.removeItem(k) } catch {} }

export const safeLocal = {
  get: (k: string) => get(localStorage, k),
  set: (k: string, v: string) => set(localStorage, k, v),
  remove: (k: string) => remove(localStorage, k),
}

export const safeSession = {
  get: (k: string) => get(sessionStorage, k),
  set: (k: string, v: string) => set(sessionStorage, k, v),
  remove: (k: string) => remove(sessionStorage, k),
}
