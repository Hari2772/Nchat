const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
  // Basic Information
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'location'],
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: 1000,
      trim: true
    },
    mediaUrl: {
      type: String,
      trim: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio']
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    duration: {
      type: Number, // Duration in seconds for video/audio
      min: 0
    },
    fileSize: {
      type: Number, // File size in bytes
      min: 0
    }
  },

  // Location Information
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
    address: {
      type: String,
      default: ''
    },
    city: {
      type: String,
      default: ''
    },
    country: {
      type: String,
      default: ''
    }
  },

  // Privacy & Visibility
  visibility: {
    type: String,
    enum: ['public', 'friends', 'nearby', 'private'],
    default: 'nearby'
  },
  maxDistance: {
    type: Number,
    default: 50000, // 50km default
    min: 1000, // 1km minimum
    max: 1000000 // 1000km maximum
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  allowReactions: {
    type: Boolean,
    default: true
  },

  // Engagement
  views: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    viewDuration: {
      type: Number, // Duration viewed in seconds
      default: 0
    }
  }],
  reactions: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    type: {
      type: String,
      enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'],
      default: 'like'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: {
      type: String,
      maxlength: 500,
      required: true,
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date
    }
  }],

  // Live Broadcasting
  isLive: {
    type: Boolean,
    default: false
  },
  liveStream: {
    streamKey: {
      type: String,
      default: null
    },
    streamUrl: {
      type: String,
      default: null
    },
    startedAt: {
      type: Date,
      default: null
    },
    endedAt: {
      type: Date,
      default: null
    },
    viewerCount: {
      type: Number,
      default: 0
    },
    maxViewers: {
      type: Number,
      default: 0
    }
  },

  // Monetization
  monetization: {
    hasAds: {
      type: Boolean,
      default: false
    },
    adFrequency: {
      type: Number, // Ads every X minutes
      default: 5,
      min: 1,
      max: 30
    },
    lastAdTime: {
      type: Date,
      default: null
    },
    totalAdViews: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },

  // Metadata
  tags: [{
    type: String,
    trim: true,
    maxlength: 20
  }],
  mentions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  hashtags: [{
    type: String,
    trim: true,
    maxlength: 30
  }],

  // Statistics
  stats: {
    viewCount: {
      type: Number,
      default: 0
    },
    uniqueViewers: {
      type: Number,
      default: 0
    },
    reactionCount: {
      type: Number,
      default: 0
    },
    commentCount: {
      type: Number,
      default: 0
    },
    shareCount: {
      type: Number,
      default: 0
    },
    engagementRate: {
      type: Number,
      default: 0
    }
  },

  // Status
  status: {
    type: String,
    enum: ['active', 'paused', 'ended', 'deleted'],
    default: 'active'
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // 24 hours TTL
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
storySchema.index({ location: '2dsphere' });
storySchema.index({ userId: 1, createdAt: -1 });
storySchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours TTL
storySchema.index({ visibility: 1 });
storySchema.index({ isLive: 1 });
storySchema.index({ tags: 1 });
storySchema.index({ hashtags: 1 });
storySchema.index({ 'reactions.userId': 1 });
storySchema.index({ 'views.userId': 1 });

// Virtual for view count
storySchema.virtual('viewCount').get(function() {
  return this.views ? this.views.length : 0;
});

// Virtual for reaction count
storySchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for comment count
storySchema.virtual('commentCount').get(function() {
  return this.comments ? this.comments.length : 0;
});

// Virtual for unique viewers count
storySchema.virtual('uniqueViewerCount').get(function() {
  if (!this.views) return 0;
  const uniqueUserIds = new Set(this.views.map(view => view.userId.toString()));
  return uniqueUserIds.size;
});

// Pre-save middleware
storySchema.pre('save', function(next) {
  // Update stats
  this.stats.viewCount = this.views ? this.views.length : 0;
  this.stats.reactionCount = this.reactions ? this.reactions.length : 0;
  this.stats.commentCount = this.comments ? this.comments.length : 0;
  
  // Calculate unique viewers
  if (this.views) {
    const uniqueUserIds = new Set(this.views.map(view => view.userId.toString()));
    this.stats.uniqueViewers = uniqueUserIds.size;
  }

  // Calculate engagement rate
  if (this.stats.viewCount > 0) {
    this.stats.engagementRate = ((this.stats.reactionCount + this.stats.commentCount) / this.stats.viewCount) * 100;
  }

  // Update timestamps
  this.updatedAt = new Date();

  next();
});

// Instance methods
storySchema.methods.addView = async function(userId, viewDuration = 0) {
  // Check if user already viewed
  const existingView = this.views.find(view => view.userId.equals(userId));
  
  if (existingView) {
    // Update existing view
    existingView.viewedAt = new Date();
    existingView.viewDuration += viewDuration;
  } else {
    // Add new view
    this.views.push({
      userId,
      viewedAt: new Date(),
      viewDuration
    });
  }

  await this.save();
  return this;
};

storySchema.methods.addReaction = async function(userId, reactionType = 'like') {
  // Remove existing reaction from same user
  this.reactions = this.reactions.filter(reaction => !reaction.userId.equals(userId));
  
  // Add new reaction
  this.reactions.push({
    userId,
    type: reactionType,
    createdAt: new Date()
  });

  await this.save();
  return this;
};

storySchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(reaction => !reaction.userId.equals(userId));
  await this.save();
  return this;
};

storySchema.methods.addComment = async function(userId, text) {
  this.comments.push({
    userId,
    text,
    createdAt: new Date()
  });

  await this.save();
  return this;
};

storySchema.methods.editComment = async function(commentId, userId, newText) {
  const comment = this.comments.find(c => c._id.equals(commentId) && c.userId.equals(userId));
  
  if (!comment) {
    throw new Error('Comment not found or unauthorized');
  }

  comment.text = newText;
  comment.isEdited = true;
  comment.editedAt = new Date();

  await this.save();
  return this;
};

storySchema.methods.deleteComment = async function(commentId, userId) {
  const comment = this.comments.find(c => c._id.equals(commentId) && c.userId.equals(userId));
  
  if (!comment) {
    throw new Error('Comment not found or unauthorized');
  }

  this.comments = this.comments.filter(c => !c._id.equals(commentId));
  await this.save();
  return this;
};

storySchema.methods.startLiveStream = async function(streamKey, streamUrl) {
  this.isLive = true;
  this.liveStream.streamKey = streamKey;
  this.liveStream.streamUrl = streamUrl;
  this.liveStream.startedAt = new Date();
  this.liveStream.viewerCount = 0;
  this.liveStream.maxViewers = 0;

  await this.save();
  return this;
};

storySchema.methods.endLiveStream = async function() {
  this.isLive = false;
  this.liveStream.endedAt = new Date();
  this.status = 'ended';

  await this.save();
  return this;
};

storySchema.methods.updateViewerCount = async function(count) {
  this.liveStream.viewerCount = count;
  if (count > this.liveStream.maxViewers) {
    this.liveStream.maxViewers = count;
  }

  await this.save();
  return this;
};

storySchema.methods.addAdView = async function() {
  this.monetization.totalAdViews += 1;
  this.monetization.lastAdTime = new Date();
  
  // Calculate revenue (example: $0.01 per ad view)
  this.monetization.revenue += 0.01;

  await this.save();
  return this;
};

storySchema.methods.addTag = async function(tag) {
  if (!this.tags.includes(tag)) {
    this.tags.push(tag);
    await this.save();
  }
  return this;
};

storySchema.methods.addHashtag = async function(hashtag) {
  if (!this.hashtags.includes(hashtag)) {
    this.hashtags.push(hashtag);
    await this.save();
  }
  return this;
};

storySchema.methods.addMention = async function(userId) {
  if (!this.mentions.includes(userId)) {
    this.mentions.push(userId);
    await this.save();
  }
  return this;
};

// Static methods
storySchema.statics.findNearbyStories = async function(coordinates, maxDistance = 50000, userId = null) {
  const query = {
    status: 'active',
    visibility: { $in: ['public', 'nearby'] },
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
    // Include stories from friends
    const User = mongoose.model('User');
    const user = await User.findById(userId).populate('friends');
    const friendIds = user.friends.map(friend => friend._id);
    
    query.$or = [
      { userId: { $in: friendIds } },
      { visibility: 'nearby' }
    ];
  }

  return this.find(query)
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);
};

storySchema.statics.findByUser = async function(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({ userId, status: 'active' })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

storySchema.statics.findLiveStreams = async function(coordinates = null, maxDistance = 100000) {
  const query = {
    isLive: true,
    status: 'active'
  };

  if (coordinates) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    };
  }

  return this.find(query)
    .populate('userId', 'username displayName profilePicture')
    .sort({ 'liveStream.startedAt': -1 })
    .limit(20);
};

storySchema.statics.findByTags = async function(tags, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    tags: { $in: tags },
    status: 'active'
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

storySchema.statics.findByHashtags = async function(hashtags, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  return this.find({
    hashtags: { $in: hashtags },
    status: 'active'
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

storySchema.statics.getTrendingStories = async function(hours = 24, limit = 20) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffTime },
        status: 'active'
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: [{ $size: '$views' }, 1] },
            { $multiply: [{ $size: '$reactions' }, 2] },
            { $multiply: [{ $size: '$comments' }, 3] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
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
        'user.email': 0
      }
    }
  ]);
};

storySchema.statics.findFriendsStories = async function(userId) {
  const User = mongoose.model('User');
  const user = await User.findById(userId).populate('friends');
  
  if (!user || !user.friends.length) {
    return [];
  }

  const friendIds = user.friends.map(friend => friend._id);
  
  return this.find({
    userId: { $in: friendIds },
    status: 'active',
    visibility: { $in: ['public', 'friends'] }
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(50);
};

storySchema.statics.findLiveStories = async function(coordinates = null, maxDistance = 50000) {
  const query = {
    status: 'active',
    isLive: true
  };

  if (coordinates) {
    query.location = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: coordinates
        },
        $maxDistance: maxDistance
      }
    };
  }

  return this.find(query)
    .populate('userId', 'username displayName profilePicture')
    .sort({ 'liveStream.startedAt': -1 })
    .limit(20);
};

storySchema.statics.findByTags = async function(tags, limit = 20) {
  return this.find({
    status: 'active',
    tags: { $in: tags }
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

storySchema.statics.findByHashtags = async function(hashtags, limit = 20) {
  return this.find({
    status: 'active',
    hashtags: { $in: hashtags }
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

storySchema.statics.getTrendingStories = async function(hours = 24, limit = 20) {
  const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: cutoffTime }
      }
    },
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $multiply: ['$stats.viewCount', 1] },
            { $multiply: ['$stats.reactionCount', 3] },
            { $multiply: ['$stats.commentCount', 5] }
          ]
        }
      }
    },
    {
      $sort: { engagementScore: -1 }
    },
    {
      $limit: limit
    },
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
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

storySchema.statics.getUserStories = async function(userId, limit = 20) {
  return this.find({
    userId,
    status: 'active'
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

storySchema.statics.searchStories = async function(searchTerm, limit = 20) {
  return this.find({
    status: 'active',
    $or: [
      { 'content.text': { $regex: searchTerm, $options: 'i' } },
      { tags: { $in: [new RegExp(searchTerm, 'i')] } },
      { hashtags: { $in: [new RegExp(searchTerm, 'i')] } }
    ]
  })
    .populate('userId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

module.exports = mongoose.model('Story', storySchema);