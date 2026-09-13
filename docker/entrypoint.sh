#!/bin/sh
# Escolhe o serviço pelo env SERVICE: "studio" (padrão) ou "api".
set -eu

case "${SERVICE:-studio}" in
  studio)
    : "${STUDIO_USER:?Defina STUDIO_USER}"
    : "${STUDIO_PASSWORD:?Defina STUDIO_PASSWORD}"
    STUDIO_PASSWORD_HASH="$(caddy hash-password --plaintext "$STUDIO_PASSWORD")"
    export STUDIO_USER STUDIO_PASSWORD_HASH
    echo "Studio: Remotion Studio interno na porta 3001; Caddy com senha na porta ${PORT:-3000}"
    npx remotion studio --port 3001 --no-open --ipv4 &
    exec caddy run --config /app/docker/Caddyfile --adapter caddyfile
    ;;
  api)
    echo "API: servidor de render na porta ${PORT:-3000}"
    exec node server/index.ts
    ;;
  *)
    echo "SERVICE inválido: '${SERVICE}' (use studio ou api)" >&2
    exit 1
    ;;
esac
