/// O que a tela vai mostrar, enquanto a API ainda não tem a rota. Diz o que
/// vem, e não inventa número nenhum.
export function NotAvailableYet({ children }: { children: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface px-6 py-10 text-center">
      <p className="text-sm font-medium text-ink">Ainda não disponível</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">{children}</p>
    </div>
  )
}
