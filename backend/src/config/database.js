const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
    this.connection = null;
  }

  async connect() {
    try {
      if (this.isConnected) {
        logger.info('Database already connected');
        return;
      }

      const mongoUri = process.env.MONGODB_URI;
      
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      // Connection options for production
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        maxPoolSize: 100, // Maximum number of connections in the pool
        minPoolSize: 10,  // Minimum number of connections in the pool
        serverSelectionTimeoutMS: 5000, // Timeout for server selection
        socketTimeoutMS: 45000, // Socket timeout
        bufferMaxEntries: 0, // Disable mongoose buffering
        bufferCommands: false, // Disable mongoose buffering
        autoIndex: false, // Disable automatic index creation in production
        retryWrites: true,
        w: 'majority',
        readPreference: 'secondaryPreferred',
        readConcern: { level: 'majority' },
        writeConcern: { w: 'majority', j: true }
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(mongoUri, options);

      this.isConnected = true;
      logger.info('MongoDB connected successfully');

      // Setup connection event handlers
      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      mongoose.connection.on('reconnected', () => {
        logger.info('MongoDB reconnected');
        this.isConnected = true;
      });

      // Graceful shutdown
      process.on('SIGINT', async () => {
        await this.disconnect();
        process.exit(0);
      });

      // Create indexes for optimal performance
      await this.createIndexes();

      return this.connection;

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      logger.info('Creating database indexes...');

      // User collection indexes
      const User = require('../models/User');
      await User.collection.createIndex(
        { location: '2dsphere' },
        { 
          background: true,
          name: 'location_2dsphere'
        }
      );
      
      await User.collection.createIndex(
        { email: 1 },
        { 
          unique: true,
          background: true,
          name: 'email_unique'
        }
      );

      await User.collection.createIndex(
        { googleId: 1 },
        { 
          background: true,
          name: 'googleId_index'
        }
      );

      await User.collection.createIndex(
        { username: 1 },
        { 
          background: true,
          name: 'username_index'
        }
      );

      await User.collection.createIndex(
        { lastSeen: -1 },
        { 
          background: true,
          name: 'lastSeen_desc'
        }
      );

      // Story collection indexes
      const Story = require('../models/Story');
      await Story.collection.createIndex(
        { location: '2dsphere' },
        { 
          background: true,
          name: 'story_location_2dsphere'
        }
      );

      await Story.collection.createIndex(
        { createdAt: 1 },
        { 
          expireAfterSeconds: 86400, // 24 hours TTL
          background: true,
          name: 'story_ttl'
        }
      );

      await Story.collection.createIndex(
        { userId: 1, createdAt: -1 },
        { 
          background: true,
          name: 'user_stories'
        }
      );

      // Message collection indexes
      const Message = require('../models/Message');
      await Message.collection.createIndex(
        { conversationId: 1, createdAt: -1 },
        { 
          background: true,
          name: 'conversation_messages'
        }
      );

      await Message.collection.createIndex(
        { senderId: 1, createdAt: -1 },
        { 
          background: true,
          name: 'sender_messages'
        }
      );

      await Message.collection.createIndex(
        { expiresAt: 1 },
        { 
          expireAfterSeconds: 0,
          background: true,
          name: 'message_ttl'
        }
      );

      // DailyStreak collection indexes
      const DailyStreak = require('../models/DailyStreak');
      await DailyStreak.collection.createIndex(
        { userId: 1, date: 1 },
        { 
          unique: true,
          background: true,
          name: 'user_daily_streak'
        }
      );

      await DailyStreak.collection.createIndex(
        { userId: 1, currentStreak: -1 },
        { 
          background: true,
          name: 'user_streak_ranking'
        }
      );

      // Friend collection indexes
      const Friend = require('../models/Friend');
      await Friend.collection.createIndex(
        { userId: 1, friendId: 1 },
        { 
          unique: true,
          background: true,
          name: 'user_friend_unique'
        }
      );

      await Friend.collection.createIndex(
        { userId: 1, status: 1 },
        { 
          background: true,
          name: 'user_friend_status'
        }
      );

      logger.info('Database indexes created successfully');

    } catch (error) {
      logger.error('Error creating indexes:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.connection) {
        await mongoose.disconnect();
        this.isConnected = false;
        logger.info('MongoDB disconnected');
      }
    } catch (error) {
      logger.error('Error disconnecting from MongoDB:', error);
      throw error;
    }
  }

  getConnection() {
    return this.connection;
  }

  isConnected() {
    return this.isConnected;
  }
}

// Singleton instance
const databaseConnection = new DatabaseConnection();

module.exports = databaseConnection.connect.bind(databaseConnection);