import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_performance/firebase_performance.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:workmanager/workmanager.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';

import 'core/config/app_config.dart';
import 'core/config/theme/app_theme.dart';
import 'core/config/theme/app_colors.dart';
import 'core/services/notification_service.dart';
import 'core/services/analytics_service.dart';
import 'core/services/storage_service.dart';
import 'core/services/socket_service.dart';
import 'core/services/location_service.dart';
import 'core/services/streak_service.dart';
import 'core/providers/app_providers.dart';
import 'core/utils/logger.dart';
import 'core/utils/constants.dart';
import 'features/auth/presentation/providers/auth_providers.dart';
import 'features/auth/presentation/screens/splash_screen.dart';
import 'features/auth/presentation/screens/onboarding_screen.dart';
import 'features/auth/presentation/screens/login_screen.dart';
import 'features/main/presentation/screens/main_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await _initializeFirebase();

  // Initialize Hive
  await _initializeHive();

  // Initialize WorkManager
  await _initializeWorkManager();

  // Initialize Mobile Ads
  await _initializeMobileAds();

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Initialize services
  await _initializeServices();

  runApp(
    const ProviderScope(
      child: NearChatApp(),
    ),
  );
}

Future<void> _initializeFirebase() async {
  try {
    await Firebase.initializeApp();
    
    // Initialize Crashlytics
    await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
    FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
    
    // Initialize Analytics
    await FirebaseAnalytics.instance.setAnalyticsCollectionEnabled(true);
    
    // Initialize Performance Monitoring
    await FirebasePerformance.instance.setPerformanceCollectionEnabled(true);
    
    AppLogger.info('Firebase initialized successfully');
  } catch (e) {
    AppLogger.error('Failed to initialize Firebase: $e');
  }
}

Future<void> _initializeHive() async {
  try {
    await Hive.initFlutter();
    
    // Register adapters
    // Hive.registerAdapter(UserModelAdapter());
    // Hive.registerAdapter(MessageModelAdapter());
    // Hive.registerAdapter(StoryModelAdapter());
    // Hive.registerAdapter(StreakModelAdapter());
    
    // Open boxes
    await Hive.openBox(AppConstants.userBox);
    await Hive.openBox(AppConstants.messageBox);
    await Hive.openBox(AppConstants.storyBox);
    await Hive.openBox(AppConstants.streakBox);
    await Hive.openBox(AppConstants.settingsBox);
    await Hive.openBox(AppConstants.cacheBox);
    
    AppLogger.info('Hive initialized successfully');
  } catch (e) {
    AppLogger.error('Failed to initialize Hive: $e');
  }
}

Future<void> _initializeWorkManager() async {
  try {
    await Workmanager().initialize(
      callbackDispatcher,
      isInDebugMode: AppConfig.isDebugMode,
    );
    
    // Register periodic tasks
    await Workmanager().registerPeriodicTask(
      'streak_check',
      'checkDailyStreak',
      frequency: const Duration(days: 1),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: false,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresStorageNotLow: false,
      ),
    );
    
    await Workmanager().registerPeriodicTask(
      'location_update',
      'updateLocation',
      frequency: const Duration(hours: 1),
      constraints: Constraints(
        networkType: NetworkType.connected,
        requiresBatteryNotLow: true,
        requiresCharging: false,
        requiresDeviceIdle: false,
        requiresStorageNotLow: false,
      ),
    );
    
    AppLogger.info('WorkManager initialized successfully');
  } catch (e) {
    AppLogger.error('Failed to initialize WorkManager: $e');
  }
}

Future<void> _initializeMobileAds() async {
  try {
    await MobileAds.instance.initialize();
    AppLogger.info('Mobile Ads initialized successfully');
  } catch (e) {
    AppLogger.error('Failed to initialize Mobile Ads: $e');
  }
}

Future<void> _initializeServices() async {
  try {
    // Initialize notification service
    await NotificationService.instance.initialize();
    
    // Initialize analytics service
    await AnalyticsService.instance.initialize();
    
    // Initialize storage service
    await StorageService.instance.initialize();
    
    // Initialize location service
    await LocationService.instance.initialize();
    
    // Initialize streak service
    await StreakService.instance.initialize();
    
    AppLogger.info('Services initialized successfully');
  } catch (e) {
    AppLogger.error('Failed to initialize services: $e');
  }
}

// WorkManager callback dispatcher
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      switch (task) {
        case 'checkDailyStreak':
          await StreakService.instance.checkDailyStreak();
          break;
        case 'updateLocation':
          await LocationService.instance.updateLocation();
          break;
        default:
          AppLogger.warning('Unknown task: $task');
      }
      return true;
    } catch (e) {
      AppLogger.error('Task execution failed: $e');
      return false;
    }
  });
}

class NearChatApp extends ConsumerWidget {
  const NearChatApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final appTheme = ref.watch(appThemeProvider);
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      title: AppConfig.appName,
      debugShowCheckedModeBanner: false,
      theme: appTheme.lightTheme,
      darkTheme: appTheme.darkTheme,
      themeMode: appTheme.themeMode,
      navigatorKey: AppConfig.navigatorKey,
      navigatorObservers: [
        FirebaseAnalyticsObserver(analytics: FirebaseAnalytics.instance),
      ],
      home: _buildHomeScreen(authState),
      onGenerateRoute: AppConfig.onGenerateRoute,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaleFactor: 1.0,
          ),
          child: child!,
        );
      },
    );
  }

  Widget _buildHomeScreen(AuthState authState) {
    return authState.when(
      initial: () => const SplashScreen(),
      loading: () => const SplashScreen(),
      authenticated: (user) => const MainScreen(),
      unauthenticated: () => const OnboardingScreen(),
      error: (error) => LoginScreen(error: error),
    );
  }
}

// App Configuration
class AppConfig {
  static const String appName = 'NearChat';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'Enterprise-grade social messaging platform';
  
  // API Configuration
  static const String baseUrl = 'http://localhost:3000/api';
  static const String socketUrl = 'http://localhost:3000';
  
  // Feature Flags
  static const bool enableGoogleOAuth = true;
  static const bool enablePushNotifications = true;
  static const bool enableLocationServices = true;
  static const bool enableWebRTC = true;
  static const bool enableLiveStreaming = true;
  static const bool enableMonetization = true;
  static const bool enableAnalytics = true;
  
  // Debug Mode
  static const bool isDebugMode = kDebugMode;
  
  // Navigation
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  
  // Route generation
  static Route<dynamic>? onGenerateRoute(RouteSettings settings) {
    // Implement route generation logic here
    return null;
  }
  
  // App Colors
  static const Color primaryColor = AppColors.primary;
  static const Color secondaryColor = AppColors.secondary;
  static const Color accentColor = AppColors.accent;
  
  // App Dimensions
  static const double defaultPadding = 16.0;
  static const double defaultRadius = 12.0;
  static const double defaultIconSize = 24.0;
  
  // Animation Durations
  static const Duration shortAnimation = Duration(milliseconds: 200);
  static const Duration mediumAnimation = Duration(milliseconds: 300);
  static const Duration longAnimation = Duration(milliseconds: 500);
  
  // Cache Configuration
  static const Duration cacheExpiry = Duration(hours: 1);
  static const int maxCacheSize = 100 * 1024 * 1024; // 100MB
  
  // File Upload Configuration
  static const int maxImageSize = 5 * 1024 * 1024; // 5MB
  static const int maxVideoSize = 50 * 1024 * 1024; // 50MB
  static const int maxAudioSize = 10 * 1024 * 1024; // 10MB
  
  // Location Configuration
  static const double defaultLocationAccuracy = 10.0; // meters
  static const Duration locationUpdateInterval = Duration(minutes: 5);
  static const int maxNearbyDistance = 50000; // 50km
  
  // Streak Configuration
  static const int bronzeStreakDays = 7;
  static const int silverStreakDays = 30;
  static const int goldStreakDays = 100;
  static const int platinumStreakDays = 365;
  
  // Story Configuration
  static const Duration storyDuration = Duration(hours: 24);
  static const int maxStoryLength = 1000; // characters
  
  // Message Configuration
  static const int maxMessageLength = 2000; // characters
  static const Duration messageTTL = Duration(hours: 24);
  
  // Rate Limiting
  static const int maxMessagesPerMinute = 30;
  static const int maxStoriesPerHour = 20;
  static const int maxFriendRequestsPerDay = 50;
  
  // Ad Configuration
  static const String admobAppId = 'ca-app-pub-xxxxxxxxxxxxxxxx~yyyyyyyyyy';
  static const String admobBannerAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz';
  static const String admobInterstitialAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/wwwwwwwwww';
  static const String admobRewardedAdUnitId = 'ca-app-pub-xxxxxxxxxxxxxxxx/vvvvvvvvvv';
  
  // Error Messages
  static const String networkErrorMessage = 'Please check your internet connection and try again.';
  static const String serverErrorMessage = 'Something went wrong. Please try again later.';
  static const String permissionErrorMessage = 'Permission denied. Please enable required permissions in settings.';
  static const String locationErrorMessage = 'Location services are required for this feature.';
  
  // Success Messages
  static const String profileUpdatedMessage = 'Profile updated successfully!';
  static const String storyPostedMessage = 'Story posted successfully!';
  static const String messageSentMessage = 'Message sent successfully!';
  static const String friendRequestSentMessage = 'Friend request sent successfully!';
  
  // Validation Messages
  static const String emailRequiredMessage = 'Email is required';
  static const String passwordRequiredMessage = 'Password is required';
  static const String usernameRequiredMessage = 'Username is required';
  static const String invalidEmailMessage = 'Please enter a valid email address';
  static const String weakPasswordMessage = 'Password must be at least 8 characters long';
  static const String usernameTakenMessage = 'Username is already taken';
  
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
}