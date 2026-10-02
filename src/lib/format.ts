// As equipes estão todas em America/Sao_Paulo (o fuso não é configurável na
// API). Quem tem o fuso da equipe na mão o passa; o padrão é esse.
const DEFAULT_ZONE = 'America/Sao_Paulo'

const numberFormat = new Intl.NumberFormat('pt-BR')
const relativeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'always' })

export function formatDate(iso: string, timeZone = DEFAULT_ZONE): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(new Date(iso))
}

/// "2 de out. de 2026 · 14:32": um instante, com a hora.
export function formatDateTime(iso: string, timeZone = DEFAULT_ZONE): string {
  const date = new Date(iso)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone }).format(date)
  return `${formatDate(iso, timeZone)} · ${time}`
}

/// "dom., 1 de nov. · 08:30" — o dia de uma escala, com o horário do culto.
export function formatScheduleDate(iso: string, timeZone = DEFAULT_ZONE): string {
  const date = new Date(iso)
  const day = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
    timeZone,
  }).format(date)
  const time = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone }).format(date)
  return `${day} · ${time}`
}

/// "há 3 dias", "há 2 meses": tempo decorrido, e não dia do calendário (por
/// isso nunca "ontem"). Acompanha a data exata, que é o fato.
export function formatElapsed(iso: string, now = new Date()): string {
  const days = Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000)
  if (days < 1) return 'há menos de um dia'
  if (days < 30) return relativeFormat.format(-days, 'day')
  if (days < 365) return relativeFormat.format(-Math.floor(days / 30), 'month')
  return relativeFormat.format(-Math.floor(days / 365), 'year')
}

export function formatNumber(value: number): string {
  return numberFormat.format(value)
}

/// Minutos desde a meia-noite (`startMinutes` da grade) em "09:00".
export function formatMinutes(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

/// 0 = domingo, a numeração da grade da API.
export const WEEKDAYS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

/// Um dia civil `AAAA-MM-DD` (já no fuso da equipe) em "2 de set.".
export function formatDateKey(key: string, withYear = false): string {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    day: 'numeric',
    month: 'short',
    year: withYear ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day, 12)))
}

/// Um mês `AAAA-MM` em "set." (curto) ou "setembro de 2026" (longo).
export function formatMonthKey(key: string, style: 'short' | 'long' = 'short'): string {
  const [year, month] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('pt-BR', {
    month: style,
    year: style === 'long' ? 'numeric' : undefined,
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, 15)))
}
