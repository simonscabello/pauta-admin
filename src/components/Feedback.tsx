import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

/// Estados de tela: erro com "tentar de novo" e aviso neutro
/// (vazio, não encontrado).
export function ErrorState({ title, message, onRetry }: { title: string; message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-surface px-6 py-10 text-center">
      <CircleAlert aria-hidden className="mx-auto size-5 text-danger" />
      <p className="mt-2 text-sm font-medium text-ink">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 h-9 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-page"
      >
        Tentar de novo
      </button>
    </div>
  )
}

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</div>
    </div>
  )
}
