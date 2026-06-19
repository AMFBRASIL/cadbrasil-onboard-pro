/**
 * PM2 — produção no VPS (Linux) / aaPanel.
 * Node direto (sem bash) — evita erro de CRLF no start.sh.
 * O .env é carregado em src/server.ts via load-env.ts.
 */
const path = require("path");

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: "cadbrasilCadastro",
      cwd: ROOT,
      script: path.join(ROOT, ".output/server/index.mjs"),
      interpreter: "node",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      error_file: path.join(ROOT, "logs/pm2-error.log"),
      out_file: path.join(ROOT, "logs/pm2-out.log"),
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3015,
      },
    },
  ],
};
