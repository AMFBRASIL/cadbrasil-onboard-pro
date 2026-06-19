#!/bin/bash
# Deploy produção — rodar NO VPS (Linux), dentro da pasta do projeto.
set -e
cd "$(dirname "$0")"

echo "==> npm install..."
npm install

echo "==> npm run build (Linux)..."
npm run build

if [ ! -f .env ]; then
  echo "ERRO: arquivo .env não encontrado. Crie antes de subir."
  exit 1
fi

if [ ! -f .output/server/index.mjs ]; then
  echo "ERRO: build falhou — .output/server/index.mjs não existe."
  exit 1
fi

echo "==> Reiniciando PM2..."
chmod +x start.sh deploy.sh
if pm2 describe cadbrasilCadastro >/dev/null 2>&1; then
  pm2 restart ecosystem.config.cjs
else
  pm2 start ecosystem.config.cjs
fi
pm2 save

echo "==> Deploy concluído. Porta 3015"
pm2 status cadbrasilCadastro
