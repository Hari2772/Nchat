const cron = require('node-cron');
const logger = require('./logger');
const User = require('../models/User');
const Story = require('../models/Story');
const Message = require('../models/Message');
const DailyStreak = require('../models/DailyStreak');
const Friend = require('../models/Friend');

class CronJobs {
  constructor() {
    this.jobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      logger.warn('Cron jobs already running');
      return;
    }

    logger.info('Starting cron jobs...');

    // Daily cleanup jobs
    this.scheduleCleanupJobs();
    
    // Analytics and reporting jobs
    this.scheduleAnalyticsJobs();
    
    // Maintenance jobs
    this.scheduleMaintenanceJobs();
    
    // Health check jobs
    this.scheduleHealthCheckJobs();
    
    // Streak management jobs
    this.scheduleStreakJobs();
    
    // Notification jobs
    this.scheduleNotificationJobs();

    this.isRunning = true;
    logger.info('Cron jobs started successfully');
  }

  stop() {
    if (!this.isRunning) {
      logger.warn('Cron jobs not running');
      return;
    }

    logger.info('Stopping cron jobs...');
    
    this.jobs.forEach((job, name) => {
      job.stop();
      logger.info(`Stopped cron job: ${name}`);
    });
    
    this.jobs.clear();
    this.isRunning = false;
    logger.info('Cron jobs stopped successfully');
  }

  scheduleCleanupJobs() {
    // Clean up expired stories (every hour)
    this.jobs.set('cleanupStories', cron.schedule('0 * * * *', async () => {
      try {
        logger.info('Starting story cleanup job');
        const startTime = Date.now();
        
        const result = await Story.deleteMany({
          createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 hours
        });
        
        const duration = Date.now() - startTime;
        logger.logCleanup('expired stories', result.deletedCount, duration);
        
      } catch (error) {
        logger.error('Story cleanup job failed:', error);
      }
    }));

    // Clean up expired messages (every 6 hours)
    this.jobs.set('cleanupMessages', cron.schedule('0 */6 * * *', async () => {
      try {
        logger.info('Starting message cleanup job');
        const startTime = Date.now();
        
        const result = await Message.deleteMany({
          'privacy.isEphemeral': true,
          expiresAt: { $lt: new Date() }
        });
        
        const duration = Date.now() - startTime;
        logger.logCleanup('expired messages', result.deletedCount, duration);
        
      } catch (error) {
        logger.error('Message cleanup job failed:', error);
      }
    }));

    // Clean up old daily streaks (every day at 2 AM)
    this.jobs.set('cleanupStreaks', cron.schedule('0 2 * * *', async () => {
      try {
        logger.info('Starting streak cleanup job');
        const startTime = Date.now();
        
        const result = await DailyStreak.deleteMany({
          date: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days
        });
        
        const duration = Date.now() - startTime;
        logger.logCleanup('old streaks', result.deletedCount, duration);
        
      } catch (error) {
        logger.error('Streak cleanup job failed:', error);
      }
    }));

    // Clean up inactive users (every week on Sunday at 3 AM)
    this.jobs.set('cleanupInactiveUsers', cron.schedule('0 3 * * 0', async () => {
      try {
        logger.info('Starting inactive user cleanup job');
        const startTime = Date.now();
        
        const cutoffDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 90 days
        
        const result = await User.updateMany(
          {
            lastSeen: { $lt: cutoffDate },
            status: 'active'
          },
          {
            $set: { status: 'inactive' }
          }
        );
        
        const duration = Date.now() - startTime;
        logger.logCleanup('inactive users', result.modifiedCount, duration);
        
      } catch (error) {
        logger.error('Inactive user cleanup job failed:', error);
      }
    }));
  }

  scheduleAnalyticsJobs() {
    // Daily analytics (every day at 1 AM)
    this.jobs.set('dailyAnalytics', cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('Starting daily analytics job');
        const startTime = Date.now();
        
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Get daily stats
        const stats = await this.generateDailyStats(yesterday);
        
        // Store analytics data (you can implement your own analytics storage)
        await this.storeAnalytics('daily', stats);
        
        const duration = Date.now() - startTime;
        logger.logPerformance('daily analytics generation', duration);
        
      } catch (error) {
        logger.error('Daily analytics job failed:', error);
      }
    }));

    // Weekly analytics (every Monday at 2 AM)
    this.jobs.set('weeklyAnalytics', cron.schedule('0 2 * * 1', async () => {
      try {
        logger.info('Starting weekly analytics job');
        const startTime = Date.now();
        
        const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        // Get weekly stats
        const stats = await this.generateWeeklyStats(lastWeek);
        
        // Store analytics data
        await this.storeAnalytics('weekly', stats);
        
        const duration = Date.now() - startTime;
        logger.logPerformance('weekly analytics generation', duration);
        
      } catch (error) {
        logger.error('Weekly analytics job failed:', error);
      }
    }));

    // Monthly analytics (first day of month at 3 AM)
    this.jobs.set('monthlyAnalytics', cron.schedule('0 3 1 * *', async () => {
      try {
        logger.info('Starting monthly analytics job');
        const startTime = Date.now();
        
        const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        // Get monthly stats
        const stats = await this.generateMonthlyStats(lastMonth);
        
        // Store analytics data
        await this.storeAnalytics('monthly', stats);
        
        const duration = Date.now() - startTime;
        logger.logPerformance('monthly analytics generation', duration);
        
      } catch (error) {
        logger.error('Monthly analytics job failed:', error);
      }
    }));
  }

  scheduleMaintenanceJobs() {
    // Database maintenance (every day at 4 AM)
    this.jobs.set('databaseMaintenance', cron.schedule('0 4 * * *', async () => {
      try {
        logger.info('Starting database maintenance job');
        const startTime = Date.now();
        
        // Update user statistics
        await this.updateUserStats();
        
        // Update friendship statistics
        await this.updateFriendshipStats();
        
        // Clean up orphaned data
        await this.cleanupOrphanedData();
        
        const duration = Date.now() - startTime;
        logger.logPerformance('database maintenance', duration);
        
      } catch (error) {
        logger.error('Database maintenance job failed:', error);
      }
    }));

    // Cache cleanup (every 4 hours)
    this.jobs.set('cacheCleanup', cron.schedule('0 */4 * * *', async () => {
      try {
        logger.info('Starting cache cleanup job');
        const startTime = Date.now();
        
        // Clean up Redis cache
        const redis = require('../config/redis');
        const redisClient = await redis();
        
        // Remove expired keys
        await redisClient.client.eval(`
          local keys = redis.call('keys', 'nearchat:*')
          local count = 0
          for i, key in ipairs(keys) do
            if redis.call('ttl', key) == -1 then
              redis.call('del', key)
              count = count + 1
            end
          end
          return count
        `, 0);
        
        const duration = Date.now() - startTime;
        logger.logCleanup('cache entries', 'unknown', duration);
        
      } catch (error) {
        logger.error('Cache cleanup job failed:', error);
      }
    }));
  }

  scheduleHealthCheckJobs() {
    // System health check (every 5 minutes)
    this.jobs.set('healthCheck', cron.schedule('*/5 * * * *', async () => {
      try {
        logger.info('Starting system health check');
        
        // Check database connection
        const dbHealth = await this.checkDatabaseHealth();
        
        // Check Redis connection
        const redisHealth = await this.checkRedisHealth();
        
        // Check system resources
        const systemHealth = this.checkSystemResources();
        
        // Log health status
        if (dbHealth && redisHealth && systemHealth) {
          logger.logSystemHealth('overall', 'healthy');
        } else {
          logger.logSystemHealth('overall', 'unhealthy', {
            database: dbHealth,
            redis: redisHealth,
            system: systemHealth
          });
        }
        
      } catch (error) {
        logger.error('Health check job failed:', error);
        logger.logSystemHealth('overall', 'error', { error: error.message });
      }
    }));
  }

  scheduleStreakJobs() {
    // Daily streak reset (every day at midnight)
    this.jobs.set('streakReset', cron.schedule('0 0 * * *', async () => {
      try {
        logger.info('Starting daily streak reset job');
        const startTime = Date.now();
        
        // Reset streaks for users who didn't complete yesterday's goals
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const usersToReset = await DailyStreak.find({
          date: {
            $gte: new Date(yesterday.setHours(0, 0, 0, 0)),
            $lt: new Date(yesterday.setHours(23, 59, 59, 999))
          },
          isCompleted: false
        });
        
        for (const streak of usersToReset) {
          const user = await User.findById(streak.userId);
          if (user && user.currentStreak > 0) {
            user.currentStreak = 0;
            await user.save();
            logger.logStreak('reset', user._id, 0);
          }
        }
        
        const duration = Date.now() - startTime;
        logger.logPerformance('streak reset', duration, { usersReset: usersToReset.length });
        
      } catch (error) {
        logger.error('Streak reset job failed:', error);
      }
    }));

    // Streak rewards check (every day at 1 AM)
    this.jobs.set('streakRewards', cron.schedule('0 1 * * *', async () => {
      try {
        logger.info('Starting streak rewards job');
        const startTime = Date.now();
        
        // Check for users who earned new streak rewards
        const users = await User.find({
          currentStreak: { $gt: 0 }
        });
        
        let rewardsGiven = 0;
        for (const user of users) {
          const newRewards = this.calculateStreakRewards(user.currentStreak);
          
          for (const [reward, earned] of Object.entries(newRewards)) {
            if (earned && !user.streakRewards[reward]) {
              user.streakRewards[reward] = true;
              rewardsGiven++;
            }
          }
          
          await user.save();
        }
        
        const duration = Date.now() - startTime;
        logger.logPerformance('streak rewards', duration, { rewardsGiven });
        
      } catch (error) {
        logger.error('Streak rewards job failed:', error);
      }
    }));
  }

  scheduleNotificationJobs() {
    // Send daily reminders (every day at 9 AM)
    this.jobs.set('dailyReminders', cron.schedule('0 9 * * *', async () => {
      try {
        logger.info('Starting daily reminders job');
        const startTime = Date.now();
        
        // Find users who haven't been active today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const inactiveUsers = await User.find({
          lastSeen: { $lt: today },
          status: 'active',
          'preferences.notifications.streaks': true
        });
        
        let notificationsSent = 0;
        for (const user of inactiveUsers) {
          try {
            await this.sendDailyReminder(user);
            notificationsSent++;
          } catch (error) {
            logger.error(`Failed to send reminder to user ${user._id}:`, error);
          }
        }
        
        const duration = Date.now() - startTime;
        logger.logNotification('daily reminders', 'batch', true, {
          sent: notificationsSent,
          total: inactiveUsers.length
        });
        
      } catch (error) {
        logger.error('Daily reminders job failed:', error);
      }
    }));

    // Send weekly summaries (every Sunday at 10 AM)
    this.jobs.set('weeklySummaries', cron.schedule('0 10 * * 0', async () => {
      try {
        logger.info('Starting weekly summaries job');
        const startTime = Date.now();
        
        const activeUsers = await User.find({
          status: 'active',
          'preferences.notifications.streaks': true
        });
        
        let summariesSent = 0;
        for (const user of activeUsers) {
          try {
            await this.sendWeeklySummary(user);
            summariesSent++;
          } catch (error) {
            logger.error(`Failed to send summary to user ${user._id}:`, error);
          }
        }
        
        const duration = Date.now() - startTime;
        logger.logNotification('weekly summaries', 'batch', true, {
          sent: summariesSent,
          total: activeUsers.length
        });
        
      } catch (error) {
        logger.error('Weekly summaries job failed:', error);
      }
    }));
  }

  // Helper methods
  async generateDailyStats(date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    const [
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      User.countDocuments({
        lastSeen: { $gte: startOfDay, $lte: endOfDay }
      }),
      Story.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      Message.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      }),
      DailyStreak.countDocuments({
        date: { $gte: startOfDay, $lte: endOfDay },
        isCompleted: true
      })
    ]);
    
    return {
      date: startOfDay,
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    };
  }

  async generateWeeklyStats(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const [
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      User.countDocuments({
        lastSeen: { $gte: startDate, $lt: endDate }
      }),
      Story.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      Message.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      DailyStreak.countDocuments({
        date: { $gte: startDate, $lt: endDate },
        isCompleted: true
      })
    ]);
    
    return {
      startDate,
      endDate,
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    };
  }

  async generateMonthlyStats(startDate) {
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);
    
    const [
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    ] = await Promise.all([
      User.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      User.countDocuments({
        lastSeen: { $gte: startDate, $lt: endDate }
      }),
      Story.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      Message.countDocuments({
        createdAt: { $gte: startDate, $lt: endDate }
      }),
      DailyStreak.countDocuments({
        date: { $gte: startDate, $lt: endDate },
        isCompleted: true
      })
    ]);
    
    return {
      startDate,
      endDate,
      newUsers,
      activeUsers,
      storiesPosted,
      messagesSent,
      streaksCompleted
    };
  }

  async storeAnalytics(type, data) {
    // Implement your analytics storage logic here
    // This could be storing to a separate analytics database,
    // sending to external analytics services, etc.
    logger.info(`Stored ${type} analytics data`, data);
  }

  async updateUserStats() {
    const users = await User.find({});
    
    for (const user of users) {
      // Update friend count
      const friendCount = await Friend.countDocuments({
        userId: user._id,
        status: 'accepted'
      });
      
      // Update pending friend requests count
      const pendingRequests = await Friend.countDocuments({
        friendId: user._id,
        status: 'pending'
      });
      
      user.stats.friendsCount = friendCount;
      user.pendingFriendRequestsCount = pendingRequests;
      
      await user.save();
    }
  }

  async updateFriendshipStats() {
    const friendships = await Friend.find({ status: 'accepted' });
    
    for (const friendship of friendships) {
      // Update mutual friends count
      const mutualFriends = await Friend.getMutualFriends(
        friendship.userId,
        friendship.friendId
      );
      
      friendship.metadata.mutualFriendsCount = mutualFriends.length;
      await friendship.save();
    }
  }

  async cleanupOrphanedData() {
    // Clean up orphaned messages
    const orphanedMessages = await Message.find({
      $or: [
        { senderId: { $exists: false } },
        { recipientId: { $exists: false } }
      ]
    });
    
    if (orphanedMessages.length > 0) {
      await Message.deleteMany({ _id: { $in: orphanedMessages.map(m => m._id) } });
      logger.info(`Cleaned up ${orphanedMessages.length} orphaned messages`);
    }
    
    // Clean up orphaned stories
    const orphanedStories = await Story.find({
      userId: { $exists: false }
    });
    
    if (orphanedStories.length > 0) {
      await Story.deleteMany({ _id: { $in: orphanedStories.map(s => s._id) } });
      logger.info(`Cleaned up ${orphanedStories.length} orphaned stories`);
    }
  }

  async checkDatabaseHealth() {
    try {
      await User.findOne().limit(1);
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  async checkRedisHealth() {
    try {
      const redis = require('../config/redis');
      const redisClient = await redis();
      await redisClient.client.ping();
      return true;
    } catch (error) {
      logger.error('Redis health check failed:', error);
      return false;
    }
  }

  checkSystemResources() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    
    // Check if memory usage is reasonable (less than 1GB)
    if (heapUsedMB > 1024) {
      logger.warn('High memory usage detected:', heapUsedMB);
      return false;
    }
    
    return true;
  }

  calculateStreakRewards(streak) {
    return {
      bronze: streak >= 7,
      silver: streak >= 30,
      gold: streak >= 100,
      platinum: streak >= 365
    };
  }

  async sendDailyReminder(user) {
    // Implement your notification logic here
    // This could be push notifications, emails, etc.
    logger.logNotification('daily reminder', user._id, true);
  }

  async sendWeeklySummary(user) {
    // Implement your notification logic here
    // This could be push notifications, emails, etc.
    logger.logNotification('weekly summary', user._id, true);
  }

  getJobStatus() {
    const status = {};
    this.jobs.forEach((job, name) => {
      status[name] = job.running;
    });
    return status;
  }
}

module.exports = new CronJobs();