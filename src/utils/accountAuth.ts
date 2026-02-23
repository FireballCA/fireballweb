export type AccountRecord = {
  fullName: string
  email: string
  password: string
  createdAt: string
}

const ACCOUNTS_KEY = 'fireball.accounts.v1'
const SESSION_KEY = 'fireball.session.v1'
const WELCOME_KEY = 'fireball.welcome.v1'

function readJson<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
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

  localStorage.setItem(SESSION_KEY, account.email)
  return { ok: true as const, account }
}

export function logoutAccount() {
  localStorage.removeItem(SESSION_KEY)
}

export function getCurrentAccount(): AccountRecord | null {
  const sessionEmail = localStorage.getItem(SESSION_KEY)
  if (!sessionEmail) return null
  return getAccounts().find((item) => item.email === sessionEmail) ?? null
}

export function setWelcomeMessage(fullName: string) {
  localStorage.setItem(WELCOME_KEY, fullName)
}

export function consumeWelcomeMessage(): string | null {
  const value = localStorage.getItem(WELCOME_KEY)
  if (!value) return null
  localStorage.removeItem(WELCOME_KEY)
  return value
}
