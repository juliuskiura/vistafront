module.exports = {
  apps: [
    {
      name: "vistafront",
      cwd: "/home/vistech/vstsuite/frontapp/vistafront",

      script: "node_modules/next/dist/bin/next",
      args: "start",

      instances: 1,
      exec_mode: "fork",

      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      env: {
        NODE_ENV: "production",
        NEXT_STATUS: "production",
        PORT: 5173,
        HOSTNAME: "127.0.0.1",
        BACKEND_URL: "https://app.vistasolve.com",
        API_PROXY_TARGET: "https://app.vistasolve.com",
      },
      time: true,
      merge_logs: true,
      out_file: "./logs/pm2-out.log",
      error_file: "./logs/pm2-error.log",
    },
  ],
};