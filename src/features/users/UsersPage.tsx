import { Link, useLocation, useSearchParams } from 'react-router'
import { ErrorState, Notice } from '../../components/Feedback'
import { Pagination, SearchField } from '../../components/ListControls'
import { PageHeader } from '../../components/PageHeader'
import { SelectField } from '../../components/SelectField'
import { formatDate, formatElapsed } from '../../lib/format'
import { parseChoice, parsePage } from '../../lib/params'
import {
  USER_FILTERS,
  USER_SORTS,
  useAdminUsers,
  type AdminUser,
  type AdminUsersPage,
  type UserFilter,
  type UserSort,
} from './api'

const ALL = 'all'
const FILTER_OPTIONS = [
  { value: ALL, label: 'Todas as contas' },
  { value: 'temporary_password', label: 'Com senha temporária' },
  { value: 'no_team', label: 'Sem equipe' },
  { value: 'onboarding_pending', label: 'Primeiro acesso pendente' },
] as const satisfies readonly { value: UserFilter | typeof ALL; label: string }[]

const SORT_OPTIONS = [
  { value: 'created', label: 'Mais novas primeiro' },
  { value: 'last_seen', label: 'Acesso mais recente' },
] as const satisfies readonly { value: UserSort; label: string }[]

export function UsersPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search')?.trim() ?? ''
  const page = parsePage(params.get('page'))
  const filter = parseChoice(params.get('filter'), USER_FILTERS)
  const sort = parseChoice(params.get('sort'), USER_SORTS) ?? 'created'
  const query = useAdminUsers({ search, page, filter, sort: sort === 'created' ? undefined : sort })

  /// Trocar busca, recorte ou ordem volta à primeira página.
  function update(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        next.delete('page')
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  function goToPage(next: number) {
    setParams((current) => {
      const updated = new URLSearchParams(current)
      if (next <= 1) updated.delete('page')
      else updated.set('page', String(next))
      return updated
    })
  }

  return (
    <>
      <PageHeader title="Usuários" description="Todas as contas criadas no Pauta." />

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-full sm:w-80">
          <SearchField
            value={search}
            onChange={(value) => update('search', value || undefined)}
            placeholder="Buscar pelo nome ou e-mail"
            label="Buscar usuário pelo nome ou e-mail"
          />
        </div>
        <SelectField
          label="Recorte"
          value={filter ?? ALL}
          options={FILTER_OPTIONS}
          onChange={(value) => update('filter', value === ALL ? undefined : value)}
        />
        <SelectField
          label="Ordem"
          value={sort}
          options={SORT_OPTIONS}
          onChange={(value) => update('sort', value === 'created' ? undefined : value)}
        />
      </div>

      <div className="mt-4">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <ErrorState
            title="Não foi possível carregar os usuários"
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : query.data.items.length === 0 ? (
          <EmptyState data={query.data} filtered={Boolean(search || filter)} onFirstPage={() => goToPage(1)} />
        ) : (
          <>
            <UsersTable data={query.data} stale={query.isPlaceholderData} />
            <Pagination data={query.data} onPage={goToPage} />
          </>
        )}
      </div>

      <p className="mt-6 max-w-2xl text-xs text-muted">
        Último acesso é o último login ou renovação de sessão, registrado desde 02/10/2026. Quem usa o app sem
        fechar pode ter usado até cerca de uma hora depois.
      </p>
    </>
  )
}

function UsersTable({ data, stale }: { data: AdminUsersPage; stale: boolean }) {
  // O detalhe volta para esta mesma busca e página.
  const { search } = useLocation()
  return (
    <div
      className={`overflow-x-auto rounded-xl border border-line bg-surface transition-opacity ${stale ? 'opacity-60' : ''}`}
      aria-busy={stale}
    >
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs font-medium text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">Nome</th>
            <th scope="col" className="px-4 py-3 font-medium">Equipes</th>
            <th scope="col" className="px-4 py-3 text-right font-medium whitespace-nowrap">Último acesso</th>
            <th scope="col" className="px-4 py-3 text-right font-medium whitespace-nowrap">Conta criada</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.items.map((user) => (
            <tr key={user.id} className="relative hover:bg-page">
              <td className="px-4 py-3">
                <Link
                  to={`/usuarios/${user.id}`}
                  state={{ listSearch: search }}
                  className="font-medium text-ink after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand"
                >
                  {user.name}
                </Link>
                <Badges user={user} />
                <p className="text-xs text-muted">{user.email}</p>
              </td>
              <td className="px-4 py-3 text-muted">{teamsSummary(user)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-muted">
                {user.lastSeenAt ? formatElapsed(user.lastSeenAt) : '—'}
              </td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-muted">{formatDate(user.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Badges({ user }: { user: AdminUser }) {
  return (
    <>
      {user.mustChangePassword && <Badge>Senha temporária</Badge>}
      {user.isPlatformAdmin && <Badge>Admin</Badge>}
    </>
  )
}

function Badge({ children }: { children: string }) {
  return (
    <span className="ml-2 rounded-md bg-page px-1.5 py-0.5 align-middle text-xs font-medium text-muted">{children}</span>
  )
}

/// "Ministério de Louvor, Coral +1", ou "Nenhuma".
function teamsSummary(user: AdminUser): string {
  if (user.teams.length === 0) return 'Nenhuma'
  const shown = user.teams.slice(0, 2).map((team) => team.name)
  const rest = user.teams.length - shown.length
  return rest > 0 ? `${shown.join(', ')} +${rest}` : shown.join(', ')
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface" role="status">
      <span className="sr-only">Carregando usuários…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
          <div className="h-3.5 flex-1 animate-pulse rounded bg-line" />
          <div className="h-3.5 w-32 animate-pulse rounded bg-line" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  data,
  filtered,
  onFirstPage,
}: {
  data: AdminUsersPage
  filtered: boolean
  onFirstPage: () => void
}) {
  if (data.total > 0) {
    return (
      <Notice title="Esta página não existe">
        <button type="button" onClick={onFirstPage} className="font-medium text-brand hover:text-brand-hover">
          Voltar à primeira página
        </button>
      </Notice>
    )
  }
  return filtered ? (
    <Notice title="Nenhuma conta encontrada">Nenhuma conta corresponde à busca e ao recorte.</Notice>
  ) : (
    <Notice title="Nenhuma conta criada">As contas aparecem aqui quando alguém se cadastrar no app.</Notice>
  )
}
