import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { formatDate, formatNumber } from '../../lib/format'
import { useAdminTeams, type AdminTeamsPage } from './api'
import { ErrorState, Notice } from '../../components/Feedback'

const SEARCH_DELAY_MS = 300

/// `?page=` que não é um inteiro a partir de 1 vale a primeira página.
function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

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

/// A caixa de busca escreve na URL depois de uma pausa na digitação. O texto
/// digitado é dela; quando a URL muda por fora (voltar do navegador), ela
/// acompanha.
function SearchField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [draft, setDraft] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const timer = useRef<number | undefined>(undefined)

  // A URL recebe o texto sem espaço nas pontas; o que está sendo digitado
  // não pode perder o espaço entre duas palavras por causa disso.
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== draft.trim()) setDraft(value)
  }

  useEffect(() => () => window.clearTimeout(timer.current), [])

  function update(next: string, delay = SEARCH_DELAY_MS) {
    setDraft(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => onChange(next.trim()), delay)
  }

  return (
    <div className="relative max-w-sm">
      <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={draft}
        onChange={(event) => update(event.target.value)}
        placeholder="Buscar pelo nome"
        aria-label="Buscar equipe pelo nome"
        className="h-10 w-full rounded-lg border border-line bg-surface pr-10 pl-9 text-sm text-ink placeholder:text-muted focus:border-brand focus:outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {draft && (
        <button
          type="button"
          onClick={() => update('', 0)}
          aria-label="Limpar busca"
          className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:text-ink"
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
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

function Pagination({ data, onPage }: { data: AdminTeamsPage; onPage: (page: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit))
  const first = (data.page - 1) * data.limit + 1
  const last = first + data.items.length - 1

  return (
    <nav aria-label="Paginação" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted">
      <p>
        {formatNumber(first)}–{formatNumber(last)} de {formatNumber(data.total)}
      </p>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <PageButton label="Página anterior" disabled={data.page <= 1} onClick={() => onPage(data.page - 1)}>
            <ChevronLeft aria-hidden className="size-4" />
          </PageButton>
          <span className="px-2 tabular-nums">
            Página {data.page} de {totalPages}
          </span>
          <PageButton label="Próxima página" disabled={data.page >= totalPages} onClick={() => onPage(data.page + 1)}>
            <ChevronRight aria-hidden className="size-4" />
          </PageButton>
        </div>
      )}
    </nav>
  )
}

function PageButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-ink hover:bg-page disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
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
