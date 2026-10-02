import { API_BASE_URL } from './config'
import { clearSession, getSession, saveRotatedIfCurrent, type Session } from './session'

/// Erro da API no formato do filtro global da pauta-api:
/// `{ statusCode, code, message }`. `code` é para reagir; `message`, para
/// mostrar. `status` 0 é falha de rede (a requisição nem chegou).
export class ApiError extends Error {
  readonly status: number
  readonly code?: string

  constructor(status: number, code: string | undefined, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

interface RequestOptions {
  /// `false` para as rotas abertas (`/auth/login`, `/auth/logout`).
  auth?: boolean
}

/// Uma chamada à `/api/v1`. Com `auth`, põe o access token e, diante de um
/// 401, renova a sessão **uma vez** e repete — a mesma regra do
/// `AuthInterceptor` do app.
export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  { auth = true }: RequestOptions = {},
): Promise<T> {
  if (!auth) return parseResponse<T>(await send(path, init))

  const session = getSession()
  if (!session) throw new ApiError(401, 'NO_SESSION', 'Entre para continuar.')

  let response = await send(path, init, session.accessToken)
  if (response.status === 401) {
    const renewed = await renewSession(session.accessToken)
    response = await send(path, init, renewed.accessToken)
    // Recusado de novo com um token recém-emitido: a conta não vale mais.
    if (response.status === 401) clearSession()
  }
  return parseResponse<T>(response)
}

async function send(path: string, init: RequestInit, accessToken?: string): Promise<Response> {
  const headers = new Headers(init.headers)
  headers.set('Accept', 'application/json')
  if (init.body !== undefined) headers.set('Content-Type', 'application/json')
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

  try {
    return await fetch(`${API_BASE_URL}/api/v1${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Não foi possível falar com a API. Confira a conexão.')
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

async function toApiError(response: Response): Promise<ApiError> {
  // O 429 do rate limit chega em inglês ("ThrottlerException: Too Many
  // Requests"); ver Dívidas conhecidas no AGENTS.md.
  if (response.status === 429) {
    return new ApiError(429, 'TOO_MANY_REQUESTS', 'Muitas tentativas seguidas. Espere um minuto e tente de novo.')
  }
  let code: string | undefined
  let message = 'Algo deu errado na API. Tente de novo.'
  try {
    const body = (await response.json()) as { code?: unknown; message?: unknown }
    if (typeof body.code === 'string') code = body.code
    if (typeof body.message === 'string') message = body.message
    else if (Array.isArray(body.message)) message = body.message.join(' ')
  } catch {
    // Corpo que não é JSON: fica a frase genérica.
  }
  return new ApiError(response.status, code, message)
}

// ---------------------------------------------------------------------------
// Renovação da sessão

let inFlight: Promise<Session> | null = null

/// Renova a sessão cujo access token acabou de ser recusado.
///
/// - Nesta aba, várias requisições recusadas ao mesmo tempo esperam a
///   **mesma** renovação.
/// - Entre abas, a renovação passa por um lock do navegador, e dentro dele a
///   sessão é lida de novo: se outra aba já renovou, usa o par dela **sem**
///   renovar. Renovar com o refresh antigo seria replay, e a API derruba
///   todas as sessões da pessoa.
/// - Só 401/400 da renovação encerram a sessão. Falha de rede mantém os
///   tokens para a próxima tentativa.
export function renewSession(failedAccessToken: string): Promise<Session> {
  inFlight ??= withRefreshLock(() => refreshUnlessRenewed(failedAccessToken)).finally(() => {
    inFlight = null
  })
  return inFlight
}

function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  // Web Locks existe em todo navegador atual; sem ele (ambiente antigo ou de
  // teste), vale só a fila desta aba.
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request('pauta-admin.refresh', fn)
  }
  return fn()
}

async function refreshUnlessRenewed(failedAccessToken: string): Promise<Session> {
  const current = getSession()
  if (!current) throw new ApiError(401, 'NO_SESSION', 'Sua sessão terminou. Entre novamente.')
  if (current.accessToken !== failedAccessToken) return current

  const response = await send('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: current.refreshToken }),
  })

  if (response.status === 401 || response.status === 400) {
    if (getSession()?.refreshToken === current.refreshToken) clearSession()
    throw new ApiError(401, 'SESSION_EXPIRED', 'Sua sessão expirou. Entre novamente.')
  }
  if (!response.ok) throw await toApiError(response)

  const pair = (await response.json()) as Session
  const next = { accessToken: pair.accessToken, refreshToken: pair.refreshToken }

  if (!saveRotatedIfCurrent(current.refreshToken, next)) {
    // Saíram da conta enquanto a renovação voava: o par novo não fica
    // guardado, e revogá-lo evita uma sessão órfã valendo 60 dias.
    void send('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: next.refreshToken }),
    }).catch(() => undefined)
    throw new ApiError(401, 'NO_SESSION', 'Sua sessão terminou. Entre novamente.')
  }
  return next
}
