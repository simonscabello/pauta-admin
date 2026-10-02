import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiRequest } from './api'
import { clearSession, getSession, saveSession } from './session'

/**
 * A renovação da sessão. É onde um erro custa caro e não aparece na tela: um
 * refresh a mais é replay, e a API derruba todas as sessões da pessoa — no
 * celular também.
 */

type Handler = (body: unknown, auth: string | null) => { status: number; body?: unknown } | 'network'

let routes: Record<string, Handler>
let calls: { path: string; auth: string | null; body: unknown }[]

beforeEach(() => {
  localStorage.clear()
  calls = []
  routes = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      const path = new URL(url).pathname.replace('/api/v1', '')
      const auth = new Headers(init.headers).get('Authorization')
      const body = init.body ? JSON.parse(String(init.body)) : undefined
      calls.push({ path, auth, body })
      const result = routes[path]?.(body, auth) ?? { status: 404 }
      if (result === 'network') throw new TypeError('Failed to fetch')
      // Um respiro, para duas chamadas simultâneas se cruzarem de verdade.
      await new Promise((resolve) => setTimeout(resolve, 5))
      return new Response(result.body === undefined ? null : JSON.stringify(result.body), {
        status: result.status,
      })
    }),
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const refreshCalls = () => calls.filter((c) => c.path === '/auth/refresh')

/// `/admin/me` aceita só o access token `aceito`.
function meAccepts(token: string) {
  routes['/admin/me'] = (_body, auth) =>
    auth === `Bearer ${token}` ? { status: 200, body: { id: 'u1' } } : { status: 401 }
}

describe('apiRequest', () => {
  it('renova uma vez diante do 401, guarda o par novo e repete', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    meAccepts('novo')
    routes['/auth/refresh'] = () => ({ status: 200, body: { accessToken: 'novo', refreshToken: 'r2', expiresIn: 3600 } })

    await expect(apiRequest('/admin/me')).resolves.toEqual({ id: 'u1' })

    expect(refreshCalls()).toEqual([{ path: '/auth/refresh', auth: null, body: { refreshToken: 'r1' } }])
    expect(getSession()).toEqual({ accessToken: 'novo', refreshToken: 'r2' })
  })

  it('várias recusas ao mesmo tempo esperam a mesma renovação', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    meAccepts('novo')
    routes['/auth/refresh'] = () => ({ status: 200, body: { accessToken: 'novo', refreshToken: 'r2' } })

    await Promise.all([apiRequest('/admin/me'), apiRequest('/admin/me'), apiRequest('/admin/me')])

    expect(refreshCalls()).toHaveLength(1)
  })

  it('não renova quando outra aba já renovou: repete com o par guardado', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    routes['/admin/me'] = (_body, auth) => {
      if (auth === 'Bearer velho') {
        // Enquanto esta requisição voava, outra aba renovou.
        saveSession({ accessToken: 'da-outra-aba', refreshToken: 'r2' })
        return { status: 401 }
      }
      return auth === 'Bearer da-outra-aba' ? { status: 200, body: { id: 'u1' } } : { status: 401 }
    }
    routes['/auth/refresh'] = () => ({ status: 401 })

    await expect(apiRequest('/admin/me')).resolves.toEqual({ id: 'u1' })
    expect(refreshCalls()).toHaveLength(0)
  })

  it('refresh recusado encerra a sessão', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    meAccepts('novo')
    routes['/auth/refresh'] = () => ({ status: 401, body: { message: 'Sessao inválida.' } })

    await expect(apiRequest('/admin/me')).rejects.toMatchObject({ status: 401, code: 'SESSION_EXPIRED' })
    expect(getSession()).toBeNull()
  })

  it('falha de rede na renovação mantém a sessão', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    meAccepts('novo')
    routes['/auth/refresh'] = () => 'network'

    await expect(apiRequest('/admin/me')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
    expect(getSession()).toEqual({ accessToken: 'velho', refreshToken: 'r1' })
  })

  it('saiu da conta durante a renovação: o par novo não fica guardado e é revogado', async () => {
    saveSession({ accessToken: 'velho', refreshToken: 'r1' })
    meAccepts('novo')
    routes['/auth/refresh'] = () => {
      clearSession()
      return { status: 200, body: { accessToken: 'novo', refreshToken: 'r2' } }
    }
    routes['/auth/logout'] = () => ({ status: 204 })

    await expect(apiRequest('/admin/me')).rejects.toBeInstanceOf(ApiError)
    expect(getSession()).toBeNull()
    await vi.waitFor(() =>
      expect(calls.find((c) => c.path === '/auth/logout')?.body).toEqual({ refreshToken: 'r2' }),
    )
  })

  it('devolve o código e a mensagem da API no erro', async () => {
    saveSession({ accessToken: 'a', refreshToken: 'r' })
    routes['/admin/me'] = () => ({
      status: 403,
      body: { statusCode: 403, code: 'PLATFORM_ADMIN_REQUIRED', message: 'Esta conta não tem acesso ao Pauta Admin.' },
    })

    await expect(apiRequest('/admin/me')).rejects.toMatchObject({
      status: 403,
      code: 'PLATFORM_ADMIN_REQUIRED',
      message: 'Esta conta não tem acesso ao Pauta Admin.',
    })
    expect(getSession()).not.toBeNull()
  })
})
