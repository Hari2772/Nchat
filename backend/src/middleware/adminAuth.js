const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const ErrorHandler = require('./errorHandler');

class AdminAuthMiddleware {
  constructor() {
    this.adminCredentials = {
      email: 'ghari2772@gmail.com',
      password: 'hari143p'
    };
    this.jwtSecret = process.env.JWT_SECRET;
  }

  // Admin authentication middleware
  authenticate = async (req, res, next) => {
    try {
      const token = this.extractAdminToken(req);
      
      if (!token) {
        return next(ErrorHandler.authenticationError('Admin token required'));
      }

      const decoded = await this.verifyAdminToken(token);
      
      if (!decoded) {
        return next(ErrorHandler.authenticationError('Invalid admin token'));
      }

      // Verify admin credentials
      if (decoded.email !== this.adminCredentials.email) {
        logger.logSecurity('invalid_admin_token', null, {
          email: decoded.email,
          ip: req.ip
        });
        return next(ErrorHandler.authenticationError('Invalid admin credentials'));
      }

      // Add admin info to request
      req.admin = {
        email: decoded.email,
        role: 'admin',
        isAdmin: true,
        permissions: this.getAdminPermissions()
      };
      req.token = token;
      req.tokenDecoded = decoded;

      logger.logAuth('admin_authentication', decoded.email, true, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      logger.logAuth('admin_authentication', 'unknown', false, {
        error: error.message,
        ip: req.ip
      });
      next(ErrorHandler.authenticationError('Admin authentication failed'));
    }
  };

  // Admin login middleware
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return next(ErrorHandler.validationError([], 'Email and password required'));
      }

      // Verify admin credentials
      if (email !== this.adminCredentials.email) {
        logger.logSecurity('admin_login_attempt', null, {
          email: email,
          ip: req.ip
        });
        return next(ErrorHandler.authenticationError('Invalid admin credentials'));
      }

      const isPasswordValid = await bcrypt.compare(password, await bcrypt.hash(this.adminCredentials.password, 12));
      
      if (!isPasswordValid) {
        logger.logSecurity('admin_login_attempt', null, {
          email: email,
          ip: req.ip
        });
        return next(ErrorHandler.authenticationError('Invalid admin credentials'));
      }

      // Generate admin token
      const adminToken = this.generateAdminToken(email);
      
      // Add admin info to request
      req.admin = {
        email: email,
        role: 'admin',
        isAdmin: true,
        permissions: this.getAdminPermissions()
      };
      req.adminToken = adminToken;

      logger.logAuth('admin_login', email, true, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      logger.logAuth('admin_login', 'unknown', false, {
        error: error.message,
        ip: req.ip
      });
      next(ErrorHandler.authenticationError('Admin login failed'));
    }
  };

  // Admin logout middleware
  logout = async (req, res, next) => {
    try {
      const token = this.extractAdminToken(req);
      
      if (token) {
        await this.blacklistAdminToken(token);
      }

      logger.logAuth('admin_logout', req.admin?.email, true, {
        ip: req.ip
      });

      next();
    } catch (error) {
      logger.logAuth('admin_logout', 'unknown', false, {
        error: error.message,
        ip: req.ip
      });
      next(ErrorHandler.authenticationError('Admin logout failed'));
    }
  };

  // Require specific admin permissions
  requirePermission = (permission) => {
    return (req, res, next) => {
      if (!req.admin) {
        return next(ErrorHandler.authenticationError('Admin authentication required'));
      }

      const permissions = req.admin.permissions;
      
      if (!permissions.includes(permission)) {
        logger.logSecurity('unauthorized_admin_permission', req.admin.email, {
          requiredPermission: permission,
          userPermissions: permissions,
          path: req.originalUrl
        });
        return next(ErrorHandler.authorizationError('Insufficient admin permissions'));
      }

      next();
    };
  };

  // Require multiple admin permissions
  requirePermissions = (requiredPermissions) => {
    return (req, res, next) => {
      if (!req.admin) {
        return next(ErrorHandler.authenticationError('Admin authentication required'));
      }

      const userPermissions = req.admin.permissions;
      const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
      
      const hasAllPermissions = permissions.every(permission => userPermissions.includes(permission));
      
      if (!hasAllPermissions) {
        logger.logSecurity('unauthorized_admin_permissions', req.admin.email, {
          requiredPermissions: permissions,
          userPermissions: userPermissions,
          path: req.originalUrl
        });
        return next(ErrorHandler.authorizationError('Insufficient admin permissions'));
      }

      next();
    };
  };

  // Require super admin (highest level)
  requireSuperAdmin = (req, res, next) => {
    if (!req.admin) {
      return next(ErrorHandler.authenticationError('Admin authentication required'));
    }

    if (!req.admin.permissions.includes('super_admin')) {
      logger.logSecurity('unauthorized_super_admin_access', req.admin.email, {
        path: req.originalUrl
      });
      return next(ErrorHandler.authorizationError('Super admin access required'));
    }

    next();
  };

  // Rate limiting for admin endpoints
  adminRateLimit = (req, res, next) => {
    const rateLimiter = require('./rateLimiter');
    const limiter = rateLimiter.createAdminLimiter();
    return limiter(req, res, next);
  };

  // Extract admin token from request
  extractAdminToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Admin ')) {
      return authHeader.substring(6);
    }
    
    // Check for admin token in cookies
    if (req.cookies && req.cookies.adminToken) {
      return req.cookies.adminToken;
    }
    
    // Check for admin token in headers
    if (req.headers['x-admin-token']) {
      return req.headers['x-admin-token'];
    }
    
    return null;
  }

  // Verify admin token
  async verifyAdminToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'admin') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Admin token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid admin token');
      }
      throw error;
    }
  }

  // Generate admin token
  generateAdminToken(email) {
    return jwt.sign(
      { 
        email,
        type: 'admin',
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtSecret,
      { expiresIn: '1h' } // Admin tokens expire faster for security
    );
  }

  // Blacklist admin token
  async blacklistAdminToken(token) {
    try {
      const decoded = jwt.decode(token);
      const exp = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (exp > 0) {
        const redis = require('../config/redis');
        const redisClient = await redis();
        
        await redisClient.set(`admin_blacklist:${token}`, 'true', exp);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error blacklisting admin token:', error);
      return false;
    }
  }

  // Check if admin token is blacklisted
  async isAdminTokenBlacklisted(token) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const blacklisted = await redisClient.exists(`admin_blacklist:${token}`);
      return blacklisted > 0;
    } catch (error) {
      logger.error('Error checking admin token blacklist:', error);
      return false;
    }
  }

  // Get admin permissions
  getAdminPermissions() {
    return [
      'user_management',
      'content_moderation',
      'system_monitoring',
      'analytics_access',
      'configuration_management',
      'backup_restore',
      'security_management',
      'super_admin'
    ];
  }

  // Validate admin session
  async validateAdminSession(sessionId) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const session = await redisClient.get(`admin_session:${sessionId}`);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      logger.error('Error validating admin session:', error);
      return null;
    }
  }

  // Create admin session
  async createAdminSession(email, sessionData) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const sessionId = require('crypto').randomBytes(32).toString('hex');
      const session = {
        sessionId,
        email,
        createdAt: new Date(),
        permissions: this.getAdminPermissions(),
        ...sessionData
      };
      
      await redisClient.set(`admin_session:${sessionId}`, JSON.stringify(session), 3600); // 1 hour
      return sessionId;
    } catch (error) {
      logger.error('Error creating admin session:', error);
      return null;
    }
  }

  // Destroy admin session
  async destroyAdminSession(sessionId) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      await redisClient.del(`admin_session:${sessionId}`);
      return true;
    } catch (error) {
      logger.error('Error destroying admin session:', error);
      return false;
    }
  }

  // Get admin activity log
  async getAdminActivityLog(email, limit = 100) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const logKey = `admin_activity:${email}`;
      const activities = await redisClient.client.lrange(logKey, 0, limit - 1);
      
      return activities.map(activity => JSON.parse(activity));
    } catch (error) {
      logger.error('Error getting admin activity log:', error);
      return [];
    }
  }

  // Log admin activity
  async logAdminActivity(email, action, details = {}) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const logKey = `admin_activity:${email}`;
      const activity = {
        action,
        timestamp: new Date().toISOString(),
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown',
        details: details
      };
      
      await redisClient.client.lpush(logKey, JSON.stringify(activity));
      await redisClient.client.ltrim(logKey, 0, 999); // Keep last 1000 activities
      
      logger.logBusiness(`admin_${action}`, email, details);
    } catch (error) {
      logger.error('Error logging admin activity:', error);
    }
  }

  // Get admin dashboard stats
  async getAdminDashboardStats() {
    try {
      const User = require('../models/User');
      const Story = require('../models/Story');
      const Message = require('../models/Message');
      
      const [
        totalUsers,
        activeUsers,
        totalStories,
        totalMessages,
        newUsersToday,
        newStoriesToday
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ lastSeen: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Story.countDocuments(),
        Message.countDocuments(),
        User.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
        Story.countDocuments({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      ]);
      
      return {
        totalUsers,
        activeUsers,
        totalStories,
        totalMessages,
        newUsersToday,
        newStoriesToday,
        systemHealth: await this.getSystemHealth()
      };
    } catch (error) {
      logger.error('Error getting admin dashboard stats:', error);
      return {};
    }
  }

  // Get system health
  async getSystemHealth() {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const dbHealth = await this.checkDatabaseHealth();
      const redisHealth = await this.checkRedisHealth();
      const systemHealth = this.checkSystemResources();
      
      return {
        database: dbHealth,
        redis: redisHealth,
        system: systemHealth,
        overall: dbHealth && redisHealth && systemHealth ? 'healthy' : 'unhealthy'
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      return { overall: 'error' };
    }
  }

  // Check database health
  async checkDatabaseHealth() {
    try {
      const User = require('../models/User');
      await User.findOne().limit(1);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check Redis health
  async checkRedisHealth() {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      await redisClient.client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  // Check system resources
  checkSystemResources() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    return heapUsedMB < 1024; // Less than 1GB
  }
}

// Create singleton instance
const adminAuthMiddleware = new AdminAuthMiddleware();

module.exports = adminAuthMiddleware;