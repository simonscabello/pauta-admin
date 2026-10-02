import { useQuery } from '@tanstack/react-query'
import { queryClient } from '../../app/queryClient'
import { apiRequest } from '../../lib/api'
import { clearSession, getSession, saveSession, useSession, type Session } from '../../lib/session'

/// `GET /admin/me`: só o que a casca do admin mostra.
export interface AdminMe {
  id: string
  name: string
  email: string
}

export const adminMeKey = ['admin', 'me'] as const

/// Entra pelo `/auth/login` do app — não há login próprio do admin. Se a
/// conta é administradora, quem responde é o `/admin/me`, logo em seguida.
export async function login(email: string, password: string): Promise<void> {
  const session = await apiRequest<Session>(
    '/auth/login',
    { method: 'POST', body: JSON.stringify({ email, password }) },
    { auth: false },
  )
  // O que estava em cache era de outra conta (ou de conta nenhuma).
  queryClient.clear()
  saveSession({ accessToken: session.accessToken, refreshToken: session.refreshToken })
}

/// Sai na hora, nesta aba e nas outras, e revoga o refresh no servidor sem
/// esperar: falha de rede não segura a saída.
export function logout(): void {
  const session = getSession()
  clearSession()
  queryClient.clear()
  if (session) {
    void apiRequest(
      '/auth/logout',
      { method: 'POST', body: JSON.stringify({ refreshToken: session.refreshToken }) },
      { auth: false },
    ).catch(() => undefined)
  }
}

export function useAdminMe() {
  const session = useSession()
  return useQuery({
    queryKey: adminMeKey,
    queryFn: () => apiRequest<AdminMe>('/admin/me'),
    enabled: session !== null,
    staleTime: 5 * 60_000,
    retry: false,
  })
}
