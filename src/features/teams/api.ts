import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'

/// Uma linha de `GET /admin/teams`. Só metadados: a API não devolve
/// repertório, escalas nem nada de integrante além da contagem.
export interface AdminTeam {
  id: string
  name: string
  /// Vínculos ativos, com e sem conta, sem os de fora da equipe.
  memberCount: number
  createdAt: string
}

export interface AdminTeamsPage {
  items: AdminTeam[]
  total: number
  page: number
  limit: number
}

export const TEAMS_PAGE_SIZE = 20

export function useAdminTeams({ search, page }: { search: string; page: number }) {
  return useQuery({
    queryKey: ['admin', 'teams', { search, page }],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(TEAMS_PAGE_SIZE) })
      if (search) params.set('search', search)
      return apiRequest<AdminTeamsPage>(`/admin/teams?${params}`)
    },
    // Trocar de página ou de busca mantém a tabela anterior à vista até a
    // nova chegar, em vez de piscar o carregamento.
    placeholderData: keepPreviousData,
  })
}

export type ScheduleStatus = 'DRAFT' | 'PUBLISHED'
export type MembershipRole = 'OWNER' | 'LEADER' | 'MEMBER'

export interface AdminScheduleRow {
  id: string
  startsAt: string
  title: string | null
  status: ScheduleStatus
  repertoireMode: 'PLANNED' | 'ON_THE_FLY'
  serviceCount: number
  /// Pessoas distintas escaladas.
  peopleCount: number
  /// Linhas de música somadas entre os cultos.
  songCount: number
}

/// `GET /admin/teams/:teamId`. A regra de cada número está no
/// `AdminService.teamDetail` da API; a tela não refaz conta nenhuma.
export interface AdminTeamDetail {
  team: { id: string; name: string; timezone: string; createdAt: string }
  leadership: { membershipId: string; displayName: string; role: MembershipRole; hasAccount: boolean }[]
  members: {
    total: number
    withAccount: number
    withoutAccount: number
    byRole: Record<MembershipRole, number>
    guests: number
    byPosition: { positionId: string; name: string; category: string; memberCount: number }[]
  }
  schedules: {
    published: { past: number; upcoming: number }
    drafts: { past: number; upcoming: number }
    publishedRecent: number
    firstStartsAt: string | null
    lastChangeAt: string | null
    upcoming: AdminScheduleRow[]
    recent: AdminScheduleRow[]
  }
  repertoire: { active: number; archived: number; learning: number; playedRecent: number }
  suggestions: { pending: number; accepted: number; declined: number }
  serviceGrid: { label: string; weekday: number; startMinutes: number }[]
  whatsAppLinkedAt: string | null
  recentWindowDays: number
}

export function useAdminTeam(teamId: string) {
  return useQuery({
    queryKey: ['admin', 'teams', teamId],
    queryFn: () => apiRequest<AdminTeamDetail>(`/admin/teams/${encodeURIComponent(teamId)}`),
  })
}

/// `GET|PATCH /admin/teams/:teamId/ai-settings`: os copilotos de IA da
/// equipe. A única escrita do admin.
export interface AdminTeamAiSettings {
  aiEnabled: boolean
  scheduleCopilot: boolean
  repertoireCopilot: boolean
  updatedAt: string | null
  /// O servidor tem provedor de IA configurado. Sem ele, o Copiloto de
  /// Repertório não funciona mesmo ligado; o de Escalas não depende dele.
  providerConfigured: boolean
  usage30d: {
    scheduleSessions: number
    scheduleCommitted: number
    repertoireSessions: number
    aiCalls: number
    inputTokens: number
    outputTokens: number
    /// Nulo quando nenhuma chamada tinha preço configurado.
    costMicroUsd: number | null
  }
}

export type AiSettingsChange = Partial<Pick<AdminTeamAiSettings, 'aiEnabled' | 'scheduleCopilot' | 'repertoireCopilot'>>

const aiSettingsKey = (teamId: string) => ['admin', 'teams', teamId, 'ai-settings']

export function useTeamAiSettings(teamId: string) {
  return useQuery({
    queryKey: aiSettingsKey(teamId),
    queryFn: () => apiRequest<AdminTeamAiSettings>(`/admin/teams/${encodeURIComponent(teamId)}/ai-settings`),
  })
}

export function useUpdateTeamAiSettings(teamId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (change: AiSettingsChange) =>
      apiRequest<AdminTeamAiSettings>(`/admin/teams/${encodeURIComponent(teamId)}/ai-settings`, {
        method: 'PATCH',
        body: JSON.stringify(change),
      }),
    onSuccess: (data) => client.setQueryData(aiSettingsKey(teamId), data),
  })
}
