const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const ErrorHandler = require('./errorHandler');

class AuthMiddleware {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  }

  // Main authentication middleware
  authenticate = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return next(ErrorHandler.authenticationError('No token provided'));
      }

      const decoded = await this.verifyToken(token);
      
      if (!decoded) {
        return next(ErrorHandler.authenticationError('Invalid token'));
      }

      const user = await this.getUserFromToken(decoded);
      
      if (!user) {
        return next(ErrorHandler.authenticationError('User not found'));
      }

      if (user.status !== 'active') {
        return next(ErrorHandler.authorizationError('Account is not active'));
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return next(ErrorHandler.authenticationError('Token has been revoked'));
      }

      // Add user to request object
      req.user = user;
      req.token = token;
      req.tokenDecoded = decoded;

      // Log successful authentication
      logger.logAuth('token_verification', user._id, true, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      next();
    } catch (error) {
      logger.logAuth('token_verification', 'unknown', false, {
        error: error.message,
        ip: req.ip
      });
      next(ErrorHandler.authenticationError('Token verification failed'));
    }
  };

  // Optional authentication (doesn't fail if no token)
  authenticateOptional = async (req, res, next) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return next(); // Continue without authentication
      }

      const decoded = await this.verifyToken(token);
      
      if (!decoded) {
        return next(); // Continue without authentication
      }

      const user = await this.getUserFromToken(decoded);
      
      if (!user || user.status !== 'active') {
        return next(); // Continue without authentication
      }

      // Check if token is blacklisted
      const isBlacklisted = await this.isTokenBlacklisted(token);
      if (isBlacklisted) {
        return next(); // Continue without authentication
      }

      // Add user to request object
      req.user = user;
      req.token = token;
      req.tokenDecoded = decoded;

      next();
    } catch (error) {
      // Continue without authentication on error
      next();
    }
  };

  // Refresh token authentication
  authenticateRefresh = async (req, res, next) => {
    try {
      const refreshToken = this.extractRefreshToken(req);
      
      if (!refreshToken) {
        return next(ErrorHandler.authenticationError('No refresh token provided'));
      }

      const decoded = await this.verifyRefreshToken(refreshToken);
      
      if (!decoded) {
        return next(ErrorHandler.authenticationError('Invalid refresh token'));
      }

      const user = await this.getUserFromToken(decoded);
      
      if (!user) {
        return next(ErrorHandler.authenticationError('User not found'));
      }

      if (user.status !== 'active') {
        return next(ErrorHandler.authorizationError('Account is not active'));
      }

      // Add user to request object
      req.user = user;
      req.refreshToken = refreshToken;
      req.tokenDecoded = decoded;

      logger.logAuth('refresh_token_verification', user._id, true);
      next();
    } catch (error) {
      logger.logAuth('refresh_token_verification', 'unknown', false, {
        error: error.message
      });
      next(ErrorHandler.authenticationError('Refresh token verification failed'));
    }
  };

  // Role-based authorization
  requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.user) {
        return next(ErrorHandler.authenticationError('Authentication required'));
      }

      const userRole = req.user.role;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!allowedRoles.includes(userRole)) {
        logger.logSecurity('unauthorized_role_access', req.user._id, {
          requiredRoles: allowedRoles,
          userRole: userRole,
          path: req.originalUrl
        });
        return next(ErrorHandler.authorizationError('Insufficient permissions'));
      }

      next();
    };
  };

  // Admin authorization
  requireAdmin = (req, res, next) => {
    if (!req.user) {
      return next(ErrorHandler.authenticationError('Authentication required'));
    }

    if (!req.user.isAdmin && req.user.role !== 'admin') {
      logger.logSecurity('unauthorized_admin_access', req.user._id, {
        path: req.originalUrl
      });
      return next(ErrorHandler.authorizationError('Admin access required'));
    }

    next();
  };

  // Premium user authorization
  requirePremium = (req, res, next) => {
    if (!req.user) {
      return next(ErrorHandler.authenticationError('Authentication required'));
    }

    if (req.user.role !== 'premium' && req.user.role !== 'admin') {
      logger.logSecurity('unauthorized_premium_access', req.user._id, {
        path: req.originalUrl
      });
      return next(ErrorHandler.authorizationError('Premium access required'));
    }

    next();
  };

  // Ownership verification
  requireOwnership = (resourceModel, resourceIdParam = 'id') => {
    return async (req, res, next) => {
      try {
        if (!req.user) {
          return next(ErrorHandler.authenticationError('Authentication required'));
        }

        const resourceId = req.params[resourceIdParam];
        
        if (!resourceId) {
          return next(ErrorHandler.validationError([], 'Resource ID required'));
        }

        const resource = await resourceModel.findById(resourceId);
        
        if (!resource) {
          return next(ErrorHandler.notFoundError('Resource'));
        }

        // Check if user owns the resource or is admin
        if (resource.userId && !resource.userId.equals(req.user._id) && req.user.role !== 'admin') {
          logger.logSecurity('unauthorized_resource_access', req.user._id, {
            resourceId: resourceId,
            resourceType: resourceModel.modelName,
            path: req.originalUrl
          });
          return next(ErrorHandler.authorizationError('Access denied to this resource'));
        }

        req.resource = resource;
        next();
      } catch (error) {
        next(ErrorHandler.databaseError('Failed to verify resource ownership'));
      }
    };
  };

  // Friend relationship verification
  requireFriendship = (req, res, next) => {
    if (!req.user) {
      return next(ErrorHandler.authenticationError('Authentication required'));
    }

    const targetUserId = req.params.userId || req.body.userId;
    
    if (!targetUserId) {
      return next(ErrorHandler.validationError([], 'Target user ID required'));
    }

    // Allow access to own profile
    if (targetUserId === req.user._id.toString()) {
      return next();
    }

    // Check if users are friends
    const Friend = require('../models/Friend');
    Friend.findOne({
      $or: [
        { userId: req.user._id, friendId: targetUserId, status: 'accepted' },
        { userId: targetUserId, friendId: req.user._id, status: 'accepted' }
      ]
    }).then(friendship => {
      if (!friendship) {
        logger.logSecurity('unauthorized_friend_access', req.user._id, {
          targetUserId: targetUserId,
          path: req.originalUrl
        });
        return next(ErrorHandler.authorizationError('Friendship required'));
      }
      next();
    }).catch(error => {
      next(ErrorHandler.databaseError('Failed to verify friendship'));
    });
  };

  // Rate limiting for authenticated users
  requireRateLimit = (limitType) => {
    return (req, res, next) => {
      if (!req.user) {
        return next(ErrorHandler.authenticationError('Authentication required'));
      }

      // Apply rate limiting based on user tier
      const rateLimiter = require('./rateLimiter');
      const limiter = rateLimiter.createDynamicLimiter();
      
      return limiter(req, res, next);
    };
  };

  // Extract JWT token from request
  extractToken(req) {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Check for token in cookies
    if (req.cookies && req.cookies.accessToken) {
      return req.cookies.accessToken;
    }
    
    // Check for token in query parameters
    if (req.query.token) {
      return req.query.token;
    }
    
    return null;
  }

  // Extract refresh token from request
  extractRefreshToken(req) {
    const authHeader = req.headers['x-refresh-token'];
    
    if (authHeader) {
      return authHeader;
    }
    
    // Check for refresh token in cookies
    if (req.cookies && req.cookies.refreshToken) {
      return req.cookies.refreshToken;
    }
    
    // Check for refresh token in body
    if (req.body && req.body.refreshToken) {
      return req.body.refreshToken;
    }
    
    return null;
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid token');
      }
      throw error;
    }
  }

  // Verify refresh token
  async verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtRefreshSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('Refresh token expired');
      } else if (error.name === 'JsonWebTokenError') {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  // Get user from token
  async getUserFromToken(decoded) {
    try {
      const user = await User.findById(decoded.userId)
        .select('-password -verificationToken -verificationTokenExpires -passwordResetToken -passwordResetExpires');
      
      if (!user) {
        return null;
      }

      // Update last seen
      user.lastSeen = new Date();
      user.isOnline = true;
      await user.save();

      return user;
    } catch (error) {
      logger.error('Error getting user from token:', error);
      return null;
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const blacklisted = await redisClient.exists(`blacklist:${token}`);
      return blacklisted > 0;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  // Generate new access token
  generateAccessToken(userId) {
    return jwt.sign(
      { 
        userId,
        type: 'access',
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtSecret,
      { expiresIn: '24h' }
    );
  }

  // Generate new refresh token
  generateRefreshToken(userId) {
    return jwt.sign(
      { 
        userId,
        type: 'refresh',
        iat: Math.floor(Date.now() / 1000)
      },
      this.jwtRefreshSecret,
      { expiresIn: '7d' }
    );
  }

  // Blacklist token
  async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      const exp = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (exp > 0) {
        const redis = require('../config/redis');
        const redisClient = await redis();
        
        await redisClient.set(`blacklist:${token}`, 'true', exp);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error blacklisting token:', error);
      return false;
    }
  }

  // Update user online status
  async updateOnlineStatus(userId, isOnline) {
    try {
      await User.findByIdAndUpdate(userId, {
        isOnline,
        lastSeen: new Date()
      });
    } catch (error) {
      logger.error('Error updating online status:', error);
    }
  }

  // Middleware to update online status on disconnect
  handleDisconnect = async (userId) => {
    if (userId) {
      await this.updateOnlineStatus(userId, false);
    }
  };

  // Validate user session
  async validateSession(userId, sessionId) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const session = await redisClient.getUserSession(userId);
      return session && session.sessionId === sessionId;
    } catch (error) {
      logger.error('Error validating session:', error);
      return false;
    }
  }

  // Create user session
  async createSession(userId, sessionData) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      const sessionId = require('crypto').randomBytes(32).toString('hex');
      const session = {
        sessionId,
        userId,
        createdAt: new Date(),
        ...sessionData
      };
      
      await redisClient.setUserSession(userId, session);
      return sessionId;
    } catch (error) {
      logger.error('Error creating session:', error);
      return null;
    }
  }

  // Destroy user session
  async destroySession(userId) {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      
      await redisClient.removeUserSession(userId);
      return true;
    } catch (error) {
      logger.error('Error destroying session:', error);
      return false;
    }
  }
}

// Create singleton instance
const authMiddleware = new AuthMiddleware();

module.exports = authMiddleware;