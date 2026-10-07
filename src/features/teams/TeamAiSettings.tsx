import { Sparkles } from 'lucide-react'
import { Panel, Section } from '../../components/Section'
import { formatDateTime, formatNumber } from '../../lib/format'
import { useTeamAiSettings, useUpdateTeamAiSettings, type AiSettingsChange, type AdminTeamAiSettings } from './api'

/// Os copilotos de IA da equipe: o interruptor geral, um por copiloto e o uso
/// dos últimos 30 dias. Desligar vale na próxima requisição da equipe -- a API
/// lê a configuração a cada chamada.
export function TeamAiSettings({ teamId, timeZone }: { teamId: string; timeZone: string }) {
  const query = useTeamAiSettings(teamId)
  const mutation = useUpdateTeamAiSettings(teamId)

  if (query.isPending) {
    return (
      <Section title="Recursos de IA">
        <div className="h-40 animate-pulse rounded-xl border border-line bg-surface" />
      </Section>
    )
  }
  if (query.isError) {
    return (
      <Section title="Recursos de IA">
        <p className="text-sm text-danger">Não foi possível carregar a configuração de IA: {query.error.message}</p>
      </Section>
    )
  }

  const settings = query.data
  const change = (value: AiSettingsChange) => mutation.mutate(value)
  const usage = settings.usage30d

  return (
    <Section title="Recursos de IA">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Disponível para a liderança">
          <div className="flex flex-col gap-3">
            <Toggle
              label="IA habilitada"
              hint="Interruptor geral. Desligado, nenhum copiloto aparece para a equipe."
              checked={settings.aiEnabled}
              disabled={mutation.isPending}
              onChange={(aiEnabled) => change({ aiEnabled })}
            />
            <Toggle
              label="Copiloto de Escalas"
              hint="Monta todas as escalas do mês de uma vez, como rascunho."
              checked={settings.scheduleCopilot}
              disabled={mutation.isPending || !settings.aiEnabled}
              onChange={(scheduleCopilot) => change({ scheduleCopilot })}
            />
            <Toggle
              label="Copiloto de Repertório"
              hint={
                settings.providerConfigured
                  ? 'Sugere músicas do repertório da equipe a partir do tema da mensagem.'
                  : 'Sugere músicas a partir do tema. O servidor está sem provedor de IA: mesmo ligado, não funciona.'
              }
              checked={settings.repertoireCopilot}
              disabled={mutation.isPending || !settings.aiEnabled}
              onChange={(repertoireCopilot) => change({ repertoireCopilot })}
            />
            {mutation.isError && (
              <p role="alert" className="text-sm text-danger">
                Não foi possível salvar: {mutation.error.message}
              </p>
            )}
            {settings.updatedAt && (
              <p className="text-xs text-muted">Alterado em {formatDateTime(settings.updatedAt, timeZone)}.</p>
            )}
          </div>
        </Panel>

        <Panel title="Uso nos últimos 30 dias">
          <dl className="flex flex-col gap-2 text-sm">
            <Row label="Meses montados com o copiloto" value={formatNumber(usage.scheduleSessions)} />
            <Row label="… salvos como rascunho" value={formatNumber(usage.scheduleCommitted)} />
            <Row label="Sugestões de repertório" value={formatNumber(usage.repertoireSessions)} />
            <Row label="Chamadas ao provedor de IA" value={formatNumber(usage.aiCalls)} />
            <Row
              label="Tokens (entrada / saída)"
              value={`${formatNumber(usage.inputTokens)} / ${formatNumber(usage.outputTokens)}`}
            />
            <Row label="Custo estimado" value={costLabel(usage)} />
          </dl>
        </Panel>
      </div>
    </Section>
  )
}

function costLabel(usage: AdminTeamAiSettings['usage30d']): string {
  if (usage.aiCalls === 0) return '—'
  if (usage.costMicroUsd === null) return 'sem preço configurado'
  return `US$ ${(usage.costMicroUsd / 1_000_000).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="shrink-0 font-medium text-ink tabular-nums">{value}</dd>
    </div>
  )
}

function Toggle({
  label,
  hint,
  checked,
  disabled,
  onChange,
}: {
  label: string
  hint: string
  checked: boolean
  disabled: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <label className={`flex items-start gap-3 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        role="switch"
        className="mt-0.5 size-4 shrink-0 accent-brand"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-sm font-medium text-ink">
          {label === 'IA habilitada' && <Sparkles aria-hidden className="size-4 text-brand" />}
          {label}
        </span>
        <span className="block text-sm text-muted">{hint}</span>
      </span>
    </label>
  )
}
