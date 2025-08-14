const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

class RateLimiter {
  constructor() {
    this.redis = null;
    this.limits = new Map();
  }

  async initialize() {
    try {
      const redisConnection = require('../config/redis');
      this.redis = await redisConnection();
      logger.info('Rate limiter initialized with Redis');
    } catch (error) {
      logger.warn('Rate limiter using memory store (Redis not available)');
      this.redis = null;
    }
  }

  // General API rate limiter
  createGeneralLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: {
          message: 'Too many requests from this IP, please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      },
      handler: (req, res) => {
        logger.logRateLimit(req.ip, req.originalUrl, 100, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many requests from this IP, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Authentication rate limiter (stricter)
  createAuthLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // Limit each IP to 5 auth attempts per windowMs
      message: {
        success: false,
        error: {
          message: 'Too many authentication attempts, please try again later.',
          code: 'AUTH_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return `auth:${req.ip || req.connection.remoteAddress}`;
      },
      handler: (req, res) => {
        logger.logRateLimit(req.ip, 'auth', 5, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many authentication attempts, please try again later.',
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // File upload rate limiter
  createUploadLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Limit each user to 10 uploads per hour
      message: {
        success: false,
        error: {
          message: 'Too many file uploads, please try again later.',
          code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `upload:${req.user._id}` : `upload:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'upload', 10, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many file uploads, please try again later.',
            code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Story creation rate limiter
  createStoryLimiter() {
    return rateLimit({
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 20, // Limit each user to 20 stories per hour
      message: {
        success: false,
        error: {
          message: 'Too many stories created, please try again later.',
          code: 'STORY_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `story:${req.user._id}` : `story:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'story', 20, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many stories created, please try again later.',
            code: 'STORY_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Message sending rate limiter
  createMessageLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 30, // Limit each user to 30 messages per minute
      message: {
        success: false,
        error: {
          message: 'Too many messages sent, please slow down.',
          code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `message:${req.user._id}` : `message:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'message', 30, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many messages sent, please slow down.',
            code: 'MESSAGE_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Friend request rate limiter
  createFriendRequestLimiter() {
    return rateLimit({
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      max: 50, // Limit each user to 50 friend requests per day
      message: {
        success: false,
        error: {
          message: 'Too many friend requests sent today, please try again tomorrow.',
          code: 'FRIEND_REQUEST_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `friend_request:${req.user._id}` : `friend_request:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'friend_request', 50, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many friend requests sent today, please try again tomorrow.',
            code: 'FRIEND_REQUEST_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Search rate limiter
  createSearchLimiter() {
    return rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 20, // Limit each user to 20 searches per minute
      message: {
        success: false,
        error: {
          message: 'Too many searches, please slow down.',
          code: 'SEARCH_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `search:${req.user._id}` : `search:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'search', 20, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many searches, please slow down.',
            code: 'SEARCH_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Admin rate limiter (more lenient)
  createAdminLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 200, // Limit each admin to 200 requests per windowMs
      message: {
        success: false,
        error: {
          message: 'Too many admin requests, please slow down.',
          code: 'ADMIN_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `admin:${req.user._id}` : `admin:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        logger.logRateLimit(key, 'admin', 200, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Too many admin requests, please slow down.',
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Speed limiter for general requests
  createSpeedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 50, // Allow 50 requests per 15 minutes without delay
      delayMs: 500, // Add 500ms delay per request after delayAfter
      maxDelayMs: 20000, // Maximum delay of 20 seconds
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress;
      }
    });
  }

  // Speed limiter for authentication
  createAuthSpeedLimiter() {
    return slowDown({
      windowMs: 15 * 60 * 1000, // 15 minutes
      delayAfter: 3, // Allow 3 auth attempts per 15 minutes without delay
      delayMs: 1000, // Add 1 second delay per attempt after delayAfter
      maxDelayMs: 30000, // Maximum delay of 30 seconds
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return `auth_slow:${req.ip || req.connection.remoteAddress}`;
      }
    });
  }

  // Create Redis store for rate limiting
  createRedisStore() {
    if (!this.redis) return undefined;

    return {
      incr: async (key) => {
        const result = await this.redis.incrementRateLimit(key, 15 * 60 * 1000);
        return {
          totalHits: result,
          resetTime: new Date(Date.now() + 15 * 60 * 1000)
        };
      },
      decrement: async (key) => {
        await this.redis.client.decr(key);
      },
      resetKey: async (key) => {
        await this.redis.client.del(key);
      }
    };
  }

  // Dynamic rate limiter based on user tier
  createDynamicLimiter() {
    return rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: (req) => {
        // Return different limits based on user tier
        if (req.user) {
          switch (req.user.role) {
            case 'admin':
              return 500;
            case 'moderator':
              return 300;
            case 'premium':
              return 200;
            default:
              return 100;
          }
        }
        return 50; // Anonymous users
      },
      message: {
        success: false,
        error: {
          message: 'Rate limit exceeded for your tier.',
          code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
          status: 429
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
      store: this.redis ? this.createRedisStore() : undefined,
      keyGenerator: (req) => {
        return req.user ? `dynamic:${req.user._id}` : `dynamic:${req.ip}`;
      },
      handler: (req, res) => {
        const key = req.user ? req.user._id : req.ip;
        const limit = req.user ? 
          (req.user.role === 'admin' ? 500 : 
           req.user.role === 'moderator' ? 300 : 
           req.user.role === 'premium' ? 200 : 100) : 50;
        logger.logRateLimit(key, 'dynamic', limit, 0);
        res.status(429).json({
          success: false,
          error: {
            message: 'Rate limit exceeded for your tier.',
            code: 'DYNAMIC_RATE_LIMIT_EXCEEDED',
            status: 429
          }
        });
      }
    });
  }

  // Get current rate limit status
  async getRateLimitStatus(key, windowMs = 15 * 60 * 1000) {
    if (!this.redis) return null;

    try {
      const hits = await this.redis.client.get(key);
      const ttl = await this.redis.client.ttl(key);
      
      return {
        hits: parseInt(hits) || 0,
        remaining: Math.max(0, 100 - (parseInt(hits) || 0)),
        resetTime: new Date(Date.now() + (ttl * 1000)),
        ttl: ttl
      };
    } catch (error) {
      logger.error('Error getting rate limit status:', error);
      return null;
    }
  }

  // Reset rate limit for a key
  async resetRateLimit(key) {
    if (!this.redis) return false;

    try {
      await this.redis.client.del(key);
      return true;
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return false;
    }
  }

  // Get all active rate limits
  async getAllRateLimits() {
    if (!this.redis) return [];

    try {
      const keys = await this.redis.client.keys('nearchat:ratelimit:*');
      const limits = [];

      for (const key of keys) {
        const hits = await this.redis.client.get(key);
        const ttl = await this.redis.client.ttl(key);
        
        limits.push({
          key: key.replace('nearchat:ratelimit:', ''),
          hits: parseInt(hits) || 0,
          ttl: ttl
        });
      }

      return limits;
    } catch (error) {
      logger.error('Error getting all rate limits:', error);
      return [];
    }
  }

  // Clean up expired rate limits
  async cleanupExpiredLimits() {
    if (!this.redis) return 0;

    try {
      const keys = await this.redis.client.keys('nearchat:ratelimit:*');
      let deleted = 0;

      for (const key of keys) {
        const ttl = await this.redis.client.ttl(key);
        if (ttl <= 0) {
          await this.redis.client.del(key);
          deleted++;
        }
      }

      return deleted;
    } catch (error) {
      logger.error('Error cleaning up expired rate limits:', error);
      return 0;
    }
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Initialize rate limiter
rateLimiter.initialize().catch(error => {
  logger.error('Failed to initialize rate limiter:', error);
});

module.exports = rateLimiter;