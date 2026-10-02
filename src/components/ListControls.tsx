import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { formatNumber } from '../lib/format'

/// Busca e paginação das listas do admin (equipes, usuários): o filtro e a
/// página moram na URL, e estas peças só escrevem nela.

const SEARCH_DELAY_MS = 300

/// O que a paginação precisa de uma resposta paginada da API.
export interface PageData {
  items: unknown[]
  total: number
  page: number
  limit: number
}

/// A caixa de busca escreve na URL depois de uma pausa na digitação. O texto
/// digitado é dela; quando a URL muda por fora (voltar do navegador), ela
/// acompanha.
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  label: string
}) {
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
        placeholder={placeholder}
        aria-label={label}
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

export function Pagination({ data, onPage }: { data: PageData; onPage: (page: number) => void }) {
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

