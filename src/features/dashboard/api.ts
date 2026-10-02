import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'

export interface TeamCount {
  total: number
  /// Quantas dessas equipes foram criadas dentro da janela.
  createdInWindow: number
}

/// `GET /admin/overview`. A regra de cada número está no
/// `AdminOverviewService` da API; a tela não soma nada.
export interface AdminOverview {
  generatedAt: string
  timezone: string
  /// Datas civis (`AAAA-MM-DD`), inclusivas. `to` é ontem.
  window: { days: number; from: string; to: string }
  totals: {
    teams: number
    users: number
    memberships: { total: number; withAccount: number; withoutAccount: number }
    usersWithoutTeam: number
  }
  recent: {
    teamsCreated: number
    usersCreated: number
    publishedSchedules: number
    teamsWithPublishedSchedule: number
  }
  teamsWithUpcomingPublished: number
  teamsWithWhatsApp: number
  teamsCreatedByMonth: { month: string; count: number; partial: boolean }[]
  attention: {
    noSchedules: TeamCount
    onlyDrafts: TeamCount
    noRecentPublished: TeamCount
    noUpcomingSchedule: TeamCount
  }
}

export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin', 'overview'],
    queryFn: () => apiRequest<AdminOverview>('/admin/overview'),
  })
}
