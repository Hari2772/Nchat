import 'package:flutter/material.dart';

class AppColors {
  // Primary Colors
  static const Color primary = Color(0xFF007AFF);
  static const Color primaryLight = Color(0xFF4DA3FF);
  static const Color primaryDark = Color(0xFF0056CC);
  static const Color primaryContainer = Color(0xFFE3F2FD);
  
  // Secondary Colors
  static const Color secondary = Color(0xFF5856D6);
  static const Color secondaryLight = Color(0xFF8B7FF6);
  static const Color secondaryDark = Color(0xFF3D3B9E);
  static const Color secondaryContainer = Color(0xFFF3F0FF);
  
  // Accent Colors
  static const Color accent = Color(0xFFFF9500);
  static const Color accentLight = Color(0xFFFFB74D);
  static const Color accentDark = Color(0xFFF57C00);
  static const Color accentContainer = Color(0xFFFFF3E0);
  
  // Success Colors
  static const Color success = Color(0xFF34C759);
  static const Color successLight = Color(0xFF66BB6A);
  static const Color successDark = Color(0xFF2E7D32);
  static const Color successContainer = Color(0xFFE8F5E8);
  
  // Error Colors
  static const Color error = Color(0xFFFF3B30);
  static const Color errorLight = Color(0xFFEF5350);
  static const Color errorDark = Color(0xFFD32F2F);
  static const Color errorContainer = Color(0xFFFFEBEE);
  
  // Warning Colors
  static const Color warning = Color(0xFFFF9500);
  static const Color warningLight = Color(0xFFFFB74D);
  static const Color warningDark = Color(0xFFF57C00);
  static const Color warningContainer = Color(0xFFFFF3E0);
  
  // Info Colors
  static const Color info = Color(0xFF5AC8FA);
  static const Color infoLight = Color(0xFF81D4FA);
  static const Color infoDark = Color(0xFF0288D1);
  static const Color infoContainer = Color(0xFFE1F5FE);
  
  // Neutral Colors
  static const Color white = Color(0xFFFFFFFF);
  static const Color black = Color(0xFF000000);
  static const Color transparent = Color(0x00000000);
  
  // Gray Scale
  static const Color gray50 = Color(0xFFFAFAFA);
  static const Color gray100 = Color(0xFFF5F5F5);
  static const Color gray200 = Color(0xFFEEEEEE);
  static const Color gray300 = Color(0xFFE0E0E0);
  static const Color gray400 = Color(0xFFBDBDBD);
  static const Color gray500 = Color(0xFF9E9E9E);
  static const Color gray600 = Color(0xFF757575);
  static const Color gray700 = Color(0xFF616161);
  static const Color gray800 = Color(0xFF424242);
  static const Color gray900 = Color(0xFF212121);
  
  // Background Colors
  static const Color background = Color(0xFFFAFAFA);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color surfaceVariant = Color(0xFFF5F5F5);
  static const Color surfaceDark = Color(0xFF121212);
  static const Color surfaceVariantDark = Color(0xFF1E1E1E);
  
  // Text Colors
  static const Color textPrimary = Color(0xFF212121);
  static const Color textSecondary = Color(0xFF757575);
  static const Color textTertiary = Color(0xFF9E9E9E);
  static const Color textDisabled = Color(0xFFBDBDBD);
  static const Color textPrimaryDark = Color(0xFFFFFFFF);
  static const Color textSecondaryDark = Color(0xFFB3B3B3);
  static const Color textTertiaryDark = Color(0xFF808080);
  static const Color textDisabledDark = Color(0xFF4D4D4D);
  
  // Border Colors
  static const Color border = Color(0xFFE0E0E0);
  static const Color borderLight = Color(0xFFF0F0F0);
  static const Color borderDark = Color(0xFF424242);
  static const Color borderDarkLight = Color(0xFF2E2E2E);
  
  // Divider Colors
  static const Color divider = Color(0xFFE0E0E0);
  static const Color dividerDark = Color(0xFF424242);
  
  // Overlay Colors
  static const Color overlay = Color(0x80000000);
  static const Color overlayLight = Color(0x40000000);
  static const Color overlayDark = Color(0x80FFFFFF);
  static const Color overlayDarkLight = Color(0x40FFFFFF);
  
  // Shadow Colors
  static const Color shadow = Color(0x1A000000);
  static const Color shadowLight = Color(0x0A000000);
  static const Color shadowDark = Color(0x1AFFFFFF);
  static const Color shadowDarkLight = Color(0x0AFFFFFF);
  
  // Gradient Colors
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [primary, primaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient secondaryGradient = LinearGradient(
    colors: [secondary, secondaryLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient accentGradient = LinearGradient(
    colors: [accent, accentLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient successGradient = LinearGradient(
    colors: [success, successLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const LinearGradient errorGradient = LinearGradient(
    colors: [error, errorLight],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  // Story Colors
  static const Color storyBorder = Color(0xFFFF6B6B);
  static const Color storyBorderViewed = Color(0xFFBDBDBD);
  static const Color storyBackground = Color(0xFF000000);
  static const Color storyOverlay = Color(0x80000000);
  
  // Chat Colors
  static const Color chatBubbleSent = primary;
  static const Color chatBubbleReceived = gray200;
  static const Color chatBubbleSentDark = primary;
  static const Color chatBubbleReceivedDark = gray800;
  static const Color chatBackground = gray50;
  static const Color chatBackgroundDark = gray900;
  
  // Status Colors
  static const Color online = success;
  static const Color offline = gray500;
  static const Color away = warning;
  static const Color busy = error;
  
  // Streak Colors
  static const Color bronze = Color(0xFFCD7F32);
  static const Color silver = Color(0xFFC0C0C0);
  static const Color gold = Color(0xFFFFD700);
  static const Color platinum = Color(0xFFE5E4E2);
  
  // Reaction Colors
  static const Color like = Color(0xFFE91E63);
  static const Color love = Color(0xFFFF5722);
  static const Color haha = Color(0xFFFF9800);
  static const Color wow = Color(0xFFFFEB3B);
  static const Color sad = Color(0xFF2196F3);
  static const Color angry = Color(0xFFF44336);
  
  // Live Stream Colors
  static const Color liveRed = Color(0xFFFF3B30);
  static const Color liveBackground = Color(0xFFFFEBEE);
  static const Color liveText = Color(0xFFD32F2F);
  
  // Ad Colors
  static const Color adBackground = Color(0xFFF5F5F5);
  static const Color adBorder = Color(0xFFE0E0E0);
  static const Color adText = Color(0xFF757575);
  
  // QR Code Colors
  static const Color qrBackground = white;
  static const Color qrForeground = black;
  
  // Map Colors
  static const Color mapPrimary = primary;
  static const Color mapSecondary = secondary;
  static const Color mapAccent = accent;
  static const Color mapBackground = gray50;
  
  // Notification Colors
  static const Color notificationBackground = white;
  static const Color notificationBorder = border;
  static const Color notificationText = textPrimary;
  static const Color notificationIcon = primary;
  
  // Loading Colors
  static const Color loadingBackground = Color(0xFFF5F5F5);
  static const Color loadingShimmer = Color(0xFFE0E0E0);
  
  // Selection Colors
  static const Color selection = Color(0xFFE3F2FD);
  static const Color selectionDark = Color(0xFF1E3A5F);
  
  // Focus Colors
  static const Color focus = primary;
  static const Color focusDark = primaryLight;
  
  // Disabled Colors
  static const Color disabled = gray400;
  static const Color disabledDark = gray600;
  static const Color disabledText = gray500;
  static const Color disabledTextDark = gray700;
  
  // Link Colors
  static const Color link = primary;
  static const Color linkVisited = secondary;
  static const Color linkHover = primaryDark;
  
  // Code Colors
  static const Color codeBackground = Color(0xFFF5F5F5);
  static const Color codeText = Color(0xFF212121);
  static const Color codeComment = Color(0xFF757575);
  static const Color codeKeyword = primary;
  static const Color codeString = success;
  static const Color codeNumber = accent;
  
  // Chart Colors
  static const List<Color> chartColors = [
    primary,
    secondary,
    accent,
    success,
    error,
    warning,
    info,
    gray500,
  ];
  
  // Heatmap Colors
  static const Color heatmapLow = Color(0xFFE3F2FD);
  static const Color heatmapMedium = Color(0xFF2196F3);
  static const Color heatmapHigh = Color(0xFF0D47A1);
  
  // Weather Colors
  static const Color sunny = Color(0xFFFFEB3B);
  static const Color cloudy = Color(0xFFBDBDBD);
  static const Color rainy = Color(0xFF2196F3);
  static const Color snowy = Color(0xFFE3F2FD);
  
  // Time Colors
  static const Color morning = Color(0xFFFFB74D);
  static const Color afternoon = Color(0xFFFFEB3B);
  static const Color evening = Color(0xFFFF9800);
  static const Color night = Color(0xFF3F51B5);
  
  // Mood Colors
  static const Color happy = Color(0xFFFFEB3B);
  static const Color excited = Color(0xFFFF5722);
  static const Color calm = Color(0xFF4CAF50);
  static const Color sadMood = Color(0xFF2196F3);
  static const Color angryMood = Color(0xFFF44336);
  
  // Priority Colors
  static const Color lowPriority = success;
  static const Color mediumPriority = warning;
  static const Color highPriority = error;
  static const Color criticalPriority = Color(0xFFD32F2F);
  
  // Category Colors
  static const Color social = primary;
  static const Color work = secondary;
  static const Color personal = accent;
  static const Color entertainment = success;
  static const Color health = error;
  static const Color education = info;
  
  // Theme Colors
  static const Color themeLight = Color(0xFFF5F5F5);
  static const Color themeDark = Color(0xFF121212);
  static const Color themeAuto = Color(0xFF000000);
  
  // Accessibility Colors
  static const Color highContrast = Color(0xFF000000);
  static const Color highContrastBackground = Color(0xFFFFFFFF);
  static const Color reducedMotion = Color(0xFF000000);
  
  // Brand Colors
  static const Color brandPrimary = primary;
  static const Color brandSecondary = secondary;
  static const Color brandAccent = accent;
  static const Color brandSuccess = success;
  static const Color brandError = error;
  static const Color brandWarning = warning;
  static const Color brandInfo = info;
  
  // Semantic Colors
  static const Color semanticPositive = success;
  static const Color semanticNegative = error;
  static const Color semanticWarning = warning;
  static const Color semanticInfo = info;
  static const Color semanticNeutral = gray500;
  
  // Interactive Colors
  static const Color interactivePrimary = primary;
  static const Color interactiveSecondary = secondary;
  static const Color interactiveAccent = accent;
  static const Color interactiveSuccess = success;
  static const Color interactiveError = error;
  static const Color interactiveWarning = warning;
  static const Color interactiveInfo = info;
  
  // State Colors
  static const Color stateActive = primary;
  static const Color stateInactive = gray500;
  static const Color stateHover = primaryLight;
  static const Color statePressed = primaryDark;
  static const Color stateSelected = primary;
  static const Color stateDisabled = gray400;
  static const Color stateError = error;
  static const Color stateSuccess = success;
  static const Color stateWarning = warning;
  static const Color stateInfo = info;
}