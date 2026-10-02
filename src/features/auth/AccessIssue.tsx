import { useNavigate } from 'react-router'
import { sessionEmail, useSession } from '../../lib/session'
import { logout } from './api'
import { AuthShell } from './AuthShell'

type Kind = 'denied' | 'password' | 'unreachable'

const copy: Record<Kind, { title: string; body: string }> = {
  denied: {
    title: 'Você não possui acesso ao Pauta Admin',
    body: 'A conta entrou, mas não é administradora da plataforma.',
  },
  password: {
    title: 'Defina uma nova senha',
    body: 'Esta conta precisa trocar a senha antes de continuar. Faça isso no app do Pauta e entre aqui de novo.',
  },
  unreachable: {
    title: 'Não foi possível conferir o acesso',
    body: 'A API não respondeu. Confira a conexão e tente de novo.',
  },
}

export function AccessIssue({ kind, onRetry }: { kind: Kind; onRetry?: () => void }) {
  const navigate = useNavigate()
  const email = sessionEmail(useSession())
  const { title, body } = copy[kind]

  function switchAccount() {
    logout()
    navigate('/entrar', { replace: true })
  }

  return (
    <AuthShell title={title}>
      <h1 className="text-lg font-semibold text-ink">{title}</h1>
      <p className="mt-2 text-sm text-muted">{body}</p>
      {email && kind !== 'unreachable' && (
        <p className="mt-4 rounded-lg bg-page px-3 py-2 text-sm text-ink">{email}</p>
      )}
      <div className="mt-6 flex flex-col gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="h-10 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
          >
            Tentar de novo
          </button>
        )}
        <button
          type="button"
          onClick={switchAccount}
          className={
            onRetry
              ? 'h-10 rounded-lg px-4 text-sm font-medium text-muted hover:bg-page hover:text-ink'
              : 'h-10 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover'
          }
        >
          {kind === 'unreachable' ? 'Sair' : 'Entrar com outra conta'}
        </button>
      </div>
    </AuthShell>
  )
}
