import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_analytics/firebase_analytics.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:firebase_performance/firebase_performance.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:workmanager/workmanager.dart';

// Core imports
import 'core/services/api_service.dart';
import 'core/services/auth_service.dart';
import 'core/services/location_service.dart';
import 'core/services/socket_service.dart';
import 'core/services/local_storage_service.dart';
import 'core/services/streak_service.dart';
import 'core/services/ad_service.dart';
import 'core/services/notification_service.dart';
import 'core/services/analytics_service.dart';
import 'core/services/security_service.dart';

// Providers
import 'core/providers/auth_providers.dart';
import 'core/providers/user_providers.dart';
import 'core/providers/chat_providers.dart';
import 'core/providers/streak_providers.dart';

// Screens
import 'presentation/screens/auth_screen.dart';
import 'presentation/screens/home_screen.dart';
import 'presentation/screens/splash_screen.dart';

// Utils
import 'core/utils/constants.dart';
import 'core/utils/theme.dart';
import 'core/utils/routes.dart';
import 'core/utils/logger.dart';

// Background task handler
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      switch (task) {
        case 'locationUpdate':
          // Update user location
          await LocationService().updateLocation();
          break;
        case 'streakCheck':
          // Check and update daily streak
          await StreakService().checkDailyStreak();
          break;
        case 'messageSync':
          // Sync messages with server
          await SocketService().syncMessages();
          break;
        default:
          break;
      }
      return true;
    } catch (e) {
      Logger.error('Background task failed: $e');
      return false;
    }
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp();

  // Initialize Firebase services
  await FirebaseAnalytics.instance.setAnalyticsCollectionEnabled(true);
  await FirebaseCrashlytics.instance.setCrashlyticsCollectionEnabled(true);
  await FirebasePerformance.instance.setPerformanceCollectionEnabled(true);

  // Initialize Hive for local storage
  await Hive.initFlutter();
  await LocalStorageService().initialize();

  // Initialize AdMob
  await MobileAds.instance.initialize();

  // Initialize WorkManager for background tasks
  await Workmanager().initialize(callbackDispatcher);

  // Set up background tasks
  await _setupBackgroundTasks();

  // Request permissions
  await _requestPermissions();

  // Initialize security features
  await SecurityService().initialize();

  // Set up Firebase messaging
  await _setupFirebaseMessaging();

  // Set up local notifications
  await NotificationService().initialize();

  // Set up analytics
  await AnalyticsService().initialize();

  // Set secure flags to prevent screenshots and screen recording
  await _setSecureFlags();

  runApp(
    ProviderScope(
      child: NearChatApp(),
    ),
  );
}

class NearChatApp extends ConsumerWidget {
  NearChatApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authStateProvider);

    return MaterialApp(
      title: 'NearChat',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.system,
      navigatorKey: AppRoutes.navigatorKey,
      initialRoute: AppRoutes.splash,
      onGenerateRoute: AppRoutes.generateRoute,
      builder: (context, child) {
        return MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaleFactor: 1.0),
          child: child!,
        );
      },
      home: authState.when(
        data: (user) {
          if (user != null) {
            return HomeScreen();
          } else {
            return AuthScreen();
          }
        },
        loading: () => SplashScreen(),
        error: (error, stack) {
          Logger.error('Auth state error: $error');
          return AuthScreen();
        },
      ),
    );
  }
}

Future<void> _setupBackgroundTasks() async {
  // Schedule periodic location updates
  await Workmanager().registerPeriodicTask(
    'locationUpdate',
    'locationUpdate',
    frequency: Duration(minutes: 15),
    constraints: Constraints(
      networkType: NetworkType.connected,
      requiresBatteryNotLow: true,
    ),
  );

  // Schedule daily streak check
  await Workmanager().registerPeriodicTask(
    'streakCheck',
    'streakCheck',
    frequency: Duration(hours: 1),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );

  // Schedule message sync
  await Workmanager().registerPeriodicTask(
    'messageSync',
    'messageSync',
    frequency: Duration(minutes: 30),
    constraints: Constraints(
      networkType: NetworkType.connected,
    ),
  );
}

Future<void> _requestPermissions() async {
  // Request location permissions
  await Permission.location.request();
  await Permission.locationAlways.request();

  // Request notification permissions
  await Permission.notification.request();

  // Request camera and microphone permissions
  await Permission.camera.request();
  await Permission.microphone.request();

  // Request storage permissions
  await Permission.storage.request();

  // Request contacts permission (for friend suggestions)
  await Permission.contacts.request();
}

Future<void> _setupFirebaseMessaging() async {
  final messaging = FirebaseMessaging.instance;

  // Request permission
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );

  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    // Get FCM token
    String? token = await messaging.getToken();
    if (token != null) {
      Logger.info('FCM Token: $token');
      // Send token to server
      await ApiService().updateFcmToken(token);
    }

    // Handle token refresh
    messaging.onTokenRefresh.listen((token) async {
      Logger.info('FCM Token refreshed: $token');
      await ApiService().updateFcmToken(token);
    });

    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      Logger.info('Foreground message received: ${message.messageId}');
      NotificationService().showNotification(message);
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      Logger.info('Notification tapped: ${message.messageId}');
      _handleNotificationTap(message);
    });
  }
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  Logger.info('Background message received: ${message.messageId}');
}

void _handleNotificationTap(RemoteMessage message) {
  final data = message.data;
  
  if (data['type'] == 'message') {
    // Navigate to chat screen
    AppRoutes.navigateToChat(data['conversationId']);
  } else if (data['type'] == 'friend_request') {
    // Navigate to friends screen
    AppRoutes.navigateToFriends();
  } else if (data['type'] == 'story') {
    // Navigate to stories screen
    AppRoutes.navigateToStories();
  }
}

Future<void> _setSecureFlags() async {
  // Set secure flags to prevent screenshots and screen recording
  await SystemChrome.setEnabledSystemUIMode(
    SystemUiMode.manual,
    overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom],
  );

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      systemNavigationBarColor: Colors.white,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );

  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Set system UI mode
  await SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
}

// Error handling
void _setupErrorHandling() {
  FlutterError.onError = (FlutterErrorDetails details) {
    Logger.error('Flutter error: ${details.exception}');
    FirebaseCrashlytics.instance.recordFlutterError(details);
  };

  PlatformDispatcher.instance.onError = (error, stack) {
    Logger.error('Platform error: $error');
    FirebaseCrashlytics.instance.recordError(error, stack);
    return true;
  };
}