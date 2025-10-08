// Robbie V3 PM2 Ecosystem Configuration
// Feature matched with old script - PM2 cluster mode

module.exports = {
  apps: [
    {
      name: 'robbie-v3-api',
      script: './src/server.js',
      cwd: '/app',
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: process.env.PM2_EXEC_MODE || 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        API_PORT: 3000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 3000,
      shutdown_with_message: true
    },
    {
      name: 'robbie-v3-websocket',
      script: './src/websocket-server.js',
      cwd: '/app',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        WEBSOCKET_PORT: 3003
      },
      error_file: './logs/ws-error.log',
      out_file: './logs/ws-out.log',
      log_file: './logs/ws-combined.log',
      max_memory_restart: '512M',
      node_args: '--max-old-space-size=512',
      exp_backoff_restart_delay: 100,
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,
      listen_timeout: 3000
    }
  ]
};














