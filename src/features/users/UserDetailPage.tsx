import { useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { NotAvailableYet } from '../../components/NotAvailableYet'
import { PageHeader } from '../../components/PageHeader'

export function UserDetailPage() {
  const { userId } = useParams()

  return (
    <>
      <PageHeader
        title="Usuário"
        description={userId}
        back={<BackLink to="/usuarios">Usuários</BackLink>}
      />
      <NotAvailableYet>Os dados deste usuário aparecem aqui quando a API tiver a rota.</NotAvailableYet>
    </>
  )
}
