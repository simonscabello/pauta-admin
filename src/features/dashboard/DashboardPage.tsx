import { ErrorState, Notice } from '../../components/Feedback'
import { PageHeader } from '../../components/PageHeader'
import { Panel, Section } from '../../components/Section'
import { StatTile } from '../../components/StatTile'
import { formatDateKey, formatMonthKey, formatNumber } from '../../lib/format'
import { useAdminOverview, type AdminOverview, type TeamCount } from './api'

const DESCRIPTION = 'Tamanho, adoção e uso recente do Pauta.'

/// O dashboard: poucos números, cada um com a regra escrita no rótulo. Nada
/// aqui é "ativo" ou "parado" — são contagens de escalas e de cadastro.
export function DashboardPage() {
  const query = useAdminOverview()

  if (query.isPending) {
    return (
      <>
        <PageHeader title="Dashboard" description={DESCRIPTION} />
        <DashboardSkeleton />
      </>
    )
  }

  if (query.isError) {
    return (
      <>
        <PageHeader title="Dashboard" description={DESCRIPTION} />
        <ErrorState
          title="Não foi possível carregar o dashboard"
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      </>
    )
  }

  return <Dashboard data={query.data} />
}

function Dashboard({ data }: { data: AdminOverview }) {
  const { totals, recent, window, attention } = data
  const days = window.days
  const windowLabel = `${formatDateKey(window.from)} a ${formatDateKey(window.to, true)}`
  const ofTeams = (n: number) => `${formatNumber(n)} de ${formatNumber(totals.teams)}`

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={DESCRIPTION}
        meta={
          <p className="text-sm text-muted">
            Janela de {days} dias: <span className="text-ink">{windowLabel}</span> (até ontem, no
            horário de Brasília). As escalas de hoje contam como próximas.
          </p>
        }
      />

      <section aria-label="Tamanho do produto" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          label="Equipes"
          value={totals.teams}
          hint={`${formatNumber(recent.teamsCreated)} criadas nos últimos ${days} dias`}
          to="/equipes"
        />
        <StatTile
          label="Contas"
          value={totals.users}
          hint={`${formatNumber(recent.usersCreated)} criadas nos últimos ${days} dias`}
        />
        <StatTile
          label="Integrantes (vínculos ativos)"
          value={totals.memberships.total}
          hint="quem está em duas equipes conta duas vezes"
        />
      </section>

      {totals.teams === 0 ? (
        <div className="mt-10">
          <Notice title="Nenhuma equipe ainda">
            Os números de uso aparecem quando a primeira equipe for criada no app.
          </Notice>
        </div>
      ) : (
        <>
          <Section title="Adoção e uso recente">
            <div className="grid gap-4 lg:grid-cols-2">
              <Panel title={`Escalas — ${days} dias`}>
                <Rows
                  rows={[
                    [`Equipes com escala publicada — ${days} dias`, ofTeams(recent.teamsWithPublishedSchedule)],
                    [`Escalas publicadas com culto nos últimos ${days} dias`, formatNumber(recent.publishedSchedules)],
                    ['Equipes com escala publicada de hoje em diante', ofTeams(data.teamsWithUpcomingPublished)],
                  ]}
                />
              </Panel>
              <Panel title="Cadastro">
                <Rows
                  rows={[
                    [
                      'Integrantes com conta',
                      `${formatNumber(totals.memberships.withAccount)} de ${formatNumber(totals.memberships.total)}`,
                    ],
                    ['Integrantes cadastrados sem conta', formatNumber(totals.memberships.withoutAccount)],
                    ['Contas sem equipe', formatNumber(totals.usersWithoutTeam)],
                    ['Equipes com grupo do WhatsApp vinculado', ofTeams(data.teamsWithWhatsApp)],
                  ]}
                />
              </Panel>
            </div>
          </Section>

          <Section title="Equipes novas por mês">
            <MonthlyBars months={data.teamsCreatedByMonth} />
          </Section>

          <Section title="Para inspecionar">
            <p className="-mt-1 mb-3 text-sm text-muted">
              Contagens de equipes, sem interpretação. Equipe criada há pouco aparece em quase todas;
              por isso o número delas vem ao lado.
            </p>
            <div className="rounded-xl border border-line bg-surface">
              <ul className="divide-y divide-line">
                <AttentionRow label="Sem nenhuma escala, nem rascunho" count={attention.noSchedules} days={days} />
                <AttentionRow label="Com rascunhos e nenhuma escala publicada" count={attention.onlyDrafts} days={days} />
                <AttentionRow
                  label={`Sem escala publicada nos últimos ${days} dias`}
                  count={attention.noRecentPublished}
                  days={days}
                />
                <AttentionRow
                  label="Sem escala marcada de hoje em diante (nem rascunho)"
                  count={attention.noUpcomingSchedule}
                  days={days}
                />
              </ul>
            </div>
          </Section>
        </>
      )}
    </>
  )
}

/// Barras em CSS: seis números não pedem biblioteca de gráfico. O valor vai
/// escrito em cima de cada barra, e o mês em curso diz que está em curso.
function MonthlyBars({ months }: { months: AdminOverview['teamsCreatedByMonth'] }) {
  const max = Math.max(1, ...months.map((m) => m.count))
  const first = months[0]
  const last = months[months.length - 1]

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <ol
        className="flex h-40 items-end gap-3"
        aria-label={`Equipes criadas por mês, de ${formatMonthKey(first.month, 'long')} a ${formatMonthKey(last.month, 'long')}`}
      >
        {months.map((m) => (
          <li key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
            <span className="text-xs font-medium text-ink tabular-nums">{formatNumber(m.count)}</span>
            <div
              aria-hidden
              className={`w-full max-w-12 rounded-t-md ${m.count > 0 ? 'bg-brand' : 'bg-line'} ${m.partial ? 'opacity-60' : ''}`}
              style={{ height: m.count > 0 ? `${(m.count / max) * 100}%` : '2px' }}
            />
            <span className="sr-only">
              {formatMonthKey(m.month, 'long')}
              {m.partial && ', mês em curso'}
            </span>
          </li>
        ))}
      </ol>
      <div aria-hidden className="mt-2 flex gap-3 text-xs text-muted">
        {months.map((m) => (
          <span key={m.month} className="flex-1 text-center">
            {formatMonthKey(m.month)}
            {m.partial && '*'}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-muted">
        {formatMonthKey(first.month, 'long')} a {formatMonthKey(last.month, 'long')}, pelo mês de
        criação no horário de Brasília. * mês em curso, até hoje.
      </p>
    </div>
  )
}

function AttentionRow({ label, count, days }: { label: string; count: TeamCount; days: number }) {
  return (
    <li className="flex items-baseline justify-between gap-4 px-4 py-3 text-sm">
      <span className="min-w-0 text-ink">{label}</span>
      <span className="shrink-0 text-right">
        <span className={`tabular-nums ${count.total === 0 ? 'text-muted' : 'font-medium text-ink'}`}>
          {formatNumber(count.total)} {count.total === 1 ? 'equipe' : 'equipes'}
        </span>
        {count.createdInWindow > 0 && (
          <span className="block text-xs text-muted">
            {formatNumber(count.createdInWindow)} {count.createdInWindow === 1 ? 'criada' : 'criadas'} nos
            últimos {days} dias
          </span>
        )}
      </span>
    </li>
  )
}

function Rows({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="flex flex-col gap-2.5 text-sm">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-baseline justify-between gap-4">
          <dt className="min-w-0 text-muted">{label}</dt>
          <dd className="shrink-0 font-medium text-ink tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function DashboardSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-6">
      <span className="sr-only">Carregando o dashboard…</span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-line/60" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-40 animate-pulse rounded-xl bg-line/60" />
        <div className="h-40 animate-pulse rounded-xl bg-line/60" />
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-line/60" />
    </div>
  )
}
