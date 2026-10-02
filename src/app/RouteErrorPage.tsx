import { useRouteError } from 'react-router'

/// Erro inesperado ao desenhar uma tela. Fica fora do layout: se o erro veio
/// dele, desenhá-lo de novo repetiria o erro.
export function RouteErrorPage() {
  const error = useRouteError()
  console.error(error)

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <title>Erro · Pauta Admin</title>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Algo deu errado</h1>
      <p className="mt-1 text-sm text-muted">
        A tela não pôde ser carregada. Recarregue a página; se o erro continuar, o
        detalhe está no console do navegador.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 h-10 rounded-lg bg-brand px-4 text-sm font-medium text-on-brand hover:bg-brand-hover"
      >
        Recarregar
      </button>
    </main>
  )
}
