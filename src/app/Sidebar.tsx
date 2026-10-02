import { NavLink } from 'react-router'
import { navItems } from './navigation'

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1 p-3">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          // Sem `end` no "/", o Dashboard ficaria aceso em todas as rotas.
          end={to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            [
              'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
              isActive
                ? 'bg-brand-soft text-brand'
                : 'text-muted hover:bg-page hover:text-ink',
            ].join(' ')
          }
        >
          <Icon aria-hidden className="size-4.5 shrink-0" />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
