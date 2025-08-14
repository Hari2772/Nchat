module.exports = {
  apps: [
    {
      name: 'nearchat-backend',
      script: 'src/server.js',
      instances: 'max', // Use all available CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        MONGODB_URI: process.env.MONGODB_URI,
        REDIS_URL: process.env.REDIS_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
        GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      // Performance optimization
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      
      // Logging
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // Auto restart
      autorestart: true,
      watch: false,
      max_restarts: 10,
      min_uptime: '10s',
      
      // Health monitoring
      health_check_grace_period: 3000,
      health_check_fatal_exceptions: true,
      
      // Load balancing
      increment_var: 'PORT',
      instance_var: 'INSTANCE_ID',
      
      // Environment variables for scaling
      env_cluster: {
        NODE_ENV: 'production',
        CLUSTER_MODE: true
      }
    }
  ],
  
  deploy: {
    production: {
      user: 'ubuntu',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:your-username/nearchat-backend.git',
      path: '/var/www/nearchat-backend',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    }
  }
};