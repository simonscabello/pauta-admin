import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: string
  description?: string
  /// Link de volta, nas telas de detalhe.
  back?: ReactNode
  /// Linha de fatos abaixo do título (datas, configuração), nas telas de
  /// detalhe.
  meta?: ReactNode
}

export function PageHeader({ title, description, back, meta }: PageHeaderProps) {
  return (
    <header className="mb-8">
      {/* React 19 leva o <title> para o <head>: a aba diz em que tela se está. */}
      <title>{`${title} · Pauta Admin`}</title>
      {back && <div className="mb-3">{back}</div>}
      <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {meta && <div className="mt-2">{meta}</div>}
    </header>
  )
}
