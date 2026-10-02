import { X } from 'lucide-react'
import { useSearchParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { SelectField } from '../../components/SelectField'
import { parseChoice } from '../../lib/params'
import { ActivityList } from './ActivityList'
import { ACTIVITY_LABEL, ACTIVITY_TYPES, type ActivityType } from './api'

const ALL = 'all'
const TYPE_OPTIONS = [
  { value: ALL, label: 'Todos os tipos' },
  ...ACTIVITY_TYPES.map((type) => ({ value: type, label: ACTIVITY_LABEL[type] })),
] as const

/// O que aconteceu no produto, do mais recente para o mais antigo. Filtros na
/// URL: `?type=`, e `?teamId=`/`?userId=`, que chegam pelos links do detalhe
/// da equipe e do usuário.
export function ActivityPage() {
  const [params, setParams] = useSearchParams()
  const type = parseChoice(params.get('type'), ACTIVITY_TYPES)
  const teamId = params.get('teamId') ?? undefined
  const userId = params.get('userId') ?? undefined

  function update(key: string, value: string | undefined) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )
  }

  return (
    <>
      <PageHeader title="Atividade" description="O que aconteceu no Pauta, do mais recente para o mais antigo." />

      <div className="flex flex-wrap items-center gap-2">
        <SelectField<ActivityType | typeof ALL>
          label="Tipo de atividade"
          value={type ?? ALL}
          options={TYPE_OPTIONS}
          onChange={(value) => update('type', value === ALL ? undefined : value)}
        />
        {teamId && <ScopeChip label="Só esta equipe" onClear={() => update('teamId', undefined)} />}
        {userId && <ScopeChip label="Só esta pessoa" onClear={() => update('userId', undefined)} />}
      </div>

      <div className="mt-4">
        <ActivityList filters={{ type, teamId, userId }} />
      </div>

      <p className="mt-6 max-w-2xl text-xs text-muted">
        Montada a partir das datas que o banco já guarda. Não aparecem: escalas excluídas (o histórico vai junto),
        saídas de equipe antes de 02/10/2026, publicações antes de 01/09/2026 ou com data estimada, edições de
        escala e logins.
      </p>
    </>
  )
}

function ScopeChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex h-10 items-center gap-1 rounded-lg border border-line bg-surface pr-1 pl-3 text-sm text-ink">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Remover filtro: ${label}`}
        className="grid size-8 place-items-center rounded-md text-muted hover:text-ink"
      >
        <X aria-hidden className="size-4" />
      </button>
    </span>
  )
}
