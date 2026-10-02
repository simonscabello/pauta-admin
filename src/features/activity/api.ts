import { useInfiniteQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'

/// Os tipos da linha do tempo, na ordem do filtro da tela.
export const ACTIVITY_TYPES = [
  'USER_CREATED',
  'TEAM_CREATED',
  'MEMBER_JOINED',
  'MEMBER_REMOVED',
  'SCHEDULE_PUBLISHED',
  'SUGGESTION_CREATED',
  'SUGGESTION_ACCEPTED',
  'SUGGESTION_DECLINED',
  'TEAM_EVENT_CREATED',
  'INVITE_CREATED',
  'WHATSAPP_LINKED',
] as const
export type ActivityType = (typeof ACTIVITY_TYPES)[number]

export const ACTIVITY_LABEL: Record<ActivityType, string> = {
  USER_CREATED: 'Conta criada',
  TEAM_CREATED: 'Equipe criada',
  MEMBER_JOINED: 'Entrou na equipe',
  MEMBER_REMOVED: 'Saiu da equipe',
  SCHEDULE_PUBLISHED: 'Escala publicada',
  SUGGESTION_CREATED: 'Sugestão de música enviada',
  SUGGESTION_ACCEPTED: 'Sugestão aceita',
  SUGGESTION_DECLINED: 'Sugestão recusada',
  TEAM_EVENT_CREATED: 'Evento marcado',
  INVITE_CREATED: 'Convite gerado',
  WHATSAPP_LINKED: 'Grupo do WhatsApp vinculado',
}

/// Uma linha de `GET /admin/activity`, montada pela API a partir de datas que
/// já existem nas tabelas (ver `AdminActivityService`).
export interface ActivityItem {
  id: string
  type: ActivityType
  at: string
  team: { id: string; name: string } | null
  userId: string | null
  person: string | null
  scheduleStartsAt: string | null
}

interface ActivityPage {
  items: ActivityItem[]
  nextCursor: string | null
}

export interface ActivityFilters {
  type?: ActivityType
  teamId?: string
  userId?: string
}

export function useActivity(filters: ActivityFilters, pageSize = 50) {
  return useInfiniteQuery({
    queryKey: ['admin', 'activity', filters, pageSize],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => {
      const query = new URLSearchParams({ limit: String(pageSize) })
      if (filters.type) query.set('types', filters.type)
      if (filters.teamId) query.set('teamId', filters.teamId)
      if (filters.userId) query.set('userId', filters.userId)
      if (pageParam) query.set('cursor', pageParam)
      return apiRequest<ActivityPage>(`/admin/activity?${query}`)
    },
    getNextPageParam: (last) => last.nextCursor,
  })
}
