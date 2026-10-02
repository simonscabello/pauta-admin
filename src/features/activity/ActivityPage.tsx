import { NotAvailableYet } from '../../components/NotAvailableYet'
import { PageHeader } from '../../components/PageHeader'

export function ActivityPage() {
  return (
    <>
      <PageHeader title="Atividade" description="O que aconteceu recentemente no Pauta." />
      <NotAvailableYet>A atividade recente aparece aqui quando a API tiver a rota.</NotAvailableYet>
    </>
  )
}
