import 'package:flutter/material.dart';

class AppConfig {
  // App Information
  static const String appName = 'NearChat';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Enterprise-grade social messaging platform';
  static const String appPackageName = 'com.nearchat.app';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000/api';
  static const String socketUrl = 'http://localhost:3000';
  static const String webSocketUrl = 'ws://localhost:3000';
  
  // Timeouts
  static const Duration connectionTimeout = Duration(seconds: 30);
  static const Duration receiveTimeout = Duration(seconds: 30);
  static const Duration sendTimeout = Duration(seconds: 30);
  
  // Feature Flags
  static const bool enableGoogleOAuth = true;
  static const bool enablePushNotifications = true;
  static const bool enableLocationServices = true;
  static const bool enableWebRTC = true;
  static const bool enableLiveStreaming = true;
  static const bool enableMonetization = true;
  static const bool enableAnalytics = true;
  static const bool enableCrashlytics = true;
  static const bool enablePerformanceMonitoring = true;
  
  // Debug Mode
  static const bool isDebugMode = kDebugMode;
  
  // Navigation
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  // App Colors
  static const Color primaryColor = Color(0xFF007AFF);
  static const Color secondaryColor = Color(0xFF5856D6);
  static const Color accentColor = Color(0xFFFF9500);
  static const Color successColor = Color(0xFF34C759);
  static const Color errorColor = Color(0xFFFF3B30);
  static const Color warningColor = Color(0xFFFF9500);
  static const Color infoColor = Color(0xFF5AC8FA);
  
  // App Dimensions
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double defaultRadius = 12.0;
  static const double smallRadius = 8.0;
  static const double largeRadius = 16.0;
  static const double defaultIconSize = 24.0;
  static const double smallIconSize = 16.0;
  static const double largeIconSize = 32.0;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  static const Duration extraLongAnimation = Duration(milliseconds: 800);
  
  // Cache Configuration
  static const Duration cacheExpiry = Duration(hours: 1);
  static const int maxCacheSize = 100 * 1024 * 1024; // 100MB
  static const int maxCacheEntries = 1000;
  
  // File Upload Configuration
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxVideoSize = 50 * 1024 * 1024; // 50MB
  static const int maxAudioSize = 10 * 1024 * 1024; // 10MB
  static const int maxDocumentSize = 10 * 1024 * 1024; // 10MB
  static const List<String> allowedImageFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
  static const List<String> allowedVideoFormats = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
  static const List<String> allowedAudioFormats = ['mp3', 'wav', 'aac', 'm4a', 'ogg'];
  
  // Location Configuration
  static const double defaultLocationAccuracy = 10.0; // meters
  static const Duration locationUpdateInterval = Duration(minutes: 5);
  static const int maxNearbyDistance = 50000; // 50km
  static const int minNearbyDistance = 1000; // 1km
  static const int defaultNearbyDistance = 10000; // 10km
  
  // Streak Configuration
  static const int bronzeStreakDays = 7;
  static const int silverStreakDays = 30;
  static const int goldStreakDays = 100;
  static const int platinumStreakDays = 365;
  static const int maxStreakDays = 1000;
  
  // Story Configuration
  static const Duration storyDuration = Duration(hours: 24);
  static const int maxStoryLength = 1000; // characters
  static const int maxStoryMediaCount = 10;
  static const Duration storyViewDuration = Duration(seconds: 15);
  
  // Message Configuration
  static const int maxMessageLength = 2000; // characters
  static const Duration messageTTL = Duration(hours: 24);
  static const int maxMessageMediaCount = 5;
  static const int maxMessageReactions = 10;
  
  // Rate Limiting
  static const int maxMessagesPerMinute = 30;
  static const int maxStoriesPerHour = 20;
  static const int maxFriendRequestsPerDay = 50;
  static const int maxLoginAttemptsPerHour = 5;
  static const int maxPasswordResetAttemptsPerDay = 3;
  
  // Ad Configuration
  static const String admobAppId = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy';
  static const String admobBannerAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz';
  static const String admobInterstitialAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww';
  static const String admobRewardedAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/vvvvvvvvvv';
  static const Duration adRefreshInterval = Duration(minutes: 2);
  static const int maxAdsPerHour = 10;
  
  // Notification Configuration
  static const String defaultNotificationChannelId = 'nearchat_default';
  static const String defaultNotificationChannelName = 'NearChat Notifications';
  static const String defaultNotificationChannelDescription = 'General notifications from NearChat';
  static const int maxNotificationHistory = 100;
  
  // Security Configuration
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int sessionTimeoutHours = 24;
  static const int refreshTokenExpiryDays = 7;
  static const int accessTokenExpiryHours = 1;
  
  // Pagination Configuration
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
  static const int minPageSize = 5;
  
  // Search Configuration
  static const int maxSearchResults = 50;
  static const int minSearchQueryLength = 2;
  static const Duration searchDebounceTime = Duration(milliseconds: 300);
  
  // Error Messages
  static const String networkErrorMessage = 'Please check your internet connection and try again.';
  static const String serverErrorMessage = 'Something went wrong. Please try again later.';
  static const String permissionErrorMessage = 'Permission denied. Please enable required permissions in settings.';
  static const String locationErrorMessage = 'Location services are required for this feature.';
  static const String cameraErrorMessage = 'Camera access is required for this feature.';
  static const String microphoneErrorMessage = 'Microphone access is required for this feature.';
  static const String storageErrorMessage = 'Storage access is required for this feature.';
  static const String unknownErrorMessage = 'An unexpected error occurred. Please try again.';
  
  // Success Messages
  static const String profileUpdatedMessage = 'Profile updated successfully!';
  static const String storyPostedMessage = 'Story posted successfully!';
  static const String messageSentMessage = 'Message sent successfully!';
  static const String friendRequestSentMessage = 'Friend request sent successfully!';
  static const String friendRequestAcceptedMessage = 'Friend request accepted!';
  static const String friendRequestRejectedMessage = 'Friend request rejected.';
  static const String userBlockedMessage = 'User blocked successfully.';
  static const String userUnblockedMessage = 'User unblocked successfully.';
  static const String passwordChangedMessage = 'Password changed successfully!';
  static const String emailVerifiedMessage = 'Email verified successfully!';
  static const String accountDeletedMessage = 'Account deleted successfully.';
  
  // Validation Messages
  static const String emailRequiredMessage = 'Email is required';
  static const String passwordRequiredMessage = 'Password is required';
  static const String usernameRequiredMessage = 'Username is required';
  static const String displayNameRequiredMessage = 'Display name is required';
  static const String invalidEmailMessage = 'Please enter a valid email address';
  static const String weakPasswordMessage = 'Password must be at least 8 characters long';
  static const String usernameTakenMessage = 'Username is already taken';
  static const String emailTakenMessage = 'Email is already registered';
  static const String invalidUsernameMessage = 'Username can only contain letters, numbers, and underscores';
  static const String usernameTooShortMessage = 'Username must be at least 3 characters long';
  static const String usernameTooLongMessage = 'Username must be less than 20 characters long';
  static const String displayNameTooLongMessage = 'Display name must be less than 50 characters long';
  static const String bioTooLongMessage = 'Bio must be less than 200 characters long';
  
  // Onboarding Messages
  static const List<String> onboardingTitles = [
    'Connect with Nearby People',
    'Share Your Stories',
    'Stay Connected',
    'Earn Rewards',
  ];
  
  static const List<String> onboardingDescriptions = [
    'Discover and connect with people around you in real-time.',
    'Share your moments with photos, videos, and live streams.',
    'Chat, call, and stay connected with friends and family.',
    'Complete daily challenges and earn rewards for your activity.',
  ];
  
  // Privacy Policy and Terms
  static const String privacyPolicyUrl = 'https://nearchat.app/privacy';
  static const String termsOfServiceUrl = 'https://nearchat.app/terms';
  static const String supportUrl = 'https://nearchat.app/support';
  static const String feedbackUrl = 'https://nearchat.app/feedback';
  
  // Social Media Links
  static const String facebookUrl = 'https://facebook.com/nearchat';
  static const String twitterUrl = 'https://twitter.com/nearchat';
  static const String instagramUrl = 'https://instagram.com/nearchat';
  static const String linkedinUrl = 'https://linkedin.com/company/nearchat';
  
  // Route generation
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    // Implement route generation logic here
    return null;
  }
  
  // Environment-specific configurations
  static bool get isProduction => const bool.fromEnvironment('dart.vm.product');
  static bool get isDevelopment => !isProduction;
  static bool get isTest => const bool.fromEnvironment('dart.vm.test');
  
  // Platform-specific configurations
  static bool get isAndroid => const bool.fromEnvironment('dart.vm.product') == false;
  static bool get isIOS => const bool.fromEnvironment('dart.vm.product') == false;
  static bool get isWeb => const bool.fromEnvironment('dart.vm.product') == false;
  
  // Device-specific configurations
  static bool get isTablet => false; // Implement tablet detection logic
  static bool get isPhone => true; // Implement phone detection logic
  
  // Network-specific configurations
  static bool get isConnected => true; // Implement network connectivity check
  static bool get isWifi => true; // Implement WiFi detection logic
  static bool get isMobileData => false; // Implement mobile data detection logic
  
  // Performance configurations
  static const int maxConcurrentRequests = 5;
  static const Duration requestRetryDelay = Duration(seconds: 2);
  static const int maxRequestRetries = 3;
  static const Duration imageCacheExpiry = Duration(days: 7);
  static const Duration videoCacheExpiry = Duration(days: 30);
  
  // Analytics configurations
  static const bool enableUserTracking = true;
  static const bool enableCrashReporting = true;
  static const bool enablePerformanceMonitoring = true;
  static const bool enableCustomEvents = true;
  
  // Localization configurations
  static const String defaultLocale = 'en';
  static const List<String> supportedLocales = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'];
  
  // Accessibility configurations
  static const bool enableAccessibility = true;
  static const double minimumTouchTargetSize = 44.0;
  static const double minimumTextScaleFactor = 0.8;
  static const double maximumTextScaleFactor = 2.0;
}