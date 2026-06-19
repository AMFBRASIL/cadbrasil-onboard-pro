#!/bin/bash
# =============================================================================
# DEPLOY COMPLETO — VPS Linux (aaPanel + PM2)
#
#   bash deploy.sh                 # git + build + PM2 (recomendado)
#   bash deploy.sh --no-git        # só build + PM2
#   bash deploy.sh --skip-db-test    # não aborta se teste MySQL falhar
# =============================================================================
set -e
cd "$(dirname "$0")"

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; exit 1; }
warn() { echo -e "  ${YELLOW}!${NC} $1"; }
step() { echo -e "\n${CYAN}==> $1${NC}"; }

SKIP_GIT=false
SKIP_DB_TEST=false
for arg in "$@"; do
  [ "$arg" = "--no-git" ] && SKIP_GIT=true
  [ "$arg" = "--skip-db-test" ] && SKIP_DB_TEST=true
done

DEPLOY_BRANCH="${DEPLOY_BRANCH:-producao}"
DEPLOY_OK=true

# --- 1. Git (sempre primeiro — descarta alterações locais no VPS) ---
if [ "$SKIP_GIT" = false ]; then
  step "1/7 Git (branch $DEPLOY_BRANCH)"

  if ! git rev-parse --git-dir >/dev/null 2>&1; then
    fail "Pasta não é repositório git."
  fi

  BEFORE=$(git rev-parse --short HEAD 2>/dev/null || echo "?")

  git fetch origin "$DEPLOY_BRANCH" || fail "git fetch falhou — configure SSH ou token no VPS"

  git reset --hard "origin/$DEPLOY_BRANCH"
  git clean -fd -e .env -e .htaccess -e .well-known

  AFTER=$(git rev-parse --short HEAD)
  REMOTE=$(git rev-parse --short "origin/$DEPLOY_BRANCH")

  if [ "$AFTER" != "$REMOTE" ]; then
    fail "Git não sincronizou: local=$AFTER remoto=$REMOTE"
  fi

  if [ "$BEFORE" = "$AFTER" ]; then
    ok "Git já estava em $AFTER — arquivos confirmados"
  else
    ok "Git atualizado: $BEFORE → $AFTER"
  fi
else
  step "1/7 Git (pulado)"
  warn "Use 'bash deploy.sh' sem --no-git para puxar do GitHub"
fi

# --- 2. .env ---
step "2/7 Verificar .env"
[ -f .env ] || fail ".env não encontrado em $(pwd)"
ok ".env OK"

# --- 3. npm install ---
step "3/7 npm install"
npm install || fail "npm install falhou"
ok "Dependências OK"

# --- 4. Build ---
step "4/7 npm run build"
npm run build || fail "npm run build falhou"
[ -f .output/server/index.mjs ] || fail ".output/server/index.mjs não existe"
ok "Build OK ($(du -h .output/server/index.mjs | cut -f1))"

# --- 5. Teste banco (NÃO bloqueia PM2 por padrão) ---
step "5/7 Teste banco (opcional)"
if [ "$SKIP_DB_TEST" = true ]; then
  warn "Teste do banco pulado (--skip-db-test)"
elif node --env-file=.env scripts/test-cadastro.mjs; then
  ok "Schema MySQL OK"
else
  warn "Teste MySQL falhou — deploy CONTINUA (corrija DB_HOST no .env; use 127.0.0.1 se MySQL é local)"
  DEPLOY_OK=false
fi

# --- 6. PM2 (SEMPRE reinicia — é o que atualiza o servidor em produção) ---
step "6/7 PM2"
mkdir -p logs
chmod +x start.sh deploy.sh check-deploy.sh vps-fix.sh auto-deploy.sh 2>/dev/null || true
sed -i 's/\r$//' *.sh ecosystem.config.cjs 2>/dev/null || true

if pm2 describe cadbrasilCadastro >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi
pm2 save
ok "PM2 reiniciado — servidor rodando novo build"

# --- 7. Health ---
step "7/7 Health check"
sleep 3
pm2 status cadbrasilCadastro || true

HEALTH=$(curl -sS --max-time 10 http://127.0.0.1:3015/api/health 2>/dev/null || echo '{"ok":false}')
echo "$HEALTH"

echo ""
echo "  Commit em produção: $(git rev-parse --short HEAD)"
echo "  Build:              .output/server/index.mjs"

if echo "$HEALTH" | grep -q '"ok":true'; then
  echo -e "${GREEN}Deploy concluído com sucesso!${NC}"
elif [ "$DEPLOY_OK" = false ]; then
  echo -e "${YELLOW}Deploy aplicado (git+build+PM2), mas banco com problema no .env${NC}"
  echo "  Corrija DB_HOST=127.0.0.1 no .env e rode: pm2 restart ecosystem.config.cjs"
  exit 0
else
  warn "Health check falhou — git/build/PM2 foram aplicados. Verifique logs:"
  echo "  pm2 logs cadbrasilCadastro --lines 50"
  exit 0
fi
