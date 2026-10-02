import { useSyncExternalStore } from 'react'

/// A sessão do app (`/auth/login`), guardada no `localStorage` — o mesmo
/// lugar em que o app na Web guarda a dele. As abas dividem a sessão.
///
/// Os dois tokens vivem numa chave só: gravar um sem o outro deixaria, por um
/// instante, um access token de uma sessão com o refresh de outra.
export interface Session {
  accessToken: string
  refreshToken: string
}

const KEY = 'pauta-admin.session'
const listeners = new Set<() => void>()

let snapshotRaw: string | null = null
let snapshot: Session | null = null

function readRaw(): string | null {
  try {
    return localStorage.getItem(KEY)
  } catch {
    return null
  }
}

/// Lê **sempre** do armazenamento, e não de uma cópia em memória: outra aba
/// pode ter renovado a sessão um instante atrás, e o evento `storage` chega
/// depois. O objeto devolvido só muda quando o conteúdo muda, que é o que o
/// `useSyncExternalStore` exige.
export function getSession(): Session | null {
  const raw = readRaw()
  if (raw === snapshotRaw) return snapshot
  snapshotRaw = raw
  snapshot = parse(raw)
  return snapshot
}

function parse(raw: string | null): Session | null {
  if (!raw) return null
  try {
    const value: unknown = JSON.parse(raw)
    if (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as Session).accessToken === 'string' &&
      typeof (value as Session).refreshToken === 'string'
    ) {
      const { accessToken, refreshToken } = value as Session
      return { accessToken, refreshToken }
    }
  } catch {
    // Conteúdo corrompido vale como sem sessão.
  }
  return null
}

export function saveSession(session: Session): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(session))
  } catch {
    // Armazenamento bloqueado: a sessão não sobrevive, mas a tela segue.
  }
  notify()
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // idem
  }
  notify()
}

/// Grava o par renovado só se o refresh guardado ainda for o que foi usado.
/// É a regra do `saveRotatedIfCurrent` do app: um logout (nesta aba ou em
/// outra) no meio da renovação não pode ser desfeito por ela.
export function saveRotatedIfCurrent(usedRefreshToken: string, next: Session): boolean {
  if (getSession()?.refreshToken !== usedRefreshToken) return false
  saveSession(next)
  return true
}

/// O e-mail de quem está na sessão, só para a tela dizer qual conta entrou.
/// **Nunca para autorizar**: quem decide o acesso é o `/admin/me`.
export function sessionEmail(session: Session | null): string | null {
  const payload = session?.accessToken.split('.')[1]
  if (!payload) return null
  try {
    const json: unknown = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')))
    const email = (json as { email?: unknown }).email
    return typeof email === 'string' ? email : null
  } catch {
    return null
  }
}

function notify() {
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) listener()
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

/// A sessão atual, atualizada também quando outra aba entra, sai ou renova.
export function useSession(): Session | null {
  return useSyncExternalStore(subscribe, getSession)
}
