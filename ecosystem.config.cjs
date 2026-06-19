/**
 * PM2 — produção no VPS (Linux) / aaPanel.
 * Uso: pm2 start ecosystem.config.cjs
 */
const path = require("path");

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: "cadbrasilCadastro",
      cwd: ROOT,
      script: path.join(ROOT, "start.sh"),
      interpreter: "bash",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        HOST: "0.0.0.0",
        PORT: 3015,
      },
    },
  ],
};
