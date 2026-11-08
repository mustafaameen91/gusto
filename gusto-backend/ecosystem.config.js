// PM2: `pm2 start ecosystem.config.js && pm2 save` (run `pm2 startup` once so it starts on boot)
module.exports = {
  apps: [
    {
      name: "gusto-backend",
      script: "server.js",
      cwd: __dirname,
      instances: 1, // one process: live kitchen screens (socket.io) need a single instance
      autorestart: true,
      max_memory_restart: "500M",
      time: true,
      env: {
        NODE_ENV: "production",
        PORT: 3128,
        TZ: "Asia/Baghdad", // business day 03:00–02:59 Baghdad time
      },
    },
  ],
};
