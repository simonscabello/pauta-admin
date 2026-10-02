import { CalendarClock, MessageCircle } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { BackLink } from '../../components/BackLink'
import { PageHeader } from '../../components/PageHeader'
import { Panel, Section } from '../../components/Section'
import { StatTile } from '../../components/StatTile'
import { ApiError } from '../../lib/api'
import {
  WEEKDAYS,
  formatDate,
  formatMinutes,
  formatNumber,
  formatElapsed,
  formatScheduleDate,
} from '../../lib/format'
import { ActivityList } from '../activity/ActivityList'
import { useAdminTeam, type AdminScheduleRow, type AdminTeamDetail, type MembershipRole } from './api'
import { ErrorState, Notice } from '../../components/Feedback'

const ROLE_LABEL: Record<MembershipRole, string> = {
  OWNER: 'Dono',
  LEADER: 'Líder',
  MEMBER: 'Integrante',
}

/// Página de inspeção: como esta equipe usa o Pauta. Só leitura, e só os
/// números que o banco responde de verdade (ver `AdminService.teamDetail`).
export function TeamDetailPage() {
  const { teamId = '' } = useParams()
  const location = useLocation()
  // A busca e a página da lista de onde se veio; F5 aqui mantém, porque o
  // `state` fica no histórico do navegador.
  const listSearch = (location.state as { listSearch?: string } | null)?.listSearch ?? ''
  const back = <BackLink to={`/equipes${listSearch}`}>Equipes</BackLink>
  const query = useAdminTeam(teamId)

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Equipe" back={back} />
        <DetailSkeleton />
      </>
    )
  }

  if (query.isError) {
    const error = query.error
    // 400 é id que nem tem forma de UUID: para quem lê, é o mesmo "não existe".
    if (error instanceof ApiError && (error.status === 404 || error.status === 400)) {
      return (
        <>
          <PageHeader title="Equipe não encontrada" back={back} />
          <Notice title="Esta equipe não existe">
            Ela pode ter sido excluída.{' '}
            <Link to={`/equipes${listSearch}`} className="font-medium text-brand hover:text-brand-hover">
              Voltar à lista
            </Link>
          </Notice>
        </>
      )
    }
    return (
      <>
        <PageHeader title="Equipe" back={back} />
        <ErrorState
          title="Não foi possível carregar a equipe"
          message={error.message}
          onRetry={() => void query.refetch()}
        />
      </>
    )
  }

  return <TeamDetail data={query.data} back={back} />
}

function TeamDetail({ data, back }: { data: AdminTeamDetail; back: ReactNode }) {
  const { team, members, schedules, repertoire, suggestions } = data
  const tz = team.timezone
  const days = data.recentWindowDays
  const upcomingTotal = schedules.published.upcoming + schedules.drafts.upcoming

  return (
    <>
      <PageHeader
        title={team.name}
        back={back}
        meta={
          <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            <Meta label="Criada em">{formatDate(team.createdAt, tz)}</Meta>
            {schedules.firstStartsAt && (
              <Meta label="Primeira escala">{formatDate(schedules.firstStartsAt, tz)}</Meta>
            )}
            <Meta label="Última alteração em escala">
              {schedules.lastChangeAt ? (
                `${formatDate(schedules.lastChangeAt, tz)} (${formatElapsed(schedules.lastChangeAt)})`
              ) : (
                'nenhuma registrada'
              )}
            </Meta>
          </dl>
        }
      />

      <section aria-label="Resumo" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Integrantes" value={members.total} hint={`${formatNumber(members.withAccount)} com conta`} />
        <StatTile
          label={`Escalas publicadas · ${days} dias`}
          value={schedules.publishedRecent}
          hint={`${formatNumber(schedules.published.past)} já realizadas no total`}
        />
        <StatTile
          label="Próximas escalas"
          value={upcomingTotal}
          hint={
            schedules.drafts.upcoming > 0
              ? `${formatNumber(schedules.drafts.upcoming)} em rascunho`
              : 'nenhuma em rascunho'
          }
        />
        <StatTile
          label="Músicas no repertório"
          value={repertoire.active}
          hint={`${formatNumber(repertoire.playedRecent)} cantadas em ${days} dias`}
        />
      </section>

      <Section title="Escalas">
        <div className="grid gap-4 lg:grid-cols-2">
          <ScheduleList title="Próximas" rows={schedules.upcoming} total={upcomingTotal} tz={tz} empty="Nenhuma escala marcada." />
          <ScheduleList
            title="Recentes"
            rows={schedules.recent}
            total={schedules.published.past + schedules.drafts.past}
            tz={tz}
            empty="Nenhuma escala realizada."
          />
        </div>
        {schedules.drafts.past > 0 && (
          <p className="mt-3 text-sm text-muted">
            {schedules.drafts.past === 1
              ? '1 escala em rascunho de uma data que já passou.'
              : `${formatNumber(schedules.drafts.past)} escalas em rascunho de datas que já passaram.`}
          </p>
        )}
      </Section>

      <Section title="Equipe">
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Liderança">
            {data.leadership.length === 0 ? (
              <p className="text-sm text-muted">Ninguém na liderança.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {data.leadership.map((leader) => (
                  <li key={leader.membershipId} className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 truncate text-ink">{leader.displayName}</span>
                    <span className="shrink-0 text-muted">
                      {ROLE_LABEL[leader.role]}
                      {!leader.hasAccount && ' · sem conta'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Composição">
            <Counts
              rows={[
                ['Dono', members.byRole.OWNER],
                ['Líderes', members.byRole.LEADER],
                ['Demais integrantes', members.byRole.MEMBER],
                ['Com conta', members.withAccount],
                ['Cadastrados sem conta', members.withoutAccount],
                ['De fora da equipe', members.guests],
              ]}
            />
          </Panel>

          <Panel title="Funções no cadastro">
            {members.byPosition.length === 0 ? (
              <p className="text-sm text-muted">Nenhuma função ativa.</p>
            ) : (
              <Counts rows={members.byPosition.map((p) => [p.name, p.memberCount])} />
            )}
          </Panel>
        </div>
      </Section>

      <Section title="Repertório e sugestões">
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel title="Repertório">
            <Counts
              rows={[
                ['Ativas', repertoire.active],
                ['Em aprendizado', repertoire.learning],
                [`Cantadas nos últimos ${days} dias`, repertoire.playedRecent],
                ['Arquivadas', repertoire.archived],
              ]}
            />
          </Panel>
          <Panel title="Sugestões da equipe">
            <Counts
              rows={[
                ['Pendentes', suggestions.pending],
                ['Aceitas', suggestions.accepted],
                ['Recusadas', suggestions.declined],
              ]}
            />
          </Panel>
          <Panel title="Configuração">
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex gap-2">
                <CalendarClock aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <p className="text-ink">Grade de cultos</p>
                  <p className="text-muted">{gridSummary(data.serviceGrid)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <MessageCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
                <div>
                  <p className="text-ink">Grupo do WhatsApp</p>
                  <p className="text-muted">
                    {data.whatsAppLinkedAt
                      ? `Vinculado em ${formatDate(data.whatsAppLinkedAt, tz)}`
                      : 'Não vinculado'}
                  </p>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </Section>

      <Section title="Atividade recente">
        <ActivityList filters={{ teamId: team.id }} pageSize={10} more={false} />
        <p className="mt-3 text-sm">
          <Link to={`/atividade?teamId=${team.id}`} className="font-medium text-brand hover:text-brand-hover">
            Ver toda a atividade desta equipe
          </Link>
        </p>
      </Section>
    </>
  )
}

/// "Domingo 09:00 e 19:00 · Quinta 20:00".
function gridSummary(grid: AdminTeamDetail['serviceGrid']): string {
  if (grid.length === 0) return 'Nenhum culto na grade'
  const byDay = new Map<number, string[]>()
  for (const slot of grid) {
    byDay.set(slot.weekday, [...(byDay.get(slot.weekday) ?? []), formatMinutes(slot.startMinutes)])
  }
  return [...byDay].map(([day, times]) => `${WEEKDAYS[day]} ${times.join(' e ')}`).join(' · ')
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex gap-1.5">
      <dt>{label}:</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

function Counts({ rows }: { rows: [string, number][] }) {
  return (
    <dl className="flex flex-col gap-2 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 truncate text-muted">{label}</dt>
          <dd className={`shrink-0 tabular-nums ${value === 0 ? 'text-muted' : 'font-medium text-ink'}`}>
            {formatNumber(value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function ScheduleList({
  title,
  rows,
  total,
  tz,
  empty,
}: {
  title: string
  rows: AdminScheduleRow[]
  total: number
  tz: string
  empty: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface">
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        {total > rows.length && (
          <span className="text-xs text-muted">
            {formatNumber(rows.length)} de {formatNumber(total)}
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="divide-y divide-line">
          {rows.map((row) => (
            <li key={row.id} className="px-4 py-3">
              <div className="flex items-baseline justify-between gap-3">
                <p className="min-w-0 truncate text-sm text-ink">
                  {formatScheduleDate(row.startsAt, tz)}
                  {row.title && <span className="text-muted"> · {row.title}</span>}
                </p>
                {row.status === 'DRAFT' && (
                  <span className="shrink-0 rounded-md bg-page px-1.5 py-0.5 text-xs font-medium text-muted">
                    Rascunho
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs text-muted">{scheduleSummary(row)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/// "2 cultos · 7 pessoas · 5 músicas", ou "repertório na hora".
function scheduleSummary(row: AdminScheduleRow): string {
  const plural = (n: number, one: string, many: string) => `${formatNumber(n)} ${n === 1 ? one : many}`
  const parts = [
    ...(row.serviceCount > 1 ? [plural(row.serviceCount, 'culto', 'cultos')] : []),
    row.peopleCount === 0 ? 'ninguém escalado' : plural(row.peopleCount, 'pessoa', 'pessoas'),
    row.songCount > 0
      ? plural(row.songCount, 'música', 'músicas')
      : row.repertoireMode === 'ON_THE_FLY'
        ? 'músicas na hora'
        : 'sem músicas',
  ]
  return parts.join(' · ')
}

function DetailSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Carregando a equipe…</span>
      <div className="h-4 w-72 animate-pulse rounded bg-line" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-line/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-56 animate-pulse rounded-xl bg-line/60" />
        <div className="h-56 animate-pulse rounded-xl bg-line/60" />
      </div>
    </div>
  )
}
