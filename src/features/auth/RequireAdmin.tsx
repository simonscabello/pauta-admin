import { LoaderCircle } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router'
import { ApiError } from '../../lib/api'
import { useSession } from '../../lib/session'
import { AccessIssue } from './AccessIssue'
import { useAdminMe } from './api'

/// A porta do painel: sem sessão vai para o login; com sessão, quem decide é
/// o `GET /admin/me`. Um 401 dele já limpou a sessão (`apiRequest`), e a
/// próxima renderização cai no primeiro caso.
export function RequireAdmin() {
  const session = useSession()
  const location = useLocation()
  const me = useAdminMe()

  if (!session) {
    return <Navigate to="/entrar" replace state={{ from: location }} />
  }

  if (me.isPending) {
    return (
      <div className="grid min-h-dvh place-items-center" role="status">
        <LoaderCircle aria-hidden className="size-6 animate-spin text-muted" />
        <span className="sr-only">Conferindo o acesso…</span>
      </div>
    )
  }

  if (me.isError) {
    const error = me.error
    if (error instanceof ApiError && error.code === 'PLATFORM_ADMIN_REQUIRED') {
      return <AccessIssue kind="denied" />
    }
    if (error instanceof ApiError && error.code === 'PASSWORD_CHANGE_REQUIRED') {
      return <AccessIssue kind="password" />
    }
    return <AccessIssue kind="unreachable" onRetry={() => void me.refetch()} />
  }

  return <Outlet />
}
