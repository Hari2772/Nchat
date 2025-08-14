const mongoose = require('mongoose');

const friendSchema = new mongoose.Schema({
  // User who initiated the friendship
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // User who is the friend
  friendId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Friendship status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'blocked'],
    default: 'pending'
  },
  
  // Request details
  requestDetails: {
    sentAt: {
      type: Date,
      default: Date.now
    },
    respondedAt: {
      type: Date,
      default: null
    },
    message: {
      type: String,
      maxlength: 200,
      default: ''
    }
  },
  
  // Friendship metadata
  metadata: {
    mutualFriends: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    mutualFriendsCount: {
      type: Number,
      default: 0
    },
    commonInterests: [{
      type: String,
      trim: true
    }],
    friendshipStrength: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    lastInteraction: {
      type: Date,
      default: null
    },
    interactionCount: {
      type: Number,
      default: 0
    }
  },
  
  // Privacy settings
  privacy: {
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    showLastSeen: {
      type: Boolean,
      default: true
    },
    showProfilePicture: {
      type: Boolean,
      default: true
    },
    allowMessages: {
      type: Boolean,
      default: true
    },
    allowStories: {
      type: Boolean,
      default: true
    },
    allowLocation: {
      type: Boolean,
      default: true
    }
  },
  
  // Friendship statistics
  stats: {
    messagesSent: {
      type: Number,
      default: 0
    },
    messagesReceived: {
      type: Number,
      default: 0
    },
    storiesViewed: {
      type: Number,
      default: 0
    },
    reactionsGiven: {
      type: Number,
      default: 0
    },
    reactionsReceived: {
      type: Number,
      default: 0
    },
    callsMade: {
      type: Number,
      default: 0
    },
    callsReceived: {
      type: Number,
      default: 0
    },
    totalCallDuration: {
      type: Number, // Duration in seconds
      default: 0
    }
  },
  
  // Friendship milestones
  milestones: {
    firstMessage: {
      type: Date,
      default: null
    },
    firstStory: {
      type: Date,
      default: null
    },
    firstReaction: {
      type: Date,
      default: null
    },
    firstCall: {
      type: Date,
      default: null
    },
    firstLocationShare: {
      type: Date,
      default: null
    }
  },
  
  // Blocking information
  blocking: {
    blockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    blockedAt: {
      type: Date,
      default: null
    },
    blockReason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'fake_profile', 'other'],
      default: null
    },
    blockMessage: {
      type: String,
      maxlength: 500,
      default: ''
    }
  },
  
  // Friendship tags and notes
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  notes: {
    type: String,
    maxlength: 500,
    default: ''
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

// Compound unique index for user-friend pairs
friendSchema.index({ userId: 1, friendId: 1 }, { unique: true });

// Indexes for performance
friendSchema.index({ userId: 1, status: 1 });
friendSchema.index({ friendId: 1, status: 1 });
friendSchema.index({ status: 1 });
friendSchema.index({ 'requestDetails.sentAt': -1 });
friendSchema.index({ 'metadata.lastInteraction': -1 });
friendSchema.index({ 'blocking.blockedBy': 1 });

// Virtual for friendship duration
friendSchema.virtual('friendshipDuration').get(function() {
  if (this.status === 'accepted') {
    const respondedAt = this.requestDetails.respondedAt || this.createdAt;
    return Math.floor((Date.now() - respondedAt.getTime()) / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for total interactions
friendSchema.virtual('totalInteractions').get(function() {
  const stats = this.stats;
  return (
    stats.messagesSent + stats.messagesReceived +
    stats.storiesViewed + stats.reactionsGiven + stats.reactionsReceived +
    stats.callsMade + stats.callsReceived
  );
});

// Virtual for friendship strength score
friendSchema.virtual('friendshipStrengthScore').get(function() {
  const stats = this.stats;
  const interactions = this.totalInteractions;
  const duration = this.friendshipDuration;
  
  // Base score from interactions
  let score = Math.min(interactions * 2, 50);
  
  // Bonus for duration
  score += Math.min(duration * 0.5, 20);
  
  // Bonus for calls
  score += Math.min((stats.callsMade + stats.callsReceived) * 5, 20);
  
  // Bonus for mutual friends
  score += Math.min(this.metadata.mutualFriendsCount * 2, 10);
  
  return Math.min(score, 100);
});

// Pre-save middleware
friendSchema.pre('save', function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Update friendship strength
  this.metadata.friendshipStrength = this.friendshipStrengthScore;
  
  // Update last interaction if stats changed
  if (this.isModified('stats')) {
    this.metadata.lastInteraction = new Date();
    this.metadata.interactionCount = this.totalInteractions;
  }
  
  next();
});

// Instance methods
friendSchema.methods.acceptRequest = async function() {
  this.status = 'accepted';
  this.requestDetails.respondedAt = new Date();
  
  // Create reverse friendship record
  const Friend = mongoose.model('Friend');
  const reverseFriendship = await Friend.findOne({
    userId: this.friendId,
    friendId: this.userId
  });
  
  if (!reverseFriendship) {
    const newReverseFriendship = new Friend({
      userId: this.friendId,
      friendId: this.userId,
      status: 'accepted',
      requestDetails: {
        sentAt: this.requestDetails.sentAt,
        respondedAt: new Date()
      }
    });
    await newReverseFriendship.save();
  } else {
    reverseFriendship.status = 'accepted';
    reverseFriendship.requestDetails.respondedAt = new Date();
    await reverseFriendship.save();
  }
  
  await this.save();
  return this;
};

friendSchema.methods.rejectRequest = async function() {
  this.status = 'rejected';
  this.requestDetails.respondedAt = new Date();
  
  // Create reverse friendship record
  const Friend = mongoose.model('Friend');
  const reverseFriendship = await Friend.findOne({
    userId: this.friendId,
    friendId: this.userId
  });
  
  if (!reverseFriendship) {
    const newReverseFriendship = new Friend({
      userId: this.friendId,
      friendId: this.userId,
      status: 'rejected',
      requestDetails: {
        sentAt: this.requestDetails.sentAt,
        respondedAt: new Date()
      }
    });
    await newReverseFriendship.save();
  } else {
    reverseFriendship.status = 'rejected';
    reverseFriendship.requestDetails.respondedAt = new Date();
    await reverseFriendship.save();
  }
  
  await this.save();
  return this;
};

friendSchema.methods.blockUser = async function(blockedBy, reason = null, message = '') {
  this.status = 'blocked';
  this.blocking.blockedBy = blockedBy;
  this.blocking.blockedAt = new Date();
  this.blocking.blockReason = reason;
  this.blocking.blockMessage = message;
  
  // Create reverse friendship record
  const Friend = mongoose.model('Friend');
  const reverseFriendship = await Friend.findOne({
    userId: this.friendId,
    friendId: this.userId
  });
  
  if (!reverseFriendship) {
    const newReverseFriendship = new Friend({
      userId: this.friendId,
      friendId: this.userId,
      status: 'blocked',
      blocking: {
        blockedBy: blockedBy,
        blockedAt: new Date(),
        blockReason: reason,
        blockMessage: message
      }
    });
    await newReverseFriendship.save();
  } else {
    reverseFriendship.status = 'blocked';
    reverseFriendship.blocking.blockedBy = blockedBy;
    reverseFriendship.blocking.blockedAt = new Date();
    reverseFriendship.blocking.blockReason = reason;
    reverseFriendship.blocking.blockMessage = message;
    await reverseFriendship.save();
  }
  
  await this.save();
  return this;
};

friendSchema.methods.unblockUser = async function() {
  this.status = 'accepted';
  this.blocking.blockedBy = null;
  this.blocking.blockedAt = null;
  this.blocking.blockReason = null;
  this.blocking.blockMessage = '';
  
  // Update reverse friendship record
  const Friend = mongoose.model('Friend');
  const reverseFriendship = await Friend.findOne({
    userId: this.friendId,
    friendId: this.userId
  });
  
  if (reverseFriendship) {
    reverseFriendship.status = 'accepted';
    reverseFriendship.blocking.blockedBy = null;
    reverseFriendship.blocking.blockedAt = null;
    reverseFriendship.blocking.blockReason = null;
    reverseFriendship.blocking.blockMessage = '';
    await reverseFriendship.save();
  }
  
  await this.save();
  return this;
};

friendSchema.methods.updateStats = async function(statType, count = 1) {
  if (this.stats[statType] !== undefined) {
    this.stats[statType] += count;
  }
  
  // Update milestones
  if (this.stats[statType] === 1) {
    const milestoneMap = {
      messagesSent: 'firstMessage',
      messagesReceived: 'firstMessage',
      storiesViewed: 'firstStory',
      reactionsGiven: 'firstReaction',
      reactionsReceived: 'firstReaction',
      callsMade: 'firstCall',
      callsReceived: 'firstCall'
    };
    
    const milestoneKey = milestoneMap[statType];
    if (milestoneKey && !this.milestones[milestoneKey]) {
      this.milestones[milestoneKey] = new Date();
    }
  }
  
  await this.save();
  return this;
};

friendSchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
  return this;
};

friendSchema.methods.removeTag = async function(tag) {
  this.tags = this.tags.filter(t => t !== tag);
  await this.save();
  return this;
};

friendSchema.methods.updateNotes = async function(notes) {
  this.notes = notes;
  await this.save();
  return this;
};

// Static methods
friendSchema.statics.getFriends = async function(userId, status = 'accepted') {
  return this.find({
    userId,
    status
  })
    .populate('friendId', 'username displayName profilePicture lastSeen isOnline currentStreak')
    .sort({ 'metadata.lastInteraction': -1 });
};

friendSchema.statics.getFriendRequests = async function(userId, status = 'pending') {
  return this.find({
    friendId: userId,
    status
  })
    .populate('userId', 'username displayName profilePicture currentStreak')
    .sort({ 'requestDetails.sentAt': -1 });
};

friendSchema.statics.getMutualFriends = async function(userId1, userId2) {
  const user1Friends = await this.find({
    userId: userId1,
    status: 'accepted'
  }).select('friendId');
  
  const user2Friends = await this.find({
    userId: userId2,
    status: 'accepted'
  }).select('friendId');
  
  const user1FriendIds = user1Friends.map(f => f.friendId.toString());
  const user2FriendIds = user2Friends.map(f => f.friendId.toString());
  
  const mutualIds = user1FriendIds.filter(id => user2FriendIds.includes(id));
  
  if (mutualIds.length === 0) return [];
  
  const User = mongoose.model('User');
  return User.find({
    _id: { $in: mutualIds }
  }).select('username displayName profilePicture currentStreak');
};

friendSchema.statics.getFriendshipStatus = async function(userId1, userId2) {
  const friendship = await this.findOne({
    userId: userId1,
    friendId: userId2
  });
  
  if (!friendship) {
    return 'none';
  }
  
  return friendship.status;
};

friendSchema.statics.getBlockedUsers = async function(userId) {
  return this.find({
    userId,
    status: 'blocked'
  })
    .populate('friendId', 'username displayName profilePicture')
    .sort({ 'blocking.blockedAt': -1 });
};

friendSchema.statics.getFriendshipStats = async function(userId) {
  const stats = await this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalInteractions: { $sum: '$metadata.interactionCount' },
        avgFriendshipStrength: { $avg: '$metadata.friendshipStrength' }
      }
    }
  ]);
  
  const result = {
    accepted: 0,
    pending: 0,
    rejected: 0,
    blocked: 0,
    totalInteractions: 0,
    avgFriendshipStrength: 0
  };
  
  stats.forEach(stat => {
    result[stat._id] = stat.count;
    result.totalInteractions += stat.totalInteractions;
  });
  
  const totalFriends = result.accepted + result.pending + result.rejected + result.blocked;
  if (totalFriends > 0) {
    result.avgFriendshipStrength = Math.round(result.totalInteractions / totalFriends);
  }
  
  return result;
};

friendSchema.statics.getTopFriends = async function(userId, limit = 10) {
  return this.find({
    userId,
    status: 'accepted'
  })
    .populate('friendId', 'username displayName profilePicture currentStreak')
    .sort({ 'metadata.friendshipStrength': -1 })
    .limit(limit);
};

friendSchema.statics.searchFriends = async function(userId, searchTerm, limit = 20) {
  return this.find({
    userId,
    status: 'accepted'
  })
    .populate({
      path: 'friendId',
      match: {
        $or: [
          { username: { $regex: searchTerm, $options: 'i' } },
          { displayName: { $regex: searchTerm, $options: 'i' } }
        ]
      },
      select: 'username displayName profilePicture currentStreak'
    })
    .then(friendships => friendships.filter(f => f.friendId))
    .then(friendships => friendships.slice(0, limit));
};

module.exports = mongoose.model('Friend', friendSchema);