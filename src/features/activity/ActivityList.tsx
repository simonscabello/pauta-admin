import {
  CalendarCheck,
  CalendarPlus,
  Link2,
  MessageCircle,
  Music,
  ThumbsDown,
  ThumbsUp,
  UserMinus,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ErrorState, Notice } from '../../components/Feedback'
import { formatDateTime, formatScheduleDate } from '../../lib/format'
import { ACTIVITY_LABEL, useActivity, type ActivityFilters, type ActivityItem, type ActivityType } from './api'

const ICON: Record<ActivityType, LucideIcon> = {
  USER_CREATED: UserPlus,
  TEAM_CREATED: Users,
  MEMBER_JOINED: UserPlus,
  MEMBER_REMOVED: UserMinus,
  SCHEDULE_PUBLISHED: CalendarCheck,
  SUGGESTION_CREATED: Music,
  SUGGESTION_ACCEPTED: ThumbsUp,
  SUGGESTION_DECLINED: ThumbsDown,
  TEAM_EVENT_CREATED: CalendarPlus,
  INVITE_CREATED: Link2,
  WHATSAPP_LINKED: MessageCircle,
}

/// A linha do tempo, do mais recente para o mais antigo, com "Carregar mais".
/// `pageSize` pequeno e `more: false` fazem dela um resumo (detalhe do
/// usuário).
export function ActivityList({
  filters,
  pageSize = 50,
  more = true,
  empty = 'Nada registrado.',
}: {
  filters: ActivityFilters
  pageSize?: number
  more?: boolean
  empty?: string
}) {
  const query = useActivity(filters, pageSize)

  if (query.isPending) {
    return (
      <div className="rounded-xl border border-line bg-surface" role="status">
        <span className="sr-only">Carregando a atividade…</span>
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex items-center gap-3 border-b border-line px-4 py-3.5 last:border-0">
            <div className="size-4 animate-pulse rounded bg-line" />
            <div className="h-3.5 flex-1 animate-pulse rounded bg-line" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-line" />
          </div>
        ))}
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title="Não foi possível carregar a atividade"
        message={query.error.message}
        onRetry={() => void query.refetch()}
      />
    )
  }

  const items = query.data.pages.flatMap((page) => page.items)
  if (items.length === 0) return <Notice title={empty}>A atividade aparece aqui quando acontecer.</Notice>

  return (
    <>
      <ol className="divide-y divide-line rounded-xl border border-line bg-surface">
        {items.map((item) => (
          <ActivityRow key={item.id} item={item} />
        ))}
      </ol>
      {more && query.hasNextPage && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => void query.fetchNextPage()}
            disabled={query.isFetchingNextPage}
            className="h-9 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-page disabled:opacity-60"
          >
            {query.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </>
  )
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = ICON[item.type]
  return (
    <li className="flex gap-3 px-4 py-3">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <p className="text-sm font-medium text-ink">{ACTIVITY_LABEL[item.type]}</p>
          <time dateTime={item.at} className="text-xs text-muted tabular-nums">
            {formatDateTime(item.at)}
          </time>
        </div>
        <p className="mt-0.5 text-sm text-muted">{describe(item)}</p>
      </div>
    </li>
  )
}

const linkClass = 'text-ink hover:text-brand'

function PersonLink({ item }: { item: ActivityItem }) {
  if (!item.person) return null
  return item.userId ? (
    <Link to={`/usuarios/${item.userId}`} className={linkClass}>
      {item.person}
    </Link>
  ) : (
    <span className="text-ink">{item.person}</span>
  )
}

function TeamLink({ item }: { item: ActivityItem }) {
  if (!item.team) return null
  return (
    <Link to={`/equipes/${item.team.id}`} className={linkClass}>
      {item.team.name}
    </Link>
  )
}

/// A segunda linha: quem e onde, com links para o detalhe.
function describe(item: ActivityItem): ReactNode {
  const person = <PersonLink item={item} />
  const team = <TeamLink item={item} />
  const by = item.person ? <> · por {person}</> : null

  switch (item.type) {
    case 'USER_CREATED':
      return person
    case 'MEMBER_JOINED':
    case 'MEMBER_REMOVED':
    case 'SUGGESTION_CREATED':
      return item.person ? (
        <>
          {person} em {team}
        </>
      ) : (
        team
      )
    case 'SCHEDULE_PUBLISHED':
      return (
        <>
          {team}
          {item.scheduleStartsAt && <> · culto de {formatScheduleDate(item.scheduleStartsAt)}</>}
        </>
      )
    case 'TEAM_CREATED':
    case 'TEAM_EVENT_CREATED':
    case 'INVITE_CREATED':
      return (
        <>
          {team}
          {by}
        </>
      )
    case 'SUGGESTION_ACCEPTED':
    case 'SUGGESTION_DECLINED':
    case 'WHATSAPP_LINKED':
      return team
  }
}
