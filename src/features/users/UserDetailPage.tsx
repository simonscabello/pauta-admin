import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { ErrorState, Notice } from '../../components/Feedback'
import { PageHeader } from '../../components/PageHeader'
import { Panel, Section } from '../../components/Section'
import { StatTile } from '../../components/StatTile'
import { ApiError } from '../../lib/api'
import { formatDate, formatElapsed, formatNumber } from '../../lib/format'
import { ActivityList } from '../activity/ActivityList'
import type { MembershipRole } from '../teams/api'
import { useAdminUser, type AdminUserDetail } from './api'

const ROLE_LABEL: Record<MembershipRole, string> = {
  OWNER: 'Dono',
  LEADER: 'Líder',
  MEMBER: 'Integrante',
}

/// O tour do primeiro acesso no app (`OnboardingFlows.member`).
const FIRST_ACCESS_FLOW = 'member_onboarding'

/// Página de inspeção de uma conta. Só leitura, e só o que a API devolve (ver
/// `AdminUsersService.detail`): nada de senha, telefone, aniversário ou foto.
export function UserDetailPage() {
  const { userId = '' } = useParams()
  const location = useLocation()
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch ?? ''
  const back = <BackLink to={`/usuarios${listSearch}`}>Usuários</BackLink>
  const query = useAdminUser(userId)

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Usuário" back={back} />
        <div role="status" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <span className="sr-only">Carregando o usuário…</span>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-line/60" />
          ))}
        </div>
      </>
    )
  }

  if (query.isError) {
    const error = query.error
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return (
        <>
          <PageHeader title="Usuário não encontrado" back={back} />
          <Notice title="Esta conta não existe">
            Ela pode ter sido excluída.{' '}
            <Link to={`/usuarios${listSearch}`} className="font-medium text-brand hover:text-brand-hover">
              Voltar à lista
            </Link>
          </Notice>
        </>
      )
    }
    return (
      <>
        <PageHeader title="Usuário" back={back} />
        <ErrorState
          title="Não foi possível carregar o usuário"
          message={error.message}
          onRetry={() => void query.refetch()}
        />
      </>
    )
  }

  return <UserDetail data={query.data} back={back} />
}

function UserDetail({ data, back }: { data: AdminUserDetail; back: ReactNode }) {
  const { user, memberships, schedules, suggestions } = data
  const active = memberships.filter((m) => m.status === 'ACTIVE')
  const suggestionTotal = suggestions.pending + suggestions.accepted + suggestions.declined

  return (
    <>
      <PageHeader
        title={user.name}
        back={back}
        meta={
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <Meta label="E-mail">{user.email}</Meta>
            <Meta label="Conta criada">{formatDate(user.createdAt)}</Meta>
            <Meta label="Último acesso">
              {user.lastSeenAt
                ? `${formatDate(user.lastSeenAt)} (${formatElapsed(user.lastSeenAt)})`
                : 'nenhum desde 02/10/2026'}
            </Meta>
          </dl>
        }
      />

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          label="Equipes"
          value={active.length}
          hint={
            memberships.length > active.length
              ? `saiu de ${plural(memberships.length - active.length, 'equipe', 'equipes')}`
              : 'nenhuma saída'
          }
        />
        <StatTile
          label="Escalas servidas"
          value={schedules.servedPast}
          hint={schedules.lastServedAt ? `a última em ${formatDate(schedules.lastServedAt)}` : 'nenhuma ainda'}
        />
        <StatTile label="Próximas escalas" value={schedules.upcoming} hint="publicadas, de hoje em diante" />
        <StatTile
          label="Sugestões de música"
          value={suggestionTotal}
          hint={`${plural(suggestions.accepted, 'aceita', 'aceitas')} · ${plural(suggestions.pending, 'pendente', 'pendentes')}`}
        />
      </section>

      <Section title="Equipes">
        {memberships.length === 0 ? (
          <Notice title="Sem equipe">Esta conta não entrou em nenhuma equipe.</Notice>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line text-xs font-medium text-muted">
                <tr>
                  <th scope="col" className="px-4 py-3 font-medium">Equipe</th>
                  <th scope="col" className="px-4 py-3 font-medium">Nome na equipe</th>
                  <th scope="col" className="px-4 py-3 font-medium">Papel</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Entrou</th>
                  <th scope="col" className="px-4 py-3 text-right font-medium">Saiu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {memberships.map((m) => (
                  <tr key={m.membershipId} className={m.status === 'REMOVED' ? 'text-muted' : ''}>
                    <td className="px-4 py-3">
                      <Link to={`/equipes/${m.team.id}`} className="font-medium text-ink hover:text-brand">
                        {m.team.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{m.displayName}</td>
                    <td className="px-4 py-3">{ROLE_LABEL[m.role]}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">{m.joinedAt ? formatDate(m.joinedAt) : '—'}</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {m.status === 'ACTIVE' ? '—' : m.removedAt ? formatDate(m.removedAt) : 'data não registrada'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Section title="Conta">
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Situação">
            <Facts
              rows={[
                ['Senha', user.mustChangePassword ? 'temporária, ainda não trocada' : 'definida pela pessoa'],
                ['Primeiro acesso', firstAccess(data)],
                ['Foto', user.profile.hasAvatar ? 'tem' : 'não tem'],
                ['Data de nascimento', user.profile.hasBirthDate ? 'preenchida' : 'não preenchida'],
                ['Avisos no celular', user.pushEnabled ? 'ligados na conta' : 'desligados na conta'],
                ...(user.isPlatformAdmin ? ([['Pauta Admin', 'administrador']] as [string, string][]) : []),
              ]}
            />
          </Panel>

          <Panel title="Aparelhos (push)">
            {data.devices.length === 0 ? (
              <p className="text-sm text-muted">Nenhum aparelho registrado. Só o app Android registra.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {data.devices.map((device, index) => (
                  <li key={index} className="flex items-baseline justify-between gap-3">
                    <span className="text-ink capitalize">{device.platform}</span>
                    <span className="text-muted">visto {formatElapsed(device.lastSeenAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Assistente de IA">
            {data.assistantKeys.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma chave criada.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {data.assistantKeys.map((key, index) => (
                  <li key={index}>
                    <p className="text-ink">
                      {key.name}
                      {key.canWrite && <span className="text-muted"> · cria escalas</span>}
                    </p>
                    <p className="text-xs text-muted">{keyStatus(key)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </Section>

      <Section title="Atividade recente">
        <ActivityList filters={{ userId: user.id }} pageSize={10} more={false} />
        <p className="mt-3 text-sm">
          <Link to={`/atividade?userId=${user.id}`} className="font-medium text-brand hover:text-brand-hover">
            Ver toda a atividade desta pessoa
          </Link>
        </p>
      </Section>
    </>
  )
}

function plural(n: number, one: string, many: string): string {
  return `${formatNumber(n)} ${n === 1 ? one : many}`
}

function firstAccess(data: AdminUserDetail): string {
  const answer = data.onboardings.find((o) => o.flow === FIRST_ACCESS_FLOW)
  if (!answer) return 'sem resposta'
  return `${answer.status === 'COMPLETED' ? 'concluído' : 'pulado'} em ${formatDate(answer.at)}`
}

function keyStatus(key: AdminUserDetail['assistantKeys'][number]): string {
  if (key.revoked) return 'revogada'
  if (new Date(key.expiresAt).getTime() < Date.now()) return `vencida em ${formatDate(key.expiresAt)}`
  const used = key.lastUsedAt ? `usada ${formatElapsed(key.lastUsedAt)}` : 'nunca usada'
  return `${used} · vale até ${formatDate(key.expiresAt)}`
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt>{label}:</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

function Facts({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <dt className="shrink-0 text-muted">{label}</dt>
          <dd className="text-right text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}
