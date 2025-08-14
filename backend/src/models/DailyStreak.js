const mongoose = require('mongoose');

const dailyStreakSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Date tracking
  date: {
    type: Date,
    required: true,
    index: true
  },
  
  // Activity tracking
  activities: {
    messagesSent: {
      type: Number,
      default: 0
    },
    messagesReceived: {
      type: Number,
      default: 0
    },
    storiesPosted: {
      type: Number,
      default: 0
    },
    storiesViewed: {
      type: Number,
      default: 0
    },
    friendsAdded: {
      type: Number,
      default: 0
    },
    locationUpdates: {
      type: Number,
      default: 0
    },
    liveStreams: {
      type: Number,
      default: 0
    },
    reactionsGiven: {
      type: Number,
      default: 0
    },
    commentsPosted: {
      type: Number,
      default: 0
    }
  },
  
  // Streak information
  currentStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  longestStreak: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Daily goals and achievements
  dailyGoals: {
    messagesSent: {
      type: Number,
      default: 5,
      min: 1
    },
    storiesViewed: {
      type: Number,
      default: 10,
      min: 1
    },
    friendsInteracted: {
      type: Number,
      default: 3,
      min: 1
    }
  },
  
  goalsAchieved: {
    messagesSent: {
      type: Boolean,
      default: false
    },
    storiesViewed: {
      type: Boolean,
      default: false
    },
    friendsInteracted: {
      type: Boolean,
      default: false
    }
  },
  
  // Rewards and bonuses
  rewards: {
    dailyBonus: {
      type: Boolean,
      default: false
    },
    streakBonus: {
      type: Boolean,
      default: false
    },
    milestoneBonus: {
      type: Boolean,
      default: false
    }
  },
  
  // Points and currency
  pointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  coinsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Streak milestones
  milestones: {
    week1: { type: Boolean, default: false },
    week2: { type: Boolean, default: false },
    month1: { type: Boolean, default: false },
    month3: { type: Boolean, default: false },
    month6: { type: Boolean, default: false },
    year1: { type: Boolean, default: false }
  },
  
  // Activity timestamps
  firstActivity: {
    type: Date,
    default: null
  },
  lastActivity: {
    type: Date,
    default: null
  },
  
  // Completion status
  isCompleted: {
    type: Boolean,
    default: false
  },
  
  // Metadata
  totalActiveMinutes: {
    type: Number,
    default: 0,
    min: 0
  },
  sessionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for unique daily streak per user
dailyStreakSchema.index({ userId: 1, date: 1 }, { unique: true });

// Indexes for performance
dailyStreakSchema.index({ userId: 1, currentStreak: -1 });
dailyStreakSchema.index({ date: 1 });
dailyStreakSchema.index({ isCompleted: 1 });

// Virtual for total activities
dailyStreakSchema.virtual('totalActivities').get(function() {
  const activities = this.activities;
  return Object.values(activities).reduce((sum, count) => sum + count, 0);
});

// Virtual for goals completion percentage
dailyStreakSchema.virtual('goalsCompletionPercentage').get(function() {
  const goals = Object.values(this.goalsAchieved);
  const completedGoals = goals.filter(goal => goal).length;
  return goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
});

// Virtual for total rewards earned
dailyStreakSchema.virtual('totalRewardsEarned').get(function() {
  const rewards = this.rewards;
  return Object.values(rewards).filter(reward => reward).length;
});

// Pre-save middleware
dailyStreakSchema.pre('save', function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Check if all goals are achieved
  const allGoalsAchieved = Object.values(this.goalsAchieved).every(goal => goal);
  if (allGoalsAchieved && !this.isCompleted) {
    this.isCompleted = true;
    this.pointsEarned += 100; // Bonus points for completing all goals
  }
  
  // Update streak milestones
  this.updateStreakMilestones();
  
  next();
});

// Instance methods
dailyStreakSchema.methods.addActivity = async function(activityType, count = 1) {
  if (this.activities[activityType] !== undefined) {
    this.activities[activityType] += count;
  }
  
  // Update timestamps
  if (!this.firstActivity) {
    this.firstActivity = new Date();
  }
  this.lastActivity = new Date();
  
  // Check if goals are achieved
  this.checkGoals();
  
  await this.save();
  return this;
};

dailyStreakSchema.methods.checkGoals = function() {
  // Check messages sent goal
  if (this.activities.messagesSent >= this.dailyGoals.messagesSent && !this.goalsAchieved.messagesSent) {
    this.goalsAchieved.messagesSent = true;
    this.pointsEarned += 50;
  }
  
  // Check stories viewed goal
  if (this.activities.storiesViewed >= this.dailyGoals.storiesViewed && !this.goalsAchieved.storiesViewed) {
    this.goalsAchieved.storiesViewed = true;
    this.pointsEarned += 30;
  }
  
  // Check friends interacted goal
  if (this.activities.friendsAdded >= this.dailyGoals.friendsInteracted && !this.goalsAchieved.friendsInteracted) {
    this.goalsAchieved.friendsInteracted = true;
    this.pointsEarned += 40;
  }
};

dailyStreakSchema.methods.updateStreakMilestones = function() {
  const streak = this.currentStreak;
  
  if (streak >= 7 && !this.milestones.week1) {
    this.milestones.week1 = true;
    this.pointsEarned += 200;
    this.coinsEarned += 10;
  }
  
  if (streak >= 14 && !this.milestones.week2) {
    this.milestones.week2 = true;
    this.pointsEarned += 300;
    this.coinsEarned += 15;
  }
  
  if (streak >= 30 && !this.milestones.month1) {
    this.milestones.month1 = true;
    this.pointsEarned += 500;
    this.coinsEarned += 25;
  }
  
  if (streak >= 90 && !this.milestones.month3) {
    this.milestones.month3 = true;
    this.pointsEarned += 1000;
    this.coinsEarned += 50;
  }
  
  if (streak >= 180 && !this.milestones.month6) {
    this.milestones.month6 = true;
    this.pointsEarned += 2000;
    this.coinsEarned += 100;
  }
  
  if (streak >= 365 && !this.milestones.year1) {
    this.milestones.year1 = true;
    this.pointsEarned += 5000;
    this.coinsEarned += 250;
  }
};

dailyStreakSchema.methods.addSession = async function(activeMinutes = 0) {
  this.sessionCount += 1;
  this.totalActiveMinutes += activeMinutes;
  
  // Award points for session
  this.pointsEarned += Math.floor(activeMinutes / 5); // 1 point per 5 minutes
  
  await this.save();
  return this;
};

dailyStreakSchema.methods.claimDailyBonus = async function() {
  if (!this.rewards.dailyBonus) {
    this.rewards.dailyBonus = true;
    this.pointsEarned += 100;
    this.coinsEarned += 5;
    await this.save();
  }
  return this;
};

dailyStreakSchema.methods.claimStreakBonus = async function() {
  if (!this.rewards.streakBonus && this.currentStreak >= 7) {
    this.rewards.streakBonus = true;
    this.pointsEarned += this.currentStreak * 10;
    this.coinsEarned += Math.floor(this.currentStreak / 7);
    await this.save();
  }
  return this;
};

// Static methods
dailyStreakSchema.statics.getOrCreate = async function(userId, date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  let streak = await this.findOne({
    userId,
    date: { $gte: startOfDay, $lte: endOfDay }
  });
  
  if (!streak) {
    streak = new this({
      userId,
      date: startOfDay
    });
    await streak.save();
  }
  
  return streak;
};

dailyStreakSchema.statics.getUserStreak = async function(userId) {
  const today = new Date();
  const startOfDay = new Date(today);
  startOfDay.setHours(0, 0, 0, 0);
  
  // Get today's streak
  const todayStreak = await this.getOrCreate(userId, today);
  
  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(today);
  
  while (true) {
    const startOfCheckDay = new Date(checkDate);
    startOfCheckDay.setHours(0, 0, 0, 0);
    
    const endOfCheckDay = new Date(checkDate);
    endOfCheckDay.setHours(23, 59, 59, 999);
    
    const dayStreak = await this.findOne({
      userId,
      date: { $gte: startOfCheckDay, $lte: endOfCheckDay },
      isCompleted: true
    });
    
    if (dayStreak) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return {
    todayStreak,
    currentStreak,
    longestStreak: todayStreak.longestStreak
  };
};

dailyStreakSchema.statics.getLeaderboard = async function(limit = 50) {
  return this.aggregate([
    {
      $group: {
        _id: '$userId',
        currentStreak: { $max: '$currentStreak' },
        longestStreak: { $max: '$longestStreak' },
        totalPoints: { $sum: '$pointsEarned' },
        totalCoins: { $sum: '$coinsEarned' },
        totalDaysActive: { $sum: 1 }
      }
    },
    {
      $sort: { currentStreak: -1, totalPoints: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    {
      $unwind: '$user'
    },
    {
      $project: {
        'user.password': 0,
        'user.googleId': 0
      }
    }
  ]);
};

dailyStreakSchema.statics.getWeeklyStats = async function(userId, weeks = 4) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - (weeks * 7));
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          week: { $week: '$date' }
        },
        totalPoints: { $sum: '$pointsEarned' },
        totalCoins: { $sum: '$coinsEarned' },
        totalActivities: { $sum: '$totalActivities' },
        daysCompleted: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        avgActiveMinutes: { $avg: '$totalActiveMinutes' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.week': 1 }
    }
  ]);
};

dailyStreakSchema.statics.getMonthlyStats = async function(userId, months = 12) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        totalPoints: { $sum: '$pointsEarned' },
        totalCoins: { $sum: '$coinsEarned' },
        totalActivities: { $sum: '$totalActivities' },
        daysCompleted: { $sum: { $cond: ['$isCompleted', 1, 0] } },
        avgActiveMinutes: { $avg: '$totalActiveMinutes' },
        maxStreak: { $max: '$currentStreak' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
};

module.exports = mongoose.model('DailyStreak', dailyStreakSchema);