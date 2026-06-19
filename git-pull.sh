#!/bin/bash
# Atualização FORÇADA — só git (sem build). Útil para diagnosticar.
set -e
cd "$(dirname "$0")"
BRANCH="${DEPLOY_BRANCH:-producao}"

echo "Antes: $(git rev-parse --short HEAD 2>/dev/null || echo '?')"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"
git clean -fd -e .env -e .htaccess -e .well-known
echo "Depois: $(git rev-parse --short HEAD)"
git status -sb
