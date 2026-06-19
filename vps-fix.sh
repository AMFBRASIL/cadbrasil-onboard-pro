#!/bin/bash
# Corrige deploy no VPS — rode: bash vps-fix.sh
set -e
cd "$(dirname "$0")"

echo "=== 1. Git (branch producao) ==="
git fetch origin producao
git reset --hard origin/producao

echo "=== 2. Dependências + build Linux ==="
npm install
npm run build

echo "=== 3. Verificações ==="
mkdir -p logs
ls -la .env .output/server/index.mjs

echo "=== 4. PM2 (Node direto, sem bash) ==="
chmod +x start.sh deploy.sh check-deploy.sh vps-fix.sh 2>/dev/null || true
sed -i 's/\r$//' start.sh deploy.sh check-deploy.sh ecosystem.config.cjs 2>/dev/null || true
pm2 delete cadbrasilCadastro 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

echo "=== 5. Health ==="
sleep 2
curl -sS http://127.0.0.1:3015/api/health || true
echo ""
pm2 status cadbrasilCadastro
pm2 logs cadbrasilCadastro --lines 20 --nostream
