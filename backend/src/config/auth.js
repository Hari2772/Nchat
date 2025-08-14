const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const logger = require('../utils/logger');

class AuthService {
  constructor() {
    this.googleClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  }

  // Generate JWT token
  generateToken(userId, expiresIn = '24h') {
    try {
      return jwt.sign(
        { 
          userId,
          type: 'access',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn }
      );
    } catch (error) {
      logger.error('Error generating JWT token:', error);
      throw error;
    }
  }

  // Generate refresh token
  generateRefreshToken(userId, expiresIn = '7d') {
    try {
      return jwt.sign(
        { 
          userId,
          type: 'refresh',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtRefreshSecret,
        { expiresIn }
      );
    } catch (error) {
      logger.error('Error generating refresh token:', error);
      throw error;
    }
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      logger.error('Error verifying JWT token:', error);
      throw error;
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, this.jwtRefreshSecret);
    } catch (error) {
      logger.error('Error verifying refresh token:', error);
      throw error;
    }
  }

  // Hash password
  async hashPassword(password) {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      logger.error('Error hashing password:', error);
      throw error;
    }
  }

  // Compare password
  async comparePassword(password, hashedPassword) {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      logger.error('Error comparing password:', error);
      throw error;
    }
  }

  // Verify Google token
  async verifyGoogleToken(token) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID
      });

      const payload = ticket.getPayload();
      
      return {
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        emailVerified: payload.email_verified
      };
    } catch (error) {
      logger.error('Error verifying Google token:', error);
      throw new Error('Invalid Google token');
    }
  }

  // Admin authentication
  async authenticateAdmin(email, password) {
    try {
      // Hardcoded admin credentials
      const adminEmail = 'ghari2772@gmail.com';
      const adminPassword = 'hari143p';

      if (email === adminEmail && password === adminPassword) {
        const adminUser = {
          _id: 'admin',
          email: adminEmail,
          username: 'admin',
          role: 'admin',
          isAdmin: true
        };

        const accessToken = this.generateToken(adminUser._id, '1h');
        const refreshToken = this.generateRefreshToken(adminUser._id, '7d');

        return {
          user: adminUser,
          accessToken,
          refreshToken
        };
      }

      throw new Error('Invalid admin credentials');
    } catch (error) {
      logger.error('Admin authentication error:', error);
      throw error;
    }
  }

  // Google OAuth authentication
  async authenticateWithGoogle(token) {
    try {
      const googleUser = await this.verifyGoogleToken(token);
      
      if (!googleUser.emailVerified) {
        throw new Error('Email not verified with Google');
      }

      // Find or create user
      let user = await User.findOne({ googleId: googleUser.googleId });

      if (!user) {
        // Check if user exists with same email
        user = await User.findOne({ email: googleUser.email });
        
        if (user) {
          // Link Google account to existing user
          user.googleId = googleUser.googleId;
          user.googlePicture = googleUser.picture;
          await user.save();
        } else {
          // Create new user
          user = new User({
            googleId: googleUser.googleId,
            email: googleUser.email,
            username: this.generateUsername(googleUser.name),
            displayName: googleUser.name,
            profilePicture: googleUser.picture,
            emailVerified: true,
            lastSeen: new Date()
          });
          await user.save();
        }
      } else {
        // Update existing user's information
        user.displayName = googleUser.name;
        user.profilePicture = googleUser.picture;
        user.lastSeen = new Date();
        await user.save();
      }

      // Generate tokens
      const accessToken = this.generateToken(user._id);
      const refreshToken = this.generateRefreshToken(user._id);

      return {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          role: user.role,
          isAdmin: user.isAdmin
        },
        accessToken,
        refreshToken
      };
    } catch (error) {
      logger.error('Google authentication error:', error);
      throw error;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = this.generateToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      return {
        user: {
          _id: user._id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          profilePicture: user.profilePicture,
          role: user.role,
          isAdmin: user.isAdmin
        },
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  // Generate unique username
  generateUsername(name) {
    const baseUsername = name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '')
      .substring(0, 15);
    
    const timestamp = Date.now().toString().slice(-4);
    return `${baseUsername}${timestamp}`;
  }

  // Validate password strength
  validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength) {
      throw new Error('Password must be at least 8 characters long');
    }
    if (!hasUpperCase) {
      throw new Error('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
      throw new Error('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
      throw new Error('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
      throw new Error('Password must contain at least one special character');
    }

    return true;
  }

  // Generate password reset token
  generatePasswordResetToken(userId) {
    try {
      return jwt.sign(
        { 
          userId,
          type: 'password_reset',
          iat: Math.floor(Date.now() / 1000)
        },
        this.jwtSecret,
        { expiresIn: '1h' }
      );
    } catch (error) {
      logger.error('Error generating password reset token:', error);
      throw error;
    }
  }

  // Verify password reset token
  verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }

      return decoded;
    } catch (error) {
      logger.error('Error verifying password reset token:', error);
      throw error;
    }
  }

  // Logout (blacklist token)
  async logout(userId, token) {
    try {
      // Add token to blacklist in Redis
      const redis = require('./redis');
      const redisClient = await redis();
      
      const decoded = this.verifyToken(token);
      const exp = decoded.exp - Math.floor(Date.now() / 1000);
      
      if (exp > 0) {
        await redisClient.set(`blacklist:${token}`, 'true', exp);
      }

      // Remove user session
      await redisClient.removeUserSession(userId);

      return true;
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  // Check if token is blacklisted
  async isTokenBlacklisted(token) {
    try {
      const redis = require('./redis');
      const redisClient = await redis();
      
      return await redisClient.exists(`blacklist:${token}`);
    } catch (error) {
      logger.error('Token blacklist check error:', error);
      return false;
    }
  }
}

module.exports = new AuthService();