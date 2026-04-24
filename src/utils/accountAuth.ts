export type AccountRecord = {
  fullName: string
  email: string
  password: string
  createdAt: string
}

import { safeLocal } from './safeStorage'

const ACCOUNTS_KEY = 'fireball.accounts.v1'
const SESSION_KEY = 'fireball.session.v1'
const WELCOME_KEY = 'fireball.welcome.v1'

function readJson<T>(key: string, fallback: T): T {
  const raw = safeLocal.get(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  safeLocal.set(key, JSON.stringify(value))
}

export function getAccounts(): AccountRecord[] {
  return readJson<AccountRecord[]>(ACCOUNTS_KEY, [])
}

export function registerAccount(input: { fullName: string; email: string; password: string }) {
  const email = input.email.trim().toLowerCase()
  const fullName = input.fullName.trim()
  const password = input.password
  const accounts = getAccounts()

  const existing = accounts.find((item) => item.email === email)
  if (existing) return { ok: false as const, reason: 'exists' as const }

  const account: AccountRecord = {
    fullName,
    email,
    password,
    createdAt: new Date().toISOString(),
  }

  writeJson(ACCOUNTS_KEY, [...accounts, account])
  return { ok: true as const, account }
}

export function loginAccount(input: { email: string; password: string }) {
  const email = input.email.trim().toLowerCase()
  const password = input.password
  const account = getAccounts().find((item) => item.email === email)

  if (!account) return { ok: false as const, reason: 'not_found' as const }
  if (account.password !== password) return { ok: false as const, reason: 'invalid_password' as const }

  safeLocal.set(SESSION_KEY, account.email)
  return { ok: true as const, account }
}

export function logoutAccount() {
  safeLocal.remove(SESSION_KEY)
}

export function getCurrentAccount(): AccountRecord | null {
  const sessionEmail = safeLocal.get(SESSION_KEY)
  if (!sessionEmail) return null
  return getAccounts().find((item) => item.email === sessionEmail) ?? null
}

export function setWelcomeMessage(fullName: string) {
  safeLocal.set(WELCOME_KEY, fullName)
}

export function consumeWelcomeMessage(): string | null {
  const value = safeLocal.get(WELCOME_KEY)
  if (!value) return null
  safeLocal.remove(WELCOME_KEY)
  return value
}
