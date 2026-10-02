import { Link, useLocation, useSearchParams } from 'react-router'
import { Pagination, SearchField } from '../../components/ListControls'
import { parsePage } from '../../lib/params'
import { PageHeader } from '../../components/PageHeader'
import { formatDate, formatNumber } from '../../lib/format'
import { useAdminTeams, type AdminTeamsPage } from './api'
import { ErrorState, Notice } from '../../components/Feedback'

export function TeamsPage() {
  const [params, setParams] = useSearchParams()
  const search = params.get('search')?.trim() ?? ''
  const page = parsePage(params.get('page'))
  const query = useAdminTeams({ search, page })

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
      <PageHeader title="Equipes" description="Todas as equipes cadastradas no Pauta." />

      <SearchField
        value={search}
        placeholder="Buscar pelo nome"
        label="Buscar equipe pelo nome"
        onChange={(value) =>
          // Busca nova volta à primeira página, e não empilha histórico a
          // cada letra.
          setParams(
            (current) => {
              const updated = new URLSearchParams(current)
              updated.delete('page')
              if (value) updated.set('search', value)
              else updated.delete('search')
              return updated
            },
            { replace: true },
          )
        }
      />

      <div className="mt-4">
        {query.isPending ? (
          <TableSkeleton />
        ) : query.isError ? (
          <ErrorState
            title="Não foi possível carregar as equipes"
            message={query.error.message}
            onRetry={() => void query.refetch()}
          />
        ) : query.data.items.length === 0 ? (
          <EmptyState data={query.data} search={search} onFirstPage={() => goToPage(1)} />
        ) : (
          <>
            <TeamsTable data={query.data} stale={query.isPlaceholderData} />
            <Pagination data={query.data} onPage={goToPage} />
          </>
        )}
      </div>
    </>
  )
}

function TeamsTable({ data, stale }: { data: AdminTeamsPage; stale: boolean }) {
  // O detalhe volta para esta mesma busca e página (ver `TeamDetailPage`).
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
            <th scope="col" className="px-4 py-3 text-right font-medium">Integrantes</th>
            <th scope="col" className="px-4 py-3 text-right font-medium whitespace-nowrap">Criada em</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {data.items.map((team) => (
            // A linha inteira é o toque; o link no nome é o que o teclado e o
            // leitor de tela encontram (`after:` estica a área dele).
            <tr key={team.id} className="relative hover:bg-page">
              <td className="px-4 py-3 font-medium text-ink">
                <Link
                  to={`/equipes/${team.id}`}
                  state={{ listSearch: search }}
                  className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-brand"
                >
                  {team.name}
                </Link>
              </td>
              <td className="px-4 py-3 text-right text-ink tabular-nums">{formatNumber(team.memberCount)}</td>
              <td className="px-4 py-3 text-right whitespace-nowrap text-muted">{formatDate(team.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TableSkeleton() {
  return (
    <div className="rounded-xl border border-line bg-surface" role="status">
      <span className="sr-only">Carregando equipes…</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b border-line px-4 py-3.5 last:border-0">
          <div className="h-3.5 flex-1 animate-pulse rounded bg-line" />
          <div className="h-3.5 w-10 animate-pulse rounded bg-line" />
          <div className="h-3.5 w-24 animate-pulse rounded bg-line" />
        </div>
      ))}
    </div>
  )
}

function EmptyState({
  data,
  search,
  onFirstPage,
}: {
  data: AdminTeamsPage
  search: string
  onFirstPage: () => void
}) {
  // Página além da última (URL antiga, ou equipes apagadas desde então).
  if (data.total > 0) {
    return (
      <Notice title="Esta página não existe">
        <button type="button" onClick={onFirstPage} className="font-medium text-brand hover:text-brand-hover">
          Voltar à primeira página
        </button>
      </Notice>
    )
  }
  return search ? (
    <Notice title="Nenhuma equipe encontrada">Nenhum nome de equipe tem “{search}”.</Notice>
  ) : (
    <Notice title="Nenhuma equipe cadastrada">As equipes aparecem aqui quando forem criadas no app.</Notice>
  )
}
