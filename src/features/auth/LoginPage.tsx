import { useMutation } from '@tanstack/react-query'
import { CircleAlert, LoaderCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import { Navigate, useLocation, useNavigate, type Location } from 'react-router'
import { ApiError } from '../../lib/api'
import { useSession } from '../../lib/session'
import { login } from './api'
import { AuthShell } from './AuthShell'

const inputClass =
  'mt-1 block h-10 w-full rounded-lg border border-line bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none'

export function LoginPage() {
  const session = useSession()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location } | null)?.from
  const destination = from ? `${from.pathname}${from.search}` : '/'

  const mutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => login(email, password),
    onSuccess: () => navigate(destination, { replace: true }),
  })

  // Já há sessão (nesta aba ou em outra): a porta do painel decide o resto.
  if (session && !mutation.isPending) {
    return <Navigate to={destination} replace />
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    mutation.mutate({
      email: String(form.get('email') ?? '').trim(),
      password: String(form.get('password') ?? ''),
    })
  }

  const error = mutation.error
  const message =
    error instanceof ApiError ? error.message : error ? 'Não foi possível entrar. Tente de novo.' : null

  return (
    <AuthShell title="Entrar">
      <h1 className="text-lg font-semibold text-ink">Entrar</h1>
      <p className="mt-1 text-sm text-muted">Use a sua conta do Pauta.</p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
        {message && (
          <div role="alert" className="flex gap-2 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
            {message}
          </div>
        )}
        <label className="text-sm font-medium text-ink">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="username"
            autoFocus
            className={inputClass}
          />
        </label>
        <label className="text-sm font-medium text-ink">
          Senha
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="mt-2 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover disabled:opacity-70"
        >
          {mutation.isPending && <LoaderCircle aria-hidden className="size-4 animate-spin" />}
          Entrar
        </button>
      </form>
    </AuthShell>
  )
}
