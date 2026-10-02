import { QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../lib/api'

export const queryClient: QueryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      // A flag foi tirada no meio da sessão: qualquer consulta recusada
      // reconfere o acesso, e a casca troca para "sem acesso".
      if (
        error instanceof ApiError &&
        error.code === 'PLATFORM_ADMIN_REQUIRED' &&
        query.queryKey[1] !== 'me'
      ) {
        void queryClient.invalidateQueries({ queryKey: ['admin', 'me'] })
      }
    },
  }),
  defaultOptions: {
    queries: {
      // Números de acompanhamento não mudam de um segundo para o outro; meio
      // minuto evita refazer a mesma consulta a cada troca de tela.
      staleTime: 30_000,
      // Erro do cliente (4xx) não melhora repetindo; falha de rede e 5xx,
      // uma vez.
      retry: (failureCount, error) =>
        failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    },
  },
})
