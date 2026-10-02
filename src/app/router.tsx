import { createBrowserRouter } from 'react-router'
import { ActivityPage } from '../features/activity/ActivityPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RequireAdmin } from '../features/auth/RequireAdmin'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { TeamDetailPage } from '../features/teams/TeamDetailPage'
import { TeamsPage } from '../features/teams/TeamsPage'
import { UserDetailPage } from '../features/users/UserDetailPage'
import { UsersPage } from '../features/users/UsersPage'
import { AdminLayout } from './AdminLayout'
import { NotFoundPage } from './NotFoundPage'
import { RouteErrorPage } from './RouteErrorPage'

export const router = createBrowserRouter([
  { path: '/entrar', element: <LoginPage />, errorElement: <RouteErrorPage /> },
  {
    // Tudo o mais, inclusive a 404, só com sessão de administrador.
    element: <RequireAdmin />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'equipes', element: <TeamsPage /> },
          { path: 'equipes/:teamId', element: <TeamDetailPage /> },
          { path: 'usuarios', element: <UsersPage /> },
          { path: 'usuarios/:userId', element: <UserDetailPage /> },
          { path: 'atividade', element: <ActivityPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
])
