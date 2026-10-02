import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../lib/api'
import type { MembershipRole } from '../teams/api'

/// Os recortes de `GET /admin/users?filter=`: as contas que costumam travar.
export const USER_FILTERS = ['temporary_password', 'no_team', 'onboarding_pending'] as const
export type UserFilter = (typeof USER_FILTERS)[number]

export const USER_SORTS = ['created', 'last_seen'] as const
export type UserSort = (typeof USER_SORTS)[number]

/// Uma linha de `GET /admin/users`: nome, e-mail e o estado da conta. Senha,
/// telefone, aniversário e gênero a API não devolve.
export interface AdminUser {
  id: string
  name: string
  email: string
  createdAt: string
  /// Último login ou renovação de sessão; nulo para quem não entrou desde
  /// 02/10/2026.
  lastSeenAt: string | null
  mustChangePassword: boolean
  isPlatformAdmin: boolean
  teams: { id: string; name: string; role: MembershipRole }[]
}

export interface AdminUsersPage {
  items: AdminUser[]
  total: number
  page: number
  limit: number
}

export const USERS_PAGE_SIZE = 20

export function useAdminUsers(params: { search: string; page: number; filter?: UserFilter; sort?: UserSort }) {
  return useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => {
      const query = new URLSearchParams({ page: String(params.page), limit: String(USERS_PAGE_SIZE) })
      if (params.search) query.set('search', params.search)
      if (params.filter) query.set('filter', params.filter)
      if (params.sort) query.set('sort', params.sort)
      return apiRequest<AdminUsersPage>(`/admin/users?${query}`)
    },
    placeholderData: keepPreviousData,
  })
}

/// `GET /admin/users/:userId`. A regra de cada número está no
/// `AdminUsersService.detail` da API.
export interface AdminUserDetail {
  user: {
    id: string
    name: string
    email: string
    createdAt: string
    lastSeenAt: string | null
    mustChangePassword: boolean
    isPlatformAdmin: boolean
    pushEnabled: boolean
    profile: { hasAvatar: boolean; hasBirthDate: boolean }
  }
  memberships: {
    membershipId: string
    team: { id: string; name: string }
    displayName: string
    role: MembershipRole
    status: 'ACTIVE' | 'REMOVED'
    joinedAt: string | null
    removedAt: string | null
  }[]
  schedules: { servedPast: number; upcoming: number; lastServedAt: string | null }
  onboardings: { flow: string; version: number; status: 'COMPLETED' | 'SKIPPED'; at: string }[]
  devices: { platform: string; createdAt: string; lastSeenAt: string }[]
  assistantKeys: {
    name: string
    createdAt: string
    expiresAt: string
    lastUsedAt: string | null
    revoked: boolean
    canWrite: boolean
  }[]
  suggestions: { pending: number; accepted: number; declined: number }
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => apiRequest<AdminUserDetail>(`/admin/users/${encodeURIComponent(userId)}`),
  })
}
