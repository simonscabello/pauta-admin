import type { ReactNode } from 'react'
import { Brand } from '../../app/Brand'

/// A moldura das telas fora do painel: login, sem acesso, carregando.
export function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center px-4 py-12">
      <title>{`${title} · Pauta Admin`}</title>
      <div className="w-full max-w-sm">
        <div className="mb-6 flex justify-center">
          <Brand />
        </div>
        <div className="rounded-xl border border-line bg-surface p-6 shadow-sm">{children}</div>
      </div>
    </main>
  )
}
