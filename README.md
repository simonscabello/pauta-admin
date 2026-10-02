# Pauta Admin

Backoffice interno do Pauta: acompanhamento de equipes, usuários e uso do
produto. Uso exclusivo da equipe do Pauta — não é divulgado nem indexado
(`robots: noindex`).

- **Somente leitura**, por enquanto. Nada aqui grava dados.
- **Não acessa o banco.** Toda informação vem da `pauta-api` (NestJS), pelas
  rotas `/api/v1/admin/*`. Tela que ainda não tem rota diz "Ainda não
  disponível" e não mostra número nenhum.
- **Entra só quem é administrador da plataforma** (`users.is_platform_admin`,
  mudado só por SQL), com a conta do Pauta: o login é o `/api/v1/auth` do app.
- O contexto do produto e as decisões ficam no `AGENTS.md` do repositório
  `pauta` (a pasta de cima).

## Stack

React 19 · TypeScript · Vite · React Router · TanStack Query · Tailwind CSS 4
· Lucide React. Testes com Vitest + jsdom.

Sem Redux/Zustand (o estado do servidor é do TanStack Query, filtros vão na
URL), sem Axios (o `fetch` basta) e sem biblioteca de componentes. Dependência
nova só com necessidade concreta.

## Rodar

Node 22+.

```bash
npm install
npm run dev
```

Abre em `http://localhost:5174` (porta fixa: a 5173 fica livre para outros
projetos Vite) e fala com a API local, `http://localhost:3000`. Outra API vai
por `VITE_API_BASE_URL` (ver `.env.example`). No Claude Code,
`.claude/launch.json` › `pauta-admin` sobe o mesmo servidor.

| Comando | O quê |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run typecheck` | `tsc -b` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (a renovação da sessão) |
| `npm run build` | typecheck + build de produção em `dist/`; **exige** `VITE_API_BASE_URL` |
| `npm run preview` | serve o `dist/` |

## Estrutura

```
src/
  main.tsx              providers (TanStack Query) e o router
  app/                  casca: rotas, layout, barra lateral, 404, erro de rota
  lib/                  sessão (localStorage), cliente HTTP com a renovação,
                        formatação
  components/           peças usadas por mais de uma feature
  features/<area>/      uma pasta por área: páginas e, quando houver, o api.ts
                        com os tipos da resposta e os hooks useQuery
  styles/index.css      Tailwind e os tokens de cor (claro e escuro)
  assets/fonts/         Plus Jakarta Sans, a mesma do app, servida daqui
```

Uma peça vai para `components/` quando a segunda feature precisar dela — não
antes.

## Rotas

| Caminho | Tela |
|---|---|
| `/entrar` | Login (a única rota sem sessão) |
| `/` | Dashboard (`GET /admin/overview`) |
| `/equipes` | Equipes — `?search=` e `?page=` na URL |
| `/equipes/:teamId` | Detalhes da equipe (`GET /admin/teams/:id`) |
| `/usuarios` | Usuários |
| `/usuarios/:userId` | Detalhes do usuário |
| `/atividade` | Atividade recente |
| qualquer outro | Página não encontrada |

As rotas usam o histórico do navegador (sem `#`): a hospedagem precisa servir
o `index.html` para todo caminho desconhecido (*SPA fallback*), senão um F5 em
`/equipes/<id>` dá 404.

## Visual

Sóbrio: superfícies neutras e o índigo do Pauta (`#4F46E5`) só no que se toca
e na navegação ativa. As cores são tokens em `src/styles/index.css`
(`bg-page`, `bg-surface`, `border-line`, `text-ink`, `text-muted`,
`text-brand`…); o tema escuro troca os valores ali, por
`prefers-color-scheme`, e as telas não escrevem `dark:`.

## Sessão

A do app, sem login próprio: `POST /auth/login`, e em seguida
`GET /admin/me` diz se a conta entra. Os dois tokens ficam no `localStorage`
(as abas dividem a sessão), e a renovação segue a regra do app: um 401 renova
**uma vez**, e se outra aba já renovou usa o par dela em vez de renovar de
novo. O porquê de cada detalhe está na seção "Pauta Admin" do `AGENTS.md`.

Localmente, `samuel@teste.com` é administrador e `maria@teste.com` não (as
senhas estão no `AGENTS.md`).

## Produção

No ar em **`https://pauta-admin-production.up.railway.app`** (domínio do
Railway; o próprio fica para depois). Serviço `pauta-admin` no projeto
Railway `PAUTA`, **deploy a cada push em `main`**, sem versão nem tag.

- `Dockerfile`: Node 22 faz o `npm ci` e o `npm run build`; a imagem final é
  só o Caddy servindo `dist/` na porta 8080. `railway.toml` aponta para ele.
- **`VITE_API_BASE_URL`** é variável do serviço, lida no build (o Railway a
  passa como build arg): `https://backend-production-b304.up.railway.app`,
  sem barra e sem `/api/v1`. **É pública** — vai no JS —, e por isso nenhum
  segredo entra numa variável `VITE_`. O Caddy lê a mesma variável para a CSP.
- `Caddyfile`: *SPA fallback* (`try_files {path} /index.html`, então F5 em
  `/equipes/<id>` funciona), `/assets/*` em cache longo (nome com hash), a
  casca sem cache, CSP restrita (`script-src 'self'`, `connect-src` só a API,
  `frame-ancestors 'none'`), `X-Robots-Tag: noindex`. Sem source map no build.
- O domínio do admin está no `CORS_ORIGINS` da `pauta-api`. Trocar de domínio
  é trocar lá também.
- A segurança é da API: todas as rotas `/admin/*` passam pelo
  `PlatformAdminGuard`. A página pública só mostra o login.

## Ainda não feito

- Usuários e atividade.
