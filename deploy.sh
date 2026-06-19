#!/bin/bash
# =============================================================================
# DEPLOY COMPLETO — VPS Linux (aaPanel + PM2)
# Uso:  bash deploy.sh
#       bash deploy.sh --no-git    # só rebuild + PM2 (sem git pull)
# =============================================================================
set -e
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
step() { echo -e "\n${CYAN}==> $1${NC}"; }

SKIP_GIT=false
for arg in "$@"; do
  [ "$arg" = "--no-git" ] && SKIP_GIT=true
done

# --- 1. Git ---
if [ "$SKIP_GIT" = false ]; then
  step "1/7 Git (branch producao)"
  git fetch origin producao
  git reset --hard origin/producao
  ok "Código atualizado ($(git rev-parse --short HEAD))"
else
  step "1/7 Git (pulado — --no-git)"
fi

# --- 2. .env ---
step "2/7 Verificar .env"
[ -f .env ] || fail ".env não encontrado. Crie em $(pwd)/.env"
ok ".env encontrado"

# --- 3. Dependências ---
step "3/7 npm install"
npm install
ok "Dependências instaladas"

# --- 4. Build Linux ---
step "4/7 npm run build"
npm run build
[ -f .output/server/index.mjs ] || fail "Build falhou — .output/server/index.mjs não existe"
ok "Build gerado (.output/server/index.mjs)"

# --- 5. Teste banco (rollback, não grava) ---
step "5/7 Teste schema do banco (rollback)"
if node --env-file=.env scripts/test-cadastro.mjs; then
  ok "Schema do banco OK"
else
  fail "Teste do banco falhou — corrija DB_* no .env ou schema MySQL"
fi

# --- 6. PM2 ---
step "6/7 PM2"
mkdir -p logs
chmod +x start.sh deploy.sh check-deploy.sh vps-fix.sh 2>/dev/null || true
sed -i 's/\r$//' start.sh deploy.sh check-deploy.sh vps-fix.sh ecosystem.config.cjs 2>/dev/null || true

if pm2 describe cadbrasilCadastro >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
  ok "PM2 reiniciado"
else
  pm2 start ecosystem.config.cjs
  ok "PM2 iniciado"
fi
pm2 save
ok "PM2 salvo"

# --- 7. Health ---
step "7/7 Health check"
sleep 2
pm2 status cadbrasilCadastro

HEALTH=$(curl -sS http://127.0.0.1:3015/api/health 2>/dev/null || echo '{"ok":false}')
echo "$HEALTH"

if echo "$HEALTH" | grep -q '"ok":true'; then
  ok "Backend online — banco conectado"
  echo ""
  echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
  echo "  Site:  https://cadastro.cadbrasil.com.br"
  echo "  Local: http://127.0.0.1:3015"
else
  fail "Health check falhou. Rode: pm2 logs cadbrasilCadastro --lines 50"
fi
