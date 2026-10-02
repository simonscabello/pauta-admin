import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router'
import { logout, useAdminMe } from '../features/auth/api'

/// Quem está no painel e o botão de sair, no pé da barra lateral.
export function AccountMenu() {
  const { data: me } = useAdminMe()
  const navigate = useNavigate()

  return (
    <div className="flex items-center gap-2 border-t border-line p-3">
      <div className="min-w-0 flex-1 px-3">
        <p className="truncate text-sm font-medium text-ink">{me?.name}</p>
        <p className="truncate text-xs text-muted">{me?.email}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/entrar', { replace: true })
        }}
        aria-label="Sair"
        title="Sair"
        className="grid size-10 shrink-0 place-items-center rounded-lg text-muted hover:bg-page hover:text-ink"
      >
        <LogOut aria-hidden className="size-4.5" />
      </button>
    </div>
  )
}
