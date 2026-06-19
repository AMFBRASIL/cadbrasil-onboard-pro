#!/bin/bash
# =============================================================================
# AUTO-DEPLOY — roda via CRON no VPS
# Só executa deploy.sh se houver commit novo em origin/producao
#
# Cron (a cada 5 min):
#   */5 * * * * cd /www/wwwroot/cadbrasil-onboard-pro && bash auto-deploy.sh >> /www/wwwlogs/cadbrasil-auto-deploy.log 2>&1
# =============================================================================
set -e
cd "$(dirname "$0")"

LOG_PREFIX="[auto-deploy $(date '+%Y-%m-%d %H:%M:%S')]"
DEPLOY_BRANCH="${DEPLOY_BRANCH:-producao}"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "$LOG_PREFIX ERRO: não é repositório git"
  exit 1
fi

if ! git fetch origin "$DEPLOY_BRANCH" 2>&1; then
  echo "$LOG_PREFIX ERRO: git fetch falhou (verifique SSH/token no VPS)"
  exit 1
fi

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse "origin/$DEPLOY_BRANCH")

if [ "$LOCAL" = "$REMOTE" ]; then
  echo "$LOG_PREFIX sem mudanças ($(git rev-parse --short HEAD))"
  exit 0
fi

echo "$LOG_PREFIX novo commit: $(git rev-parse --short "$LOCAL") → $(git rev-parse --short "$REMOTE")"
exec bash deploy.sh
