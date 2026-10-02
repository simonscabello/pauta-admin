/// Endereço da pauta-api, sem barra no fim e sem `/api/v1`. O build de
/// produção exige a variável (ver `vite.config.ts`); em desenvolvimento,
/// ausente, vale a API local.
export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:3000'
).replace(/\/+$/, '')
