import { NotAvailableYet } from '../../components/NotAvailableYet'
import { PageHeader } from '../../components/PageHeader'

export function UsersPage() {
  return (
    <>
      <PageHeader title="Usuários" description="Todas as contas criadas no Pauta." />
      <NotAvailableYet>A lista de usuários aparece aqui quando a API tiver a rota.</NotAvailableYet>
    </>
  )
}
