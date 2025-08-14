import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/services.dart';

import 'app_colors.dart';
import 'app_config.dart';

// Theme Provider
final appThemeProvider = StateNotifierProvider<AppThemeNotifier, AppTheme>((ref) {
  return AppThemeNotifier();
});

class AppTheme {
  final ThemeMode themeMode;
  final ThemeData lightTheme;
  final ThemeData darkTheme;

  const AppTheme({
    required this.themeMode,
    required this.lightTheme,
    required this.darkTheme,
  });

  ThemeData get currentTheme {
    switch (themeMode) {
      case ThemeMode.light:
        return lightTheme;
      case ThemeMode.dark:
        return darkTheme;
      case ThemeMode.system:
        return WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.light
            ? lightTheme
            : darkTheme;
    }
  }
}

class AppThemeNotifier extends StateNotifier<AppTheme> {
  AppThemeNotifier() : super(AppTheme(
    themeMode: ThemeMode.system,
    lightTheme: _createLightTheme(),
    darkTheme: _createDarkTheme(),
  ));

  void setThemeMode(ThemeMode mode) {
    state = AppTheme(
      themeMode: mode,
      lightTheme: state.lightTheme,
      darkTheme: state.darkTheme,
    );
  }

  void toggleTheme() {
    final newMode = state.themeMode == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
    setThemeMode(newMode);
  }
}

// Light Theme
ThemeData _createLightTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.light,
    colorScheme: const ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: AppColors.white,
      primaryContainer: AppColors.primaryContainer,
      onPrimaryContainer: AppColors.primaryDark,
      secondary: AppColors.secondary,
      onSecondary: AppColors.white,
      secondaryContainer: AppColors.secondaryContainer,
      onSecondaryContainer: AppColors.secondaryDark,
      tertiary: AppColors.accent,
      onTertiary: AppColors.white,
      tertiaryContainer: AppColors.accentContainer,
      onTertiaryContainer: AppColors.accentDark,
      error: AppColors.error,
      onError: AppColors.white,
      errorContainer: AppColors.errorContainer,
      onErrorContainer: AppColors.errorDark,
      background: AppColors.background,
      onBackground: AppColors.textPrimary,
      surface: AppColors.surface,
      onSurface: AppColors.textPrimary,
      surfaceVariant: AppColors.surfaceVariant,
      onSurfaceVariant: AppColors.textSecondary,
      outline: AppColors.border,
      outlineVariant: AppColors.borderLight,
      shadow: AppColors.shadow,
      scrim: AppColors.overlay,
      inverseSurface: AppColors.gray900,
      onInverseSurface: AppColors.white,
      inversePrimary: AppColors.primaryLight,
      surfaceTint: AppColors.primary,
    ),
    
    // Typography
    textTheme: _createTextTheme(),
    
    // App Bar Theme
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surface,
      foregroundColor: AppColors.textPrimary,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      iconTheme: IconThemeData(
        color: AppColors.textPrimary,
        size: AppConfig.defaultIconSize,
      ),
      actionsIconTheme: IconThemeData(
        color: AppColors.textPrimary,
        size: AppConfig.defaultIconSize,
      ),
    ),
    
    // Bottom Navigation Bar Theme
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.surface,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textTertiary,
      selectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    
    // Card Theme
    cardTheme: CardTheme(
      color: AppColors.surface,
      elevation: 2,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      margin: const EdgeInsets.all(AppConfig.smallPadding),
    ),
    
    // Elevated Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 2,
        shadowColor: AppColors.shadow,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.largePadding,
          vertical: AppConfig.defaultPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Outlined Button Theme
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.primary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.largePadding,
          vertical: AppConfig.defaultPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Text Button Theme
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.defaultPadding,
          vertical: AppConfig.smallPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceVariant,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppConfig.defaultPadding,
        vertical: AppConfig.defaultPadding,
      ),
      hintStyle: const TextStyle(
        color: AppColors.textTertiary,
        fontSize: 16,
      ),
      labelStyle: const TextStyle(
        color: AppColors.textSecondary,
        fontSize: 16,
      ),
      errorStyle: const TextStyle(
        color: AppColors.error,
        fontSize: 12,
      ),
    ),
    
    // Floating Action Button Theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.white,
      elevation: 6,
      shape: CircleBorder(),
    ),
    
    // Chip Theme
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surfaceVariant,
      selectedColor: AppColors.primaryContainer,
      disabledColor: AppColors.disabled,
      labelStyle: const TextStyle(
        color: AppColors.textPrimary,
        fontSize: 14,
      ),
      secondaryLabelStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppConfig.smallPadding,
        vertical: AppConfig.smallPadding / 2,
      ),
    ),
    
    // Divider Theme
    dividerTheme: const DividerThemeData(
      color: AppColors.divider,
      thickness: 1,
      space: 1,
    ),
    
    // Icon Theme
    iconTheme: const IconThemeData(
      color: AppColors.textPrimary,
      size: AppConfig.defaultIconSize,
    ),
    
    // Primary Icon Theme
    primaryIconTheme: const IconThemeData(
      color: AppColors.primary,
      size: AppConfig.defaultIconSize,
    ),
    
    // Switch Theme
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.gray400;
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primaryContainer;
        }
        return AppColors.gray300;
      }),
    ),
    
    // Checkbox Theme
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.transparent;
      }),
      checkColor: MaterialStateProperty.all(AppColors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
    ),
    
    // Radio Theme
    radioTheme: RadioThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.gray400;
      }),
    ),
    
    // Slider Theme
    sliderTheme: SliderThemeData(
      activeTrackColor: AppColors.primary,
      inactiveTrackColor: AppColors.gray300,
      thumbColor: AppColors.primary,
      overlayColor: AppColors.primaryContainer,
      valueIndicatorColor: AppColors.primary,
      valueIndicatorTextStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    ),
    
    // Progress Indicator Theme
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.primary,
      linearTrackColor: AppColors.gray300,
      circularTrackColor: AppColors.gray300,
    ),
    
    // Dialog Theme
    dialogTheme: DialogTheme(
      backgroundColor: AppColors.surface,
      elevation: 8,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.largeRadius),
      ),
      titleTextStyle: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      contentTextStyle: const TextStyle(
        fontSize: 16,
        color: AppColors.textSecondary,
      ),
    ),
    
    // Snackbar Theme
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.gray900,
      contentTextStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 16,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    
    // Bottom Sheet Theme
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surface,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppConfig.largeRadius),
        ),
      ),
    ),
    
    // Tab Bar Theme
    tabBarTheme: const TabBarTheme(
      labelColor: AppColors.primary,
      unselectedLabelColor: AppColors.textTertiary,
      indicatorColor: AppColors.primary,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),
    
    // Expansion Tile Theme
    expansionTileTheme: const ExpansionTileThemeData(
      backgroundColor: AppColors.surface,
      collapsedBackgroundColor: AppColors.surfaceVariant,
      textColor: AppColors.textPrimary,
      iconColor: AppColors.textPrimary,
      collapsedTextColor: AppColors.textSecondary,
      collapsedIconColor: AppColors.textSecondary,
    ),
    
    // List Tile Theme
    listTileTheme: const ListTileThemeData(
      contentPadding: EdgeInsets.symmetric(
        horizontal: AppConfig.defaultPadding,
        vertical: AppConfig.smallPadding,
      ),
      titleTextStyle: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimary,
      ),
      subtitleTextStyle: TextStyle(
        fontSize: 14,
        color: AppColors.textSecondary,
      ),
      leadingAndTrailingTextStyle: TextStyle(
        fontSize: 14,
        color: AppColors.textTertiary,
      ),
    ),
    
    // Data Table Theme
    dataTableTheme: DataTableThemeData(
      headingTextStyle: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimary,
      ),
      dataTextStyle: const TextStyle(
        fontSize: 14,
        color: AppColors.textSecondary,
      ),
      dividerThickness: 1,
      columnSpacing: 16,
      horizontalMargin: AppConfig.defaultPadding,
    ),
    
    // Tooltip Theme
    tooltipTheme: TooltipThemeData(
      decoration: BoxDecoration(
        color: AppColors.gray900,
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
      textStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
      ),
    ),
    
    // Popup Menu Theme
    popupMenuTheme: PopupMenuThemeData(
      color: AppColors.surface,
      elevation: 8,
      shadowColor: AppColors.shadow,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        color: AppColors.textPrimary,
      ),
    ),
    
    // Navigation Drawer Theme
    navigationDrawerTheme: NavigationDrawerThemeData(
      backgroundColor: AppColors.surface,
      elevation: 8,
      shadowColor: AppColors.shadow,
      indicatorColor: AppColors.primaryContainer,
      tileHeight: 56,
      labelTextStyle: MaterialStateProperty.all(
        const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimary,
        ),
      ),
    ),
    
    // Navigation Rail Theme
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: AppColors.surface,
      selectedIconTheme: IconThemeData(
        color: AppColors.primary,
        size: AppConfig.defaultIconSize,
      ),
      unselectedIconTheme: IconThemeData(
        color: AppColors.textTertiary,
        size: AppConfig.defaultIconSize,
      ),
      selectedLabelTextStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.primary,
      ),
      unselectedLabelTextStyle: TextStyle(
        fontSize: 12,
        color: AppColors.textTertiary,
      ),
      indicatorColor: AppColors.primaryContainer,
    ),
    
    // Material 3 specific
    cardColor: AppColors.surface,
    scaffoldBackgroundColor: AppColors.background,
    canvasColor: AppColors.surface,
    shadowColor: AppColors.shadow,
    splashColor: AppColors.primaryContainer,
    highlightColor: AppColors.primaryContainer,
    focusColor: AppColors.primaryContainer,
    hoverColor: AppColors.primaryContainer,
    disabledColor: AppColors.disabled,
    unselectedWidgetColor: AppColors.textTertiary,
    selectedRowColor: AppColors.selection,
    dividerColor: AppColors.divider,
  );
}

// Dark Theme
ThemeData _createDarkTheme() {
  return ThemeData(
    useMaterial3: true,
    brightness: Brightness.dark,
    colorScheme: const ColorScheme.dark(
      primary: AppColors.primary,
      onPrimary: AppColors.white,
      primaryContainer: AppColors.primaryDark,
      onPrimaryContainer: AppColors.primaryLight,
      secondary: AppColors.secondary,
      onSecondary: AppColors.white,
      secondaryContainer: AppColors.secondaryDark,
      onSecondaryContainer: AppColors.secondaryLight,
      tertiary: AppColors.accent,
      onTertiary: AppColors.white,
      tertiaryContainer: AppColors.accentDark,
      onTertiaryContainer: AppColors.accentLight,
      error: AppColors.error,
      onError: AppColors.white,
      errorContainer: AppColors.errorDark,
      onErrorContainer: AppColors.errorLight,
      background: AppColors.surfaceDark,
      onBackground: AppColors.textPrimaryDark,
      surface: AppColors.surfaceDark,
      onSurface: AppColors.textPrimaryDark,
      surfaceVariant: AppColors.surfaceVariantDark,
      onSurfaceVariant: AppColors.textSecondaryDark,
      outline: AppColors.borderDark,
      outlineVariant: AppColors.borderDarkLight,
      shadow: AppColors.shadowDark,
      scrim: AppColors.overlayDark,
      inverseSurface: AppColors.white,
      onInverseSurface: AppColors.gray900,
      inversePrimary: AppColors.primaryDark,
      surfaceTint: AppColors.primary,
    ),
    
    // Typography
    textTheme: _createTextTheme().apply(
      bodyColor: AppColors.textPrimaryDark,
      displayColor: AppColors.textPrimaryDark,
    ),
    
    // App Bar Theme
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.surfaceDark,
      foregroundColor: AppColors.textPrimaryDark,
      elevation: 0,
      scrolledUnderElevation: 1,
      centerTitle: true,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimaryDark,
      ),
      iconTheme: IconThemeData(
        color: AppColors.textPrimaryDark,
        size: AppConfig.defaultIconSize,
      ),
      actionsIconTheme: IconThemeData(
        color: AppColors.textPrimaryDark,
        size: AppConfig.defaultIconSize,
      ),
    ),
    
    // Bottom Navigation Bar Theme
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.surfaceDark,
      selectedItemColor: AppColors.primary,
      unselectedItemColor: AppColors.textTertiaryDark,
      selectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w400,
      ),
      type: BottomNavigationBarType.fixed,
      elevation: 8,
    ),
    
    // Card Theme
    cardTheme: CardTheme(
      color: AppColors.surfaceDark,
      elevation: 2,
      shadowColor: AppColors.shadowDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      margin: const EdgeInsets.all(AppConfig.smallPadding),
    ),
    
    // Elevated Button Theme
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        elevation: 2,
        shadowColor: AppColors.shadowDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.largePadding,
          vertical: AppConfig.defaultPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Outlined Button Theme
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side: const BorderSide(color: AppColors.primary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.largePadding,
          vertical: AppConfig.defaultPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Text Button Theme
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppConfig.defaultPadding,
          vertical: AppConfig.smallPadding,
        ),
        textStyle: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    ),
    
    // Input Decoration Theme
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.surfaceVariantDark,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.borderDark),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.borderDark),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
        borderSide: const BorderSide(color: AppColors.error, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppConfig.defaultPadding,
        vertical: AppConfig.defaultPadding,
      ),
      hintStyle: const TextStyle(
        color: AppColors.textTertiaryDark,
        fontSize: 16,
      ),
      labelStyle: const TextStyle(
        color: AppColors.textSecondaryDark,
        fontSize: 16,
      ),
      errorStyle: const TextStyle(
        color: AppColors.error,
        fontSize: 12,
      ),
    ),
    
    // Floating Action Button Theme
    floatingActionButtonTheme: const FloatingActionButtonThemeData(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.white,
      elevation: 6,
      shape: CircleBorder(),
    ),
    
    // Chip Theme
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.surfaceVariantDark,
      selectedColor: AppColors.primaryDark,
      disabledColor: AppColors.disabledDark,
      labelStyle: const TextStyle(
        color: AppColors.textPrimaryDark,
        fontSize: 14,
      ),
      secondaryLabelStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppConfig.smallPadding,
        vertical: AppConfig.smallPadding / 2,
      ),
    ),
    
    // Divider Theme
    dividerTheme: const DividerThemeData(
      color: AppColors.dividerDark,
      thickness: 1,
      space: 1,
    ),
    
    // Icon Theme
    iconTheme: const IconThemeData(
      color: AppColors.textPrimaryDark,
      size: AppConfig.defaultIconSize,
    ),
    
    // Primary Icon Theme
    primaryIconTheme: const IconThemeData(
      color: AppColors.primary,
      size: AppConfig.defaultIconSize,
    ),
    
    // Switch Theme
    switchTheme: SwitchThemeData(
      thumbColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.gray600;
      }),
      trackColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primaryDark;
        }
        return AppColors.gray700;
      }),
    ),
    
    // Checkbox Theme
    checkboxTheme: CheckboxThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.transparent;
      }),
      checkColor: MaterialStateProperty.all(AppColors.white),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
    ),
    
    // Radio Theme
    radioTheme: RadioThemeData(
      fillColor: MaterialStateProperty.resolveWith((states) {
        if (states.contains(MaterialState.selected)) {
          return AppColors.primary;
        }
        return AppColors.gray600;
      }),
    ),
    
    // Slider Theme
    sliderTheme: SliderThemeData(
      activeTrackColor: AppColors.primary,
      inactiveTrackColor: AppColors.gray700,
      thumbColor: AppColors.primary,
      overlayColor: AppColors.primaryDark,
      valueIndicatorColor: AppColors.primary,
      valueIndicatorTextStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
    ),
    
    // Progress Indicator Theme
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.primary,
      linearTrackColor: AppColors.gray700,
      circularTrackColor: AppColors.gray700,
    ),
    
    // Dialog Theme
    dialogTheme: DialogTheme(
      backgroundColor: AppColors.surfaceDark,
      elevation: 8,
      shadowColor: AppColors.shadowDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.largeRadius),
      ),
      titleTextStyle: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimaryDark,
      ),
      contentTextStyle: const TextStyle(
        fontSize: 16,
        color: AppColors.textSecondaryDark,
      ),
    ),
    
    // Snackbar Theme
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.gray800,
      contentTextStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 16,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      behavior: SnackBarBehavior.floating,
    ),
    
    // Bottom Sheet Theme
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.surfaceDark,
      elevation: 8,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppConfig.largeRadius),
        ),
      ),
    ),
    
    // Tab Bar Theme
    tabBarTheme: const TabBarTheme(
      labelColor: AppColors.primary,
      unselectedLabelColor: AppColors.textTertiaryDark,
      indicatorColor: AppColors.primary,
      indicatorSize: TabBarIndicatorSize.tab,
      labelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
      ),
      unselectedLabelStyle: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w400,
      ),
    ),
    
    // Expansion Tile Theme
    expansionTileTheme: const ExpansionTileThemeData(
      backgroundColor: AppColors.surfaceDark,
      collapsedBackgroundColor: AppColors.surfaceVariantDark,
      textColor: AppColors.textPrimaryDark,
      iconColor: AppColors.textPrimaryDark,
      collapsedTextColor: AppColors.textSecondaryDark,
      collapsedIconColor: AppColors.textSecondaryDark,
    ),
    
    // List Tile Theme
    listTileTheme: const ListTileThemeData(
      contentPadding: EdgeInsets.symmetric(
        horizontal: AppConfig.defaultPadding,
        vertical: AppConfig.smallPadding,
      ),
      titleTextStyle: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w500,
        color: AppColors.textPrimaryDark,
      ),
      subtitleTextStyle: TextStyle(
        fontSize: 14,
        color: AppColors.textSecondaryDark,
      ),
      leadingAndTrailingTextStyle: TextStyle(
        fontSize: 14,
        color: AppColors.textTertiaryDark,
      ),
    ),
    
    // Data Table Theme
    dataTableTheme: DataTableThemeData(
      headingTextStyle: const TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: AppColors.textPrimaryDark,
      ),
      dataTextStyle: const TextStyle(
        fontSize: 14,
        color: AppColors.textSecondaryDark,
      ),
      dividerThickness: 1,
      columnSpacing: 16,
      horizontalMargin: AppConfig.defaultPadding,
    ),
    
    // Tooltip Theme
    tooltipTheme: TooltipThemeData(
      decoration: BoxDecoration(
        color: AppColors.gray800,
        borderRadius: BorderRadius.circular(AppConfig.smallRadius),
      ),
      textStyle: const TextStyle(
        color: AppColors.white,
        fontSize: 14,
      ),
    ),
    
    // Popup Menu Theme
    popupMenuTheme: PopupMenuThemeData(
      color: AppColors.surfaceDark,
      elevation: 8,
      shadowColor: AppColors.shadowDark,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppConfig.defaultRadius),
      ),
      textStyle: const TextStyle(
        fontSize: 16,
        color: AppColors.textPrimaryDark,
      ),
    ),
    
    // Navigation Drawer Theme
    navigationDrawerTheme: NavigationDrawerThemeData(
      backgroundColor: AppColors.surfaceDark,
      elevation: 8,
      shadowColor: AppColors.shadowDark,
      indicatorColor: AppColors.primaryDark,
      tileHeight: 56,
      labelTextStyle: MaterialStateProperty.all(
        const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.w500,
          color: AppColors.textPrimaryDark,
        ),
      ),
    ),
    
    // Navigation Rail Theme
    navigationRailTheme: const NavigationRailThemeData(
      backgroundColor: AppColors.surfaceDark,
      selectedIconTheme: IconThemeData(
        color: AppColors.primary,
        size: AppConfig.defaultIconSize,
      ),
      unselectedIconTheme: IconThemeData(
        color: AppColors.textTertiaryDark,
        size: AppConfig.defaultIconSize,
      ),
      selectedLabelTextStyle: TextStyle(
        fontSize: 12,
        fontWeight: FontWeight.w600,
        color: AppColors.primary,
      ),
      unselectedLabelTextStyle: TextStyle(
        fontSize: 12,
        color: AppColors.textTertiaryDark,
      ),
      indicatorColor: AppColors.primaryDark,
    ),
    
    // Material 3 specific
    cardColor: AppColors.surfaceDark,
    scaffoldBackgroundColor: AppColors.surfaceDark,
    canvasColor: AppColors.surfaceDark,
    shadowColor: AppColors.shadowDark,
    splashColor: AppColors.primaryDark,
    highlightColor: AppColors.primaryDark,
    focusColor: AppColors.primaryDark,
    hoverColor: AppColors.primaryDark,
    disabledColor: AppColors.disabledDark,
    unselectedWidgetColor: AppColors.textTertiaryDark,
    selectedRowColor: AppColors.selectionDark,
    dividerColor: AppColors.dividerDark,
  );
}

// Text Theme
TextTheme _createTextTheme() {
  return const TextTheme(
    displayLarge: TextStyle(
      fontSize: 57,
      fontWeight: FontWeight.w400,
      letterSpacing: -0.25,
      color: AppColors.textPrimary,
    ),
    displayMedium: TextStyle(
      fontSize: 45,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    displaySmall: TextStyle(
      fontSize: 36,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    headlineLarge: TextStyle(
      fontSize: 32,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    headlineMedium: TextStyle(
      fontSize: 28,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    headlineSmall: TextStyle(
      fontSize: 24,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    titleLarge: TextStyle(
      fontSize: 22,
      fontWeight: FontWeight.w400,
      letterSpacing: 0,
      color: AppColors.textPrimary,
    ),
    titleMedium: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.15,
      color: AppColors.textPrimary,
    ),
    titleSmall: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: AppColors.textPrimary,
    ),
    bodyLarge: TextStyle(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.5,
      color: AppColors.textPrimary,
    ),
    bodyMedium: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.25,
      color: AppColors.textPrimary,
    ),
    bodySmall: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      letterSpacing: 0.4,
      color: AppColors.textSecondary,
    ),
    labelLarge: TextStyle(
      fontSize: 14,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      color: AppColors.textPrimary,
    ),
    labelMedium: TextStyle(
      fontSize: 12,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: AppColors.textPrimary,
    ),
    labelSmall: TextStyle(
      fontSize: 11,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.5,
      color: AppColors.textSecondary,
    ),
  );
}