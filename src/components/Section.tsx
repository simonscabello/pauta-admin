import type { ReactNode } from 'react'

/// Um bloco da página, com título.
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-base font-semibold text-ink">{title}</h2>
      {children}
    </section>
  )
}

/// Um cartão dentro de uma seção, com rótulo pequeno em caixa alta.
export function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <h3 className="mb-3 text-xs font-medium tracking-wide text-muted uppercase">{title}</h3>
      {children}
    </div>
  )
}
