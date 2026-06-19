/**
 * PM2 — produção no VPS (Linux).
 * Uso: pm2 start ecosystem.config.cjs
 * Requer: npm run build já executado e arquivo .env na raiz do projeto.
 */
module.exports = {
  apps: [
    {
      name: "cadbrasil-onboard",
      cwd: __dirname,
      script: "node",
      args: "--env-file=.env .output/server/index.mjs",
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
