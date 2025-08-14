class AppConstants {
  // Hive Box Names
  static const String userBox = 'user_box';
  static const String messageBox = 'message_box';
  static const String storyBox = 'story_box';
  static const String streakBox = 'streak_box';
  static const String settingsBox = 'settings_box';
  static const String cacheBox = 'cache_box';
  
  // API Endpoints
  static const String authEndpoint = '/auth';
  static const String userEndpoint = '/users';
  static const String storyEndpoint = '/stories';
  static const String streakEndpoint = '/streaks';
  static const String adminEndpoint = '/admin';
  
  // Storage Keys
  static const String accessTokenKey = 'access_token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';
  static const String settingsKey = 'settings';
  static const String themeKey = 'theme';
  static const String languageKey = 'language';
  static const String onboardingKey = 'onboarding_completed';
  static const String biometricKey = 'biometric_enabled';
  static const String lastLocationKey = 'last_location';
  static const String lastStreakCheckKey = 'last_streak_check';
  
  // Notification Channels
  static const String defaultChannelId = 'nearchat_default';
  static const String messageChannelId = 'nearchat_messages';
  static const String storyChannelId = 'nearchat_stories';
  static const String streakChannelId = 'nearchat_streaks';
  static const String liveChannelId = 'nearchat_live';
  
  // Notification Channel Names
  static const String defaultChannelName = 'NearChat Notifications';
  static const String messageChannelName = 'Messages';
  static const String storyChannelName = 'Stories';
  static const String streakChannelName = 'Streaks';
  static const String liveChannelName = 'Live Streams';
  
  // Notification Channel Descriptions
  static const String defaultChannelDescription = 'General notifications from NearChat';
  static const String messageChannelDescription = 'New messages and chat notifications';
  static const String storyChannelDescription = 'New stories from friends and nearby users';
  static const String streakChannelDescription = 'Daily streak reminders and achievements';
  static const String liveChannelDescription = 'Live stream notifications';
  
  // Animation Durations
  static const Duration splashDuration = Duration(seconds: 3);
  static const Duration pageTransitionDuration = Duration(milliseconds: 300);
  static const Duration buttonPressDuration = Duration(milliseconds: 100);
  static const Duration storyViewDuration = Duration(seconds: 15);
  static const Duration typingIndicatorDuration = Duration(milliseconds: 500);
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  static const Duration locationTimeout = Duration(seconds: 10);
  static const Duration imageLoadTimeout = Duration(seconds: 15);
  static const Duration videoLoadTimeout = Duration(seconds: 30);
  
  // Cache Durations
  static const Duration userCacheDuration = Duration(hours: 1);
  static const Duration storyCacheDuration = Duration(minutes: 30);
  static const Duration messageCacheDuration = Duration(hours: 24);
  static const Duration imageCacheDuration = Duration(days: 7);
  static const Duration videoCacheDuration = Duration(days: 30);
  
  // File Extensions
  static const List<String> imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  static const List<String> videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  static const List<String> audioExtensions = ['mp3', 'wav', 'aac', 'm4a', 'ogg'];
  static const List<String> documentExtensions = ['pdf', 'doc', 'docx', 'txt'];
  
  // MIME Types
  static const String imageJpeg = 'image/jpeg';
  static const String imagePng = 'image/png';
  static const String imageGif = 'image/gif';
  static const String imageWebp = 'image/webp';
  static const String videoMp4 = 'video/mp4';
  static const String videoMov = 'video/quicktime';
  static const String audioMp3 = 'audio/mpeg';
  static const String audioWav = 'audio/wav';
  static const String audioAac = 'audio/aac';
  
  // Story Types
  static const String storyTypeText = 'text';
  static const String storyTypeImage = 'image';
  static const String storyTypeVideo = 'video';
  static const String storyTypeAudio = 'audio';
  static const String storyTypeLocation = 'location';
  
  // Message Types
  static const String messageTypeText = 'text';
  static const String messageTypeImage = 'image';
  static const String messageTypeVideo = 'video';
  static const String messageTypeAudio = 'audio';
  static const String messageTypeLocation = 'location';
  static const String messageTypeFile = 'file';
  static const String messageTypeSticker = 'sticker';
  static const String messageTypeGif = 'gif';
  
  // Reaction Types
  static const String reactionLike = 'like';
  static const String reactionLove = 'love';
  static const String reactionHaha = 'haha';
  static const String reactionWow = 'wow';
  static const String reactionSad = 'sad';
  static const String reactionAngry = 'angry';
  
  // Privacy Levels
  static const String privacyPublic = 'public';
  static const String privacyFriends = 'friends';
  static const String privacyNearby = 'nearby';
  static const String privacyPrivate = 'private';
  
  // User Status
  static const String statusActive = 'active';
  static const String statusInactive = 'inactive';
  static const String statusBanned = 'banned';
  static const String statusDeleted = 'deleted';
  
  // Online Status
  static const String onlineStatusOnline = 'online';
  static const String onlineStatusOffline = 'offline';
  static const String onlineStatusAway = 'away';
  static const String onlineStatusBusy = 'busy';
  
  // Friend Request Status
  static const String friendRequestPending = 'pending';
  static const String friendRequestAccepted = 'accepted';
  static const String friendRequestRejected = 'rejected';
  
  // Streak Milestones
  static const int streakBronze = 7;
  static const int streakSilver = 30;
  static const int streakGold = 100;
  static const int streakPlatinum = 365;
  
  // Streak Colors
  static const String streakColorBronze = 'bronze';
  static const String streakColorSilver = 'silver';
  static const String streakColorGold = 'gold';
  static const String streakColorPlatinum = 'platinum';
  
  // Live Stream Status
  static const String liveStatusLive = 'live';
  static const String liveStatusEnded = 'ended';
  static const String liveStatusScheduled = 'scheduled';
  
  // Ad Types
  static const String adTypeBanner = 'banner';
  static const String adTypeInterstitial = 'interstitial';
  static const String adTypeRewarded = 'rewarded';
  static const String adTypeNative = 'native';
  
  // Error Codes
  static const String errorNetwork = 'NETWORK_ERROR';
  static const String errorServer = 'SERVER_ERROR';
  static const String errorUnauthorized = 'UNAUTHORIZED';
  static const String errorForbidden = 'FORBIDDEN';
  static const String errorNotFound = 'NOT_FOUND';
  static const String errorValidation = 'VALIDATION_ERROR';
  static const String errorRateLimit = 'RATE_LIMIT_ERROR';
  static const String errorPermission = 'PERMISSION_ERROR';
  static const String errorLocation = 'LOCATION_ERROR';
  static const String errorCamera = 'CAMERA_ERROR';
  static const String errorMicrophone = 'MICROPHONE_ERROR';
  static const String errorStorage = 'STORAGE_ERROR';
  static const String errorUnknown = 'UNKNOWN_ERROR';
  
  // Success Codes
  static const String successCreated = 'CREATED';
  static const String successUpdated = 'UPDATED';
  static const String successDeleted = 'DELETED';
  static const String successSent = 'SENT';
  static const String successPosted = 'POSTED';
  static const String successAccepted = 'ACCEPTED';
  static const String successRejected = 'REJECTED';
  static const String successBlocked = 'BLOCKED';
  static const String successUnblocked = 'UNBLOCKED';
  
  // Validation Patterns
  static const String emailPattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$';
  static const String usernamePattern = r'^[a-zA-Z0-9_]{3,20}$';
  static const String passwordPattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';
  static const String phonePattern = r'^\+?[1-9]\d{1,14}$';
  
  // Date Formats
  static const String dateFormatFull = 'yyyy-MM-dd HH:mm:ss';
  static const String dateFormatDate = 'yyyy-MM-dd';
  static const String dateFormatTime = 'HH:mm:ss';
  static const String dateFormatRelative = 'relative';
  static const String dateFormatShort = 'MMM dd';
  static const String dateFormatLong = 'MMMM dd, yyyy';
  
  // Time Formats
  static const String timeFormat12 = 'hh:mm a';
  static const String timeFormat24 = 'HH:mm';
  static const String timeFormatSeconds = 'HH:mm:ss';
  
  // Currency
  static const String defaultCurrency = 'USD';
  static const String currencySymbol = '\$';
  
  // Languages
  static const String defaultLanguage = 'en';
  static const List<String> supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
  
  // Themes
  static const String themeLight = 'light';
  static const String themeDark = 'dark';
  static const String themeAuto = 'auto';
  
  // Font Sizes
  static const double fontSizeSmall = 12.0;
  static const double fontSizeMedium = 14.0;
  static const double fontSizeLarge = 16.0;
  static const double fontSizeExtraLarge = 18.0;
  static const double fontSizeTitle = 20.0;
  static const double fontSizeHeadline = 24.0;
  
  // Icon Sizes
  static const double iconSizeSmall = 16.0;
  static const double iconSizeMedium = 24.0;
  static const double iconSizeLarge = 32.0;
  static const double iconSizeExtraLarge = 48.0;
  
  // Border Radius
  static const double radiusSmall = 4.0;
  static const double radiusMedium = 8.0;
  static const double radiusLarge = 12.0;
  static const double radiusExtraLarge = 16.0;
  static const double radiusCircular = 50.0;
  
  // Elevations
  static const double elevationNone = 0.0;
  static const double elevationSmall = 2.0;
  static const double elevationMedium = 4.0;
  static const double elevationLarge = 8.0;
  static const double elevationExtraLarge = 16.0;
  
  // Opacities
  static const double opacityNone = 0.0;
  static const double opacityLow = 0.25;
  static const double opacityMedium = 0.5;
  static const double opacityHigh = 0.75;
  static const double opacityFull = 1.0;
  
  // Aspect Ratios
  static const double aspectRatioSquare = 1.0;
  static const double aspectRatioPortrait = 3.0 / 4.0;
  static const double aspectRatioLandscape = 16.0 / 9.0;
  static const double aspectRatioWide = 21.0 / 9.0;
  
  // Animation Curves
  static const String curveLinear = 'linear';
  static const String curveEaseIn = 'easeIn';
  static const String curveEaseOut = 'easeOut';
  static const String curveEaseInOut = 'easeInOut';
  static const String curveFastOutSlowIn = 'fastOutSlowIn';
  static const String curveFastOutLinearIn = 'fastOutLinearIn';
  static const String curveLinearOutSlowIn = 'linearOutSlowIn';
  
  // Network Types
  static const String networkWifi = 'wifi';
  static const String networkMobile = 'mobile';
  static const String networkNone = 'none';
  
  // Device Types
  static const String devicePhone = 'phone';
  static const String deviceTablet = 'tablet';
  static const String deviceDesktop = 'desktop';
  
  // Platform Types
  static const String platformAndroid = 'android';
  static const String platformIOS = 'ios';
  static const String platformWeb = 'web';
  static const String platformWindows = 'windows';
  static const String platformMacOS = 'macos';
  static const String platformLinux = 'linux';
  
  // Permission Types
  static const String permissionCamera = 'camera';
  static const String permissionMicrophone = 'microphone';
  static const String permissionLocation = 'location';
  static const String permissionStorage = 'storage';
  static const String permissionNotification = 'notification';
  static const String permissionBiometric = 'biometric';
  
  // Biometric Types
  static const String biometricFingerprint = 'fingerprint';
  static const String biometricFace = 'face';
  static const String biometricIris = 'iris';
  
  // Security Levels
  static const String securityLow = 'low';
  static const String securityMedium = 'medium';
  static const String securityHigh = 'high';
  static const String securityMaximum = 'maximum';
  
  // Quality Levels
  static const String qualityLow = 'low';
  static const String qualityMedium = 'medium';
  static const String qualityHigh = 'high';
  static const String qualityUltra = 'ultra';
  
  // Compression Levels
  static const int compressionNone = 0;
  static const int compressionLow = 25;
  static const int compressionMedium = 50;
  static const int compressionHigh = 75;
  static const int compressionMaximum = 100;
  
  // Retry Attempts
  static const int maxRetryAttempts = 3;
  static const int maxRetryAttemptsAuth = 1;
  static const int maxRetryAttemptsUpload = 5;
  static const int maxRetryAttemptsDownload = 3;
  
  // Batch Sizes
  static const int batchSizeSmall = 10;
  static const int batchSizeMedium = 20;
  static const int batchSizeLarge = 50;
  static const int batchSizeExtraLarge = 100;
  
  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  static const int minPageSize = 5;
  
  // Search
  static const int maxSearchResults = 50;
  static const int minSearchQueryLength = 2;
  static const int maxSearchQueryLength = 100;
  
  // Rate Limiting
  static const int maxRequestsPerMinute = 60;
  static const int maxRequestsPerHour = 1000;
  static const int maxRequestsPerDay = 10000;
  
  // Cache Limits
  static const int maxCacheSize = 100 * 1024 * 1024; // 100MB
  static const int maxCacheEntries = 1000;
  static const int maxImageCacheSize = 50 * 1024 * 1024; // 50MB
  static const int maxVideoCacheSize = 500 * 1024 * 1024; // 500MB
  
  // File Size Limits
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxVideoSize = 50 * 1024 * 1024; // 50MB
  static const int maxAudioSize = 10 * 1024 * 1024; // 10MB
  static const int maxDocumentSize = 10 * 1024 * 1024; // 10MB
  
  // Location Limits
  static const double maxLocationAccuracy = 100.0; // meters
  static const int maxLocationAge = 300; // seconds
  static const int maxNearbyDistance = 50000; // 50km
  static const int minNearbyDistance = 1000; // 1km
  
  // Streak Limits
  static const int maxStreakDays = 1000;
  static const int maxStreakRewards = 10;
  static const int maxStreakPoints = 1000000;
  
  // Story Limits
  static const int maxStoryLength = 1000; // characters
  static const int maxStoryMediaCount = 10;
  static const int maxStoryDuration = 60; // seconds
  static const int maxStoryViews = 10000;
  
  // Message Limits
  static const int maxMessageLength = 2000; // characters
  static const int maxMessageMediaCount = 5;
  static const int maxMessageReactions = 10;
  static const int maxMessageReplies = 100;
  
  // User Limits
  static const int maxFriends = 5000;
  static const int maxBlockedUsers = 1000;
  static const int maxFriendRequests = 100;
  static const int maxUsernameLength = 20;
  static const int maxDisplayNameLength = 50;
  static const int maxBioLength = 200;
  
  // Live Stream Limits
  static const int maxLiveStreamDuration = 3600; // 1 hour
  static const int maxLiveStreamViewers = 10000;
  static const int maxLiveStreamQuality = 1080; // 1080p
  
  // Ad Limits
  static const int maxAdsPerHour = 10;
  static const int maxAdsPerDay = 50;
  static const int maxAdDuration = 30; // seconds
  
  // Notification Limits
  static const int maxNotifications = 100;
  static const int maxNotificationHistory = 1000;
  static const int maxNotificationAge = 30; // days
  
  // Analytics Limits
  static const int maxAnalyticsEvents = 1000;
  static const int maxAnalyticsHistory = 90; // days
  static const int maxAnalyticsBatchSize = 100;
  
  // Security Limits
  static const int maxLoginAttempts = 5;
  static const int maxPasswordResetAttempts = 3;
  static const int maxSessionDuration = 24; // hours
  static const int maxTokenAge = 7; // days
  
  // Performance Limits
  static const int maxConcurrentRequests = 5;
  static const int maxConcurrentUploads = 3;
  static const int maxConcurrentDownloads = 5;
  static const int maxMemoryUsage = 512 * 1024 * 1024; // 512MB
  static const int maxCpuUsage = 80; // percentage
  
  // Accessibility Limits
  static const double minTouchTargetSize = 44.0; // pixels
  static const double minTextScaleFactor = 0.8;
  static const double maxTextScaleFactor = 2.0;
  static const double minContrastRatio = 4.5;
  
  // Localization Limits
  static const int maxTranslationLength = 1000; // characters
  static const int maxSupportedLanguages = 20;
  static const int maxFallbackLanguages = 3;
  
  // Backup Limits
  static const int maxBackupSize = 100 * 1024 * 1024; // 100MB
  static const int maxBackupAge = 30; // days
  static const int maxBackupCount = 10;
  
  // Sync Limits
  static const int maxSyncInterval = 3600; // 1 hour
  static const int minSyncInterval = 60; // 1 minute
  static const int maxSyncRetries = 5;
  static const int maxSyncBatchSize = 100;
  
  // Debug Limits
  static const int maxLogEntries = 10000;
  static const int maxLogAge = 7; // days
  static const int maxDebugInfoSize = 1 * 1024 * 1024; // 1MB
  
  // Testing Limits
  static const int maxTestDuration = 300; // 5 minutes
  static const int maxTestRetries = 3;
  static const int maxTestDataSize = 10 * 1024 * 1024; // 10MB
  
  // Development Limits
  static const int maxDevelopmentUsers = 100;
  static const int maxDevelopmentData = 1 * 1024 * 1024 * 1024; // 1GB
  static const int maxDevelopmentLogs = 100000;
  
  // Production Limits
  static const int maxProductionUsers = 1000000;
  static const int maxProductionData = 100 * 1024 * 1024 * 1024; // 100GB
  static const int maxProductionLogs = 10000000;
}