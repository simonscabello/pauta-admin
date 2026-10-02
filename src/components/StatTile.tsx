import { ChevronRight } from 'lucide-react'
import { Link } from 'react-router'
import { formatNumber } from '../lib/format'

interface StatTileProps {
  /// O que o número é, com a janela quando houver ("— 30 dias").
  label: string
  value: number
  /// Uma linha de contexto ("7 com conta"), nunca um percentual solto.
  hint?: string
  /// Tela que mostra o que o número conta.
  to?: string
}

export function StatTile({ label, value, hint, to }: StatTileProps) {
  const body = (
    <>
      <p className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
        {label}
        {to && <ChevronRight aria-hidden className="size-3.5 shrink-0" />}
      </p>
      <p className="mt-1 text-2xl font-semibold text-ink tabular-nums">{formatNumber(value)}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </>
  )
  const box = 'block rounded-xl border border-line bg-surface px-4 py-3'
  return to ? (
    <Link to={to} className={`${box} transition-colors hover:border-brand/40 hover:bg-page`}>
      {body}
    </Link>
  ) : (
    <div className={box}>{body}</div>
  )
}
