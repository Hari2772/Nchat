const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cluster = require('cluster');
const os = require('os');
const path = require('path');
require('dotenv').config();

// Import configurations
const connectDB = require('./config/database');
const connectRedis = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const authMiddleware = require('./middleware/authMiddleware');
const rateLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const storyRoutes = require('./routes/storyRoutes');
const streakRoutes = require('./routes/streakRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Import socket handlers
const socketHandler = require('./socket/index');

// Import cron jobs
const cronJobs = require('./utils/cronJobs');

class NearChatServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = null;
    this.port = process.env.PORT || 3000;
  }

  async initialize() {
    try {
      // Connect to databases
      await connectDB();
      await connectRedis();

      // Setup middleware
      this.setupMiddleware();

      // Setup routes
      this.setupRoutes();

      // Setup Socket.IO with Redis adapter
      this.setupSocketIO();

      // Setup error handling
      this.setupErrorHandling();

      // Start cron jobs
      cronJobs.start();

      // Start server
      this.startServer();

    } catch (error) {
      logger.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(require('helmet')());
    this.app.use(require('cors')({
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Compression
    this.app.use(require('compression')());

    // Request ID for tracking
    this.app.use(require('express-request-id')());

    // Rate limiting
    this.app.use(rateLimiter);

    // Status monitoring
    this.app.use(require('express-status-monitor')({
      title: 'NearChat Status',
      path: '/status',
      spans: [{
        interval: 1,
        retention: 60
      }, {
        interval: 5,
        retention: 60
      }, {
        interval: 15,
        retention: 60
      }]
    }));

    // Static files
    this.app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cluster: cluster.isWorker ? cluster.worker.id : 'master'
      });
    });
  }

  setupRoutes() {
    // API routes
    this.app.use('/api/auth', authRoutes);
    this.app.use('/api/users', authMiddleware, userRoutes);
    this.app.use('/api/stories', authMiddleware, storyRoutes);
    this.app.use('/api/streaks', authMiddleware, streakRoutes);
    this.app.use('/api/admin', require('./middleware/adminAuth'), adminRoutes);

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });
  }

  setupSocketIO() {
    const Redis = require('ioredis');
    const redisAdapter = require('socket.io-redis');

    // Create Redis client for Socket.IO adapter
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = new Redis(process.env.REDIS_URL);

    // Initialize Socket.IO with Redis adapter
    this.io = socketIo(this.server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      adapter: redisAdapter({
        pubClient,
        subClient
      }),
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 10000,
      maxHttpBufferSize: 1e8, // 100MB
      allowRequest: (req, callback) => {
        // Rate limiting for socket connections
        const clientId = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        if (req.headers.authorization) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      }
    });

    // Initialize socket handlers
    socketHandler(this.io);

    // Socket connection monitoring
    this.io.engine.on('connection_error', (err) => {
      logger.error('Socket.IO connection error:', err);
    });

    // Graceful shutdown for Socket.IO
    process.on('SIGTERM', () => {
      this.io.close(() => {
        logger.info('Socket.IO server closed');
        process.exit(0);
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  startServer() {
    this.server.listen(this.port, () => {
      logger.info(`NearChat server running on port ${this.port}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Cluster worker: ${cluster.isWorker ? cluster.worker.id : 'master'}`);
      
      // Log system information
      const memUsage = process.memoryUsage();
      logger.info('Memory usage:', {
        rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.server.close(() => {
        logger.info('HTTP server closed');
        process.exit(0);
      });
    });

    // Unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }
}

// Cluster mode for horizontal scaling
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  logger.info(`Master process ${process.pid} is running`);
  logger.info(`Starting ${numCPUs} workers`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    logger.warn(`Worker ${worker.process.pid} died`);
    logger.info('Starting a new worker');
    cluster.fork();
  });

  cluster.on('online', (worker) => {
    logger.info(`Worker ${worker.process.pid} is online`);
  });
} else {
  // Worker process
  const server = new NearChatServer();
  server.initialize();
}

module.exports = NearChatServer;