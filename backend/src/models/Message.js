const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  // Conversation reference
  conversationId: {
    type: String,
    required: true,
    index: true
  },
  
  // Sender and recipient
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Message content
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'location', 'file', 'sticker', 'gif'],
    default: 'text'
  },
  
  content: {
    text: {
      type: String,
      maxlength: 2000,
      trim: true
    },
    mediaUrl: {
      type: String,
      trim: true
    },
    mediaType: {
      type: String,
      enum: ['image', 'video', 'audio', 'file']
    },
    thumbnailUrl: {
      type: String,
      trim: true
    },
    fileSize: {
      type: Number, // File size in bytes
      min: 0
    },
    duration: {
      type: Number, // Duration in seconds for audio/video
      min: 0
    },
    fileName: {
      type: String,
      trim: true
    },
    mimeType: {
      type: String,
      trim: true
    }
  },
  
  // Location data
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    },
    address: {
      type: String,
      default: ''
    },
    placeName: {
      type: String,
      default: ''
    }
  },
  
  // Message status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read status
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Delivery status
  deliveredTo: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Message metadata
  metadata: {
    isEdited: {
      type: Boolean,
      default: false
    },
    editedAt: {
      type: Date,
      default: null
    },
    editHistory: [{
      text: String,
      editedAt: {
        type: Date,
        default: Date.now
      }
    }],
    isForwarded: {
      type: Boolean,
      default: false
    },
    originalMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    isReply: {
      type: Boolean,
      default: false
    },
    replyToMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    replyToMessage: {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      content: {
        text: String,
        type: String
      }
    }
  },
  
  // Reactions
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
  
  // Encryption and security
  encryption: {
    isEncrypted: {
      type: Boolean,
      default: false
    },
    encryptionKey: {
      type: String,
      default: null
    },
    encryptionMethod: {
      type: String,
      enum: ['AES-256', 'ChaCha20'],
      default: 'AES-256'
    }
  },
  
  // Privacy settings
  privacy: {
    isEphemeral: {
      type: Boolean,
      default: false
    },
    expiresAt: {
      type: Date,
      default: null
    },
    isSelfDestruct: {
      type: Boolean,
      default: false
    },
    selfDestructAfter: {
      type: Number, // Seconds after being read
      default: null
    }
  },
  
  // Message flags
  flags: {
    isSpam: {
      type: Boolean,
      default: false
    },
    isReported: {
      type: Boolean,
      default: false
    },
    reportReason: {
      type: String,
      enum: ['spam', 'inappropriate', 'harassment', 'fake_news', 'other'],
      default: null
    },
    isModerated: {
      type: Boolean,
      default: false
    },
    moderationAction: {
      type: String,
      enum: ['warned', 'hidden', 'deleted'],
      default: null
    }
  },
  
  // WebRTC data for voice/video calls
  webrtc: {
    callId: {
      type: String,
      default: null
    },
    callType: {
      type: String,
      enum: ['voice', 'video'],
      default: null
    },
    callStatus: {
      type: String,
      enum: ['incoming', 'outgoing', 'missed', 'answered', 'ended'],
      default: null
    },
    callDuration: {
      type: Number, // Duration in seconds
      default: 0
    },
    callQuality: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent'],
      default: null
    }
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  
  // TTL for ephemeral messages
  expiresAt: {
    type: Date,
    default: null,
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimal performance
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ recipientId: 1, createdAt: -1 });
messageSchema.index({ status: 1 });
messageSchema.index({ 'readBy.userId': 1 });
messageSchema.index({ 'deliveredTo.userId': 1 });
messageSchema.index({ 'reactions.userId': 1 });
messageSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for read count
messageSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Virtual for delivery count
messageSchema.virtual('deliveryCount').get(function() {
  return this.deliveredTo ? this.deliveredTo.length : 0;
});

// Virtual for reaction count
messageSchema.virtual('reactionCount').get(function() {
  return this.reactions ? this.reactions.length : 0;
});

// Virtual for is read by specific user
messageSchema.virtual('isReadByUser').get(function() {
  return function(userId) {
    return this.readBy ? this.readBy.some(read => read.userId.equals(userId)) : false;
  };
});

// Virtual for is delivered to specific user
messageSchema.virtual('isDeliveredToUser').get(function() {
  return function(userId) {
    return this.deliveredTo ? this.deliveredTo.some(delivery => delivery.userId.equals(userId)) : false;
  };
});

// Pre-save middleware
messageSchema.pre('save', function(next) {
  // Update timestamps
  this.updatedAt = new Date();
  
  // Set TTL for ephemeral messages
  if (this.privacy.isEphemeral && !this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  
  // Set TTL for self-destruct messages
  if (this.privacy.isSelfDestruct && this.privacy.selfDestructAfter) {
    this.expiresAt = new Date(Date.now() + this.privacy.selfDestructAfter * 1000);
  }
  
  next();
});

// Instance methods
messageSchema.methods.markAsDelivered = async function(userId) {
  const existingDelivery = this.deliveredTo.find(delivery => delivery.userId.equals(userId));
  
  if (!existingDelivery) {
    this.deliveredTo.push({
      userId,
      deliveredAt: new Date()
    });
    
    if (this.status === 'sent') {
      this.status = 'delivered';
    }
    
    await this.save();
  }
  
  return this;
};

messageSchema.methods.markAsRead = async function(userId) {
  const existingRead = this.readBy.find(read => read.userId.equals(userId));
  
  if (!existingRead) {
    this.readBy.push({
      userId,
      readAt: new Date()
    });
    
    if (this.status === 'delivered') {
      this.status = 'read';
    }
    
    // Handle self-destruct messages
    if (this.privacy.isSelfDestruct && this.privacy.selfDestructAfter) {
      this.expiresAt = new Date(Date.now() + this.privacy.selfDestructAfter * 1000);
    }
    
    await this.save();
  }
  
  return this;
};

messageSchema.methods.addReaction = async function(userId, reactionType = 'like') {
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

messageSchema.methods.removeReaction = async function(userId) {
  this.reactions = this.reactions.filter(reaction => !reaction.userId.equals(userId));
  await this.save();
  return this;
};

messageSchema.methods.editMessage = async function(newText) {
  // Store original text in edit history
  if (this.content.text) {
    this.metadata.editHistory.push({
      text: this.content.text,
      editedAt: new Date()
    });
  }
  
  this.content.text = newText;
  this.metadata.isEdited = true;
  this.metadata.editedAt = new Date();
  
  await this.save();
  return this;
};

messageSchema.methods.forwardMessage = async function(newRecipientId, newConversationId) {
  const Message = mongoose.model('Message');
  
  const forwardedMessage = new Message({
    conversationId: newConversationId,
    senderId: this.senderId,
    recipientId: newRecipientId,
    type: this.type,
    content: this.content,
    location: this.location,
    metadata: {
      ...this.metadata,
      isForwarded: true,
      originalMessageId: this._id
    },
    encryption: this.encryption,
    privacy: {
      isEphemeral: false,
      isSelfDestruct: false
    }
  });
  
  await forwardedMessage.save();
  return forwardedMessage;
};

messageSchema.methods.replyToMessage = async function(replyToMessage) {
  this.metadata.isReply = true;
  this.metadata.replyToMessageId = replyToMessage._id;
  this.metadata.replyToMessage = {
    senderId: replyToMessage.senderId,
    content: {
      text: replyToMessage.content.text,
      type: replyToMessage.type
    }
  };
  
  await this.save();
  return this;
};

messageSchema.methods.reportMessage = async function(reason) {
  this.flags.isReported = true;
  this.flags.reportReason = reason;
  
  await this.save();
  return this;
};

messageSchema.methods.moderateMessage = async function(action) {
  this.flags.isModerated = true;
  this.flags.moderationAction = action;
  
  if (action === 'deleted') {
    this.status = 'deleted';
  }
  
  await this.save();
  return this;
};

// Static methods
messageSchema.statics.getConversationMessages = async function(conversationId, limit = 50, offset = 0) {
  return this.find({ conversationId })
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .populate('metadata.replyToMessage.senderId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .skip(offset)
    .limit(limit);
};

messageSchema.statics.getUnreadMessages = async function(userId) {
  return this.find({
    recipientId: userId,
    'readBy.userId': { $ne: userId }
  })
    .populate('senderId', 'username displayName profilePicture')
    .sort({ createdAt: -1 });
};

messageSchema.statics.getUnreadCount = async function(userId) {
  return this.countDocuments({
    recipientId: userId,
    'readBy.userId': { $ne: userId }
  });
};

messageSchema.statics.getConversationUnreadCount = async function(conversationId, userId) {
  return this.countDocuments({
    conversationId,
    recipientId: userId,
    'readBy.userId': { $ne: userId }
  });
};

messageSchema.statics.searchMessages = async function(userId, searchTerm, limit = 20) {
  return this.find({
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    'content.text': { $regex: searchTerm, $options: 'i' }
  })
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.getMediaMessages = async function(userId, mediaType = null, limit = 20) {
  const query = {
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    type: { $in: ['image', 'video', 'audio', 'file'] }
  };
  
  if (mediaType) {
    query.type = mediaType;
  }
  
  return this.find(query)
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.getLocationMessages = async function(userId, limit = 20) {
  return this.find({
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    type: 'location',
    'location.coordinates': { $exists: true, $ne: null }
  })
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.getCallHistory = async function(userId, limit = 20) {
  return this.find({
    $or: [
      { senderId: userId },
      { recipientId: userId }
    ],
    'webrtc.callId': { $exists: true, $ne: null }
  })
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.getReportedMessages = async function(limit = 50) {
  return this.find({
    'flags.isReported': true
  })
    .populate('senderId', 'username displayName profilePicture')
    .populate('recipientId', 'username displayName profilePicture')
    .sort({ createdAt: -1 })
    .limit(limit);
};

messageSchema.statics.deleteOldMessages = async function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.deleteMany({
    createdAt: { $lt: cutoffDate },
    'privacy.isEphemeral': false
  });
};

module.exports = mongoose.model('Message', messageSchema);