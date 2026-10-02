import { Activity, CircleUser, LayoutDashboard, Users, type LucideIcon } from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
}

export const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/equipes', label: 'Equipes', icon: Users },
  { to: '/usuarios', label: 'Usuários', icon: CircleUser },
  { to: '/atividade', label: 'Atividade', icon: Activity },
]
