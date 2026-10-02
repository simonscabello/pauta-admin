/// Leitura dos parâmetros da URL das listas.

/// `?page=` que não é um inteiro a partir de 1 vale a primeira página.
export function parsePage(value: string | null): number {
  const page = Number(value)
  return Number.isInteger(page) && page >= 1 ? page : 1
}

/// Um valor de `?filtro=` que a tela conhece, ou `undefined`.
export function parseChoice<T extends string>(value: string | null, choices: readonly T[]): T | undefined {
  return choices.find((choice) => choice === value)
}
