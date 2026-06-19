#!/bin/bash
# Diagnóstico rápido de produção — rode: bash check-deploy.sh
set -e
cd "$(dirname "$0")"

echo "=== PASTA ==="
pwd

echo "=== NODE ==="
which node || true
node -v || true

echo "=== ARQUIVOS ==="
ls -la .env .output/server/index.mjs package.json 2>&1 || true

echo "=== BUILD? ==="
if [ ! -f .output/server/index.mjs ]; then
  echo "FALTA BUILD → rode: npm run build"
  exit 1
fi

echo "=== ENV? ==="
if [ ! -f .env ]; then
  echo "FALTA .env → crie o arquivo"
  exit 1
fi

echo "=== TESTE NODE (5 segundos) ==="
timeout 5 node --env-file=.env .output/server/index.mjs &
PID=$!
sleep 2
if kill -0 $PID 2>/dev/null; then
  echo "OK — Node subiu"
  kill $PID 2>/dev/null || true
else
  echo "FALHOU — rode manualmente: node --env-file=.env .output/server/index.mjs"
  exit 1
fi

echo "=== PORTA 3015 ==="
ss -tlnp | grep 3015 || echo "Porta 3015 livre"

echo "=== PM2 ==="
pm2 describe cadbrasilCadastro 2>/dev/null | head -30 || echo "PM2 app não existe"

echo "=== HEALTH API ==="
curl -sS http://127.0.0.1:3015/api/health || echo "Health check falhou"

echo ""
echo "=== FIM ==="
