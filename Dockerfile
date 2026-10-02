# syntax=docker/dockerfile:1
#
# Dois estágios: o Node some na imagem final. O Railway (e o docker run
# local) só vê o Caddy servindo dist/ na $PORT.
#
# VITE_API_BASE_URL é de build, não de runtime: o Vite a escreve no JS. Ela é
# PÚBLICA (vai para o navegador) -- nunca ponha segredo numa variável VITE_.
# Sem barra no fim e sem /api/v1. O Railway passa as variáveis do serviço
# como build args.

FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --no-update-notifier

COPY . .

ARG VITE_API_BASE_URL
RUN test -n "$VITE_API_BASE_URL" \
 || { echo "VITE_API_BASE_URL is required (base URL only, without /api/v1)." >&2; exit 1; }
RUN case "$VITE_API_BASE_URL" in \
      */api/v1|*/api/v1/|*/) \
        echo "VITE_API_BASE_URL must not end with / or /api/v1." >&2; exit 1 ;; \
    esac

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM caddy:2-alpine

COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /usr/share/caddy

# O Caddyfile lê a mesma variável em runtime, para a CSP liberar a API.
EXPOSE 8080
