import { Link } from 'react-router'
import { PageHeader } from '../components/PageHeader'

export function NotFoundPage() {
  return (
    <>
      <PageHeader title="Página não encontrada" description="Este endereço não existe no Pauta Admin." />
      <Link to="/" className="text-sm font-medium text-brand hover:text-brand-hover">
        Voltar ao Dashboard
      </Link>
    </>
  )
}
