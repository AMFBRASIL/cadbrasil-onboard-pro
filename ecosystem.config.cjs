/**
 * PM2 — produção no VPS (Linux) / aaPanel.
 * Usa "npm run start" — mais compatível que node_args no aaPanel.
 */
const path = require("path");

const ROOT = __dirname;

module.exports = {
  apps: [
    {
      name: "cadbrasilCadastro",
      cwd: ROOT,
      script: "npm",
      args: "run start",
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
