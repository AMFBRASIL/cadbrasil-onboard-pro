#!/bin/bash
# Inicia o servidor de produção (usado pelo PM2 / aaPanel).
set -e
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ERRO: .env não encontrado em $(pwd)"
  exit 1
fi

if [ ! -f .output/server/index.mjs ]; then
  echo "ERRO: build não encontrado. Rode: npm run build"
  exit 1
fi

exec node --env-file=.env .output/server/index.mjs
