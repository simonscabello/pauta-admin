import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet, ScrollRestoration } from 'react-router'
import { AccountMenu } from './AccountMenu'
import { Brand } from './Brand'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[15rem_1fr]">
      <aside className="hidden border-r border-line bg-surface md:block">
        <div className="sticky top-0 flex h-dvh flex-col">
          <div className="flex h-14 items-center border-b border-line px-6">
            <Brand />
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
          <AccountMenu />
        </div>
      </aside>

      {/* No celular a barra lateral vira um menu que abre por cima. */}
      <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-surface px-4 md:hidden">
        <Brand />
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="menu-celular"
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          className="grid size-10 place-items-center rounded-lg text-muted hover:bg-page hover:text-ink"
        >
          {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
        </button>
      </header>
      {menuOpen && (
        <div id="menu-celular" className="border-b border-line bg-surface md:hidden">
          <Sidebar onNavigate={() => setMenuOpen(false)} />
          <AccountMenu />
        </div>
      )}

      <main className="min-w-0">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>
      <ScrollRestoration />
    </div>
  )
}
