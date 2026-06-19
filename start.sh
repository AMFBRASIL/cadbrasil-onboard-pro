#!/bin/bash
# Inicia o servidor de produção (usado pelo PM2 / aaPanel).
set -e
cd "$(dirname "$0")"

echo "[start.sh] cwd=$(pwd)"

if [ ! -f .env ]; then
  echo "[start.sh] ERRO: .env não encontrado em $(pwd)" >&2
  exit 1
fi

if [ ! -f .output/server/index.mjs ]; then
  echo "[start.sh] ERRO: build não encontrado (.output/server/index.mjs). Rode: npm run build" >&2
  exit 1
fi

echo "[start.sh] Node $(node -v) — subindo porta ${PORT:-3015}..."
exec node --env-file=.env .output/server/index.mjs
