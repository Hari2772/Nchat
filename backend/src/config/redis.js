const Redis = require('ioredis');
const logger = require('../utils/logger');

class RedisConnection {
  constructor() {
    this.client = null;
    this.pubClient = null;
    this.subClient = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Redis already connected');
        return;
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      
      // Main Redis client for general operations
      this.client = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        db: 0,
        keyPrefix: 'nearchat:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        reconnectOnError: (err) => {
          const targetError = 'READONLY';
          if (err.message.includes(targetError)) {
            return true;
          }
          return false;
        }
      });

      // Publisher client for Socket.IO
      this.pubClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        db: 0,
        keyPrefix: 'nearchat:socket:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Subscriber client for Socket.IO
      this.subClient = new Redis(redisUrl, {
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: null,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        db: 0,
        keyPrefix: 'nearchat:socket:',
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        }
      });

      // Event handlers for main client
      this.client.on('connect', () => {
        logger.info('Redis client connected');
      });

      this.client.on('ready', () => {
        logger.info('Redis client ready');
        this.isConnected = true;
      });

      this.client.on('error', (error) => {
        logger.error('Redis client error:', error);
        this.isConnected = false;
      });

      this.client.on('close', () => {
        logger.warn('Redis client connection closed');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('Redis client reconnecting...');
      });

      // Event handlers for publisher client
      this.pubClient.on('connect', () => {
        logger.info('Redis publisher connected');
      });

      this.pubClient.on('ready', () => {
        logger.info('Redis publisher ready');
      });

      this.pubClient.on('error', (error) => {
        logger.error('Redis publisher error:', error);
      });

      // Event handlers for subscriber client
      this.subClient.on('connect', () => {
        logger.info('Redis subscriber connected');
      });

      this.subClient.on('ready', () => {
        logger.info('Redis subscriber ready');
      });

      this.subClient.on('error', (error) => {
        logger.error('Redis subscriber error:', error);
      });

      // Wait for connections to be ready
      await Promise.all([
        this.client.connect(),
        this.pubClient.connect(),
        this.subClient.connect()
      ]);

      // Test connection
      await this.client.ping();
      logger.info('Redis connection test successful');

      // Setup graceful shutdown
      process.on('SIGTERM', () => {
        this.disconnect();
      });

      process.on('SIGINT', () => {
        this.disconnect();
      });

      return {
        client: this.client,
        pubClient: this.pubClient,
        subClient: this.subClient
      };

    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.disconnect();
        logger.info('Redis client disconnected');
      }
      if (this.pubClient) {
        await this.pubClient.disconnect();
        logger.info('Redis publisher disconnected');
      }
      if (this.subClient) {
        await this.subClient.disconnect();
        logger.info('Redis subscriber disconnected');
      }
      this.isConnected = false;
    } catch (error) {
      logger.error('Error disconnecting from Redis:', error);
      throw error;
    }
  }

  // Cache methods
  async set(key, value, ttl = 3600) {
    try {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      await this.client.setex(key, ttl, value);
    } catch (error) {
      logger.error('Redis set error:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      logger.error('Redis get error:', error);
      throw error;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
    } catch (error) {
      logger.error('Redis del error:', error);
      throw error;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error('Redis exists error:', error);
      throw error;
    }
  }

  async expire(key, ttl) {
    try {
      await this.client.expire(key, ttl);
    } catch (error) {
      logger.error('Redis expire error:', error);
      throw error;
    }
  }

  // Hash methods
  async hset(key, field, value) {
    try {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      await this.client.hset(key, field, value);
    } catch (error) {
      logger.error('Redis hset error:', error);
      throw error;
    }
  }

  async hget(key, field) {
    try {
      const value = await this.client.hget(key, field);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      logger.error('Redis hget error:', error);
      throw error;
    }
  }

  async hgetall(key) {
    try {
      const hash = await this.client.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        try {
          result[field] = JSON.parse(value);
        } catch {
          result[field] = value;
        }
      }
      return result;
    } catch (error) {
      logger.error('Redis hgetall error:', error);
      throw error;
    }
  }

  // List methods
  async lpush(key, value) {
    try {
      if (typeof value === 'object') {
        value = JSON.stringify(value);
      }
      await this.client.lpush(key, value);
    } catch (error) {
      logger.error('Redis lpush error:', error);
      throw error;
    }
  }

  async rpop(key) {
    try {
      const value = await this.client.rpop(key);
      if (value) {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return null;
    } catch (error) {
      logger.error('Redis rpop error:', error);
      throw error;
    }
  }

  // Set methods
  async sadd(key, member) {
    try {
      await this.client.sadd(key, member);
    } catch (error) {
      logger.error('Redis sadd error:', error);
      throw error;
    }
  }

  async srem(key, member) {
    try {
      await this.client.srem(key, member);
    } catch (error) {
      logger.error('Redis srem error:', error);
      throw error;
    }
  }

  async smembers(key) {
    try {
      return await this.client.smembers(key);
    } catch (error) {
      logger.error('Redis smembers error:', error);
      throw error;
    }
  }

  // Rate limiting
  async incrementRateLimit(key, windowMs) {
    try {
      const multi = this.client.multi();
      multi.incr(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const results = await multi.exec();
      return results[0][1];
    } catch (error) {
      logger.error('Redis rate limit error:', error);
      throw error;
    }
  }

  // User session management
  async setUserSession(userId, sessionData, ttl = 86400) {
    try {
      const key = `session:${userId}`;
      await this.set(key, sessionData, ttl);
    } catch (error) {
      logger.error('Redis setUserSession error:', error);
      throw error;
    }
  }

  async getUserSession(userId) {
    try {
      const key = `session:${userId}`;
      return await this.get(key);
    } catch (error) {
      logger.error('Redis getUserSession error:', error);
      throw error;
    }
  }

  async removeUserSession(userId) {
    try {
      const key = `session:${userId}`;
      await this.del(key);
    } catch (error) {
      logger.error('Redis removeUserSession error:', error);
      throw error;
    }
  }

  // Online users tracking
  async addOnlineUser(userId, socketId) {
    try {
      await this.sadd('online_users', userId);
      await this.hset('user_sockets', userId, socketId);
    } catch (error) {
      logger.error('Redis addOnlineUser error:', error);
      throw error;
    }
  }

  async removeOnlineUser(userId) {
    try {
      await this.srem('online_users', userId);
      await this.client.hdel('user_sockets', userId);
    } catch (error) {
      logger.error('Redis removeOnlineUser error:', error);
      throw error;
    }
  }

  async getOnlineUsers() {
    try {
      return await this.smembers('online_users');
    } catch (error) {
      logger.error('Redis getOnlineUsers error:', error);
      throw error;
    }
  }

  getClient() {
    return this.client;
  }

  getPubClient() {
    return this.pubClient;
  }

  getSubClient() {
    return this.subClient;
  }

  isConnected() {
    return this.isConnected;
  }
}

// Singleton instance
const redisConnection = new RedisConnection();

module.exports = redisConnection.connect.bind(redisConnection);