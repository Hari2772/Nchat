const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },

  // Authentication
  password: {
    type: String,
    minlength: 8,
    select: false // Don't include password in queries by default
  },
  googleId: {
    type: String,
    sparse: true,
    index: true
  },
  googlePicture: {
    type: String,
    default: null
  },
  emailVerified: {
    type: Boolean,
    default: false
  },

  // Location (Privacy-first approach)
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
      index: '2dsphere'
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    },
    privacyLevel: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    }
  },
  city: {
    type: String,
    default: ''
  },
  country: {
    type: String,
    default: ''
  },

  // Activity & Status
  lastSeen: {
    type: Date,
    default: Date.now,
    index: true
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'banned', 'deleted'],
    default: 'active'
  },

  // Streak Information
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
  totalDaysActive: {
    type: Number,
    default: 0,
    min: 0
  },
  streakRewards: {
    bronze: { type: Boolean, default: false },
    silver: { type: Boolean, default: false },
    gold: { type: Boolean, default: false },
    platinum: { type: Boolean, default: false }
  },

  // Friend System
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],

  // Privacy Settings
  privacySettings: {
    showLocation: {
      type: Boolean,
      default: true
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    allowFriendRequests: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: Boolean,
      default: true
    },
    showInNearby: {
      type: Boolean,
      default: true
    }
  },

  // Preferences
  preferences: {
    language: {
      type: String,
      default: 'en',
      enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark', 'auto']
    },
    notifications: {
      messages: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      stories: { type: Boolean, default: true },
      streaks: { type: Boolean, default: true }
    }
  },

  // Statistics
  stats: {
    messagesSent: { type: Number, default: 0 },
    messagesReceived: { type: Number, default: 0 },
    storiesPosted: { type: Number, default: 0 },
    friendsCount: { type: Number, default: 0 },
    profileViews: { type: Number, default: 0 }
  },

  // Admin & Roles
  role: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },

  // Verification
  verificationToken: String,
  verificationTokenExpires: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,

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

// Indexes for optimal performance
userSchema.index({ location: '2dsphere' });
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });
userSchema.index({ username: 1 });
userSchema.index({ lastSeen: -1 });
userSchema.index({ currentStreak: -1 });
userSchema.index({ 'friendRequests.from': 1 });
userSchema.index({ status: 1 });

// Virtual for friend count
userSchema.virtual('friendCount').get(function() {
  return this.friends ? this.friends.length : 0;
});

// Virtual for pending friend requests count
userSchema.virtual('pendingFriendRequestsCount').get(function() {
  return this.friendRequests ? 
    this.friendRequests.filter(req => req.status === 'pending').length : 0;
});

// Pre-save middleware
userSchema.pre('save', async function(next) {
  try {
    // Hash password if modified
    if (this.isModified('password') && this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }

    // Update stats
    if (this.friends) {
      this.stats.friendsCount = this.friends.length;
    }

    // Update timestamps
    this.updatedAt = new Date();

    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

userSchema.methods.updateLocation = function(longitude, latitude, privacyLevel = 'friends') {
  this.location.coordinates = [longitude, latitude];
  this.location.lastUpdated = new Date();
  this.location.privacyLevel = privacyLevel;
  this.lastSeen = new Date();
  return this.save();
};

userSchema.methods.addFriend = async function(friendId) {
  if (!this.friends.includes(friendId)) {
    this.friends.push(friendId);
    this.stats.friendsCount = this.friends.length;
    await this.save();
  }
  return this;
};

userSchema.methods.removeFriend = async function(friendId) {
  this.friends = this.friends.filter(id => !id.equals(friendId));
  this.stats.friendsCount = this.friends.length;
  await this.save();
  return this;
};

userSchema.methods.blockUser = async function(userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    await this.save();
  }
  return this;
};

userSchema.methods.unblockUser = async function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => !id.equals(userId));
  await this.save();
  return this;
};

userSchema.methods.sendFriendRequest = async function(toUserId) {
  const User = mongoose.model('User');
  const targetUser = await User.findById(toUserId);
  
  if (!targetUser) {
    throw new Error('User not found');
  }

  // Check if request already exists
  const existingRequest = targetUser.friendRequests.find(
    req => req.from.equals(this._id) && req.status === 'pending'
  );

  if (existingRequest) {
    throw new Error('Friend request already sent');
  }

  targetUser.friendRequests.push({
    from: this._id,
    status: 'pending'
  });

  await targetUser.save();
  return targetUser;
};

userSchema.methods.acceptFriendRequest = async function(fromUserId) {
  const request = this.friendRequests.find(
    req => req.from.equals(fromUserId) && req.status === 'pending'
  );

  if (!request) {
    throw new Error('Friend request not found');
  }

  request.status = 'accepted';
  
  // Add to friends list
  await this.addFriend(fromUserId);
  
  // Add this user to the other user's friends list
  const User = mongoose.model('User');
  const fromUser = await User.findById(fromUserId);
  await fromUser.addFriend(this._id);

  await this.save();
  return this;
};

userSchema.methods.rejectFriendRequest = async function(fromUserId) {
  const request = this.friendRequests.find(
    req => req.from.equals(fromUserId) && req.status === 'pending'
  );

  if (!request) {
    throw new Error('Friend request not found');
  }

  request.status = 'rejected';
  await this.save();
  return this;
};

userSchema.methods.updateStreak = async function(days) {
  this.currentStreak = days;
  if (days > this.longestStreak) {
    this.longestStreak = days;
  }
  this.totalDaysActive += 1;

  // Update streak rewards
  if (days >= 7 && !this.streakRewards.bronze) {
    this.streakRewards.bronze = true;
  }
  if (days >= 30 && !this.streakRewards.silver) {
    this.streakRewards.silver = true;
  }
  if (days >= 100 && !this.streakRewards.gold) {
    this.streakRewards.gold = true;
  }
  if (days >= 365 && !this.streakRewards.platinum) {
    this.streakRewards.platinum = true;
  }

  await this.save();
  return this;
};

// Static methods
userSchema.statics.findNearbyUsers = async function(userId, maxDistance = 50000) {
  const user = await this.findById(userId);
  if (!user || !user.location.coordinates) {
    throw new Error('User location not available');
  }

  return this.find({
    _id: { $ne: userId },
    status: 'active',
    'privacySettings.showInNearby': true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: user.location.coordinates
        },
        $maxDistance: maxDistance
      }
    }
  })
  .select('username displayName profilePicture location lastSeen currentStreak')
  .limit(100);
};

userSchema.statics.findByDistance = async function(coordinates, maxDistance, userId = null) {
  const query = {
    status: 'active',
    'privacySettings.showInNearby': true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    }
  };

  if (userId) {
    query._id = { $ne: userId };
  }

  return this.find(query)
    .select('username displayName profilePicture location lastSeen currentStreak')
    .limit(100);
};

userSchema.statics.searchUsers = async function(searchTerm, userId = null) {
  const query = {
    status: 'active',
    $or: [
      { username: { $regex: searchTerm, $options: 'i' } },
      { displayName: { $regex: searchTerm, $options: 'i' } }
    ]
  };

  if (userId) {
    query._id = { $ne: userId };
  }

  return this.find(query)
    .select('username displayName profilePicture currentStreak')
    .limit(50);
};

module.exports = mongoose.model('User', userSchema);