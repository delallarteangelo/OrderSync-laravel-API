import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_radii.dart';
import 'app_typography.dart';

/// Material 3 ThemeData — Design.md §6.2.
class AppTheme {
  AppTheme._();

  static const ColorScheme _lightScheme = ColorScheme(
    brightness: Brightness.light,
    primary: AppColors.brandPrimary,
    onPrimary: AppColors.onBrand,
    primaryContainer: AppColors.brandPrimarySurface,
    onPrimaryContainer: AppColors.neutralInkBlack,
    secondary: AppColors.brandAccentYellowBold,
    onSecondary: AppColors.neutralInkBlack,
    secondaryContainer: AppColors.brandAccentYellow,
    onSecondaryContainer: AppColors.neutralInkBlack,
    tertiary: AppColors.surfaceNavy,
    onTertiary: AppColors.onBrand,
    error: AppColors.statusRejected,
    onError: AppColors.onBrand,
    surface: AppColors.neutralSurface,
    onSurface: AppColors.neutralInkBlack,
    surfaceContainerHighest: AppColors.neutralSurfaceAlt,
    onSurfaceVariant: AppColors.neutralInkSecondary,
    outline: AppColors.neutralBorder,
    outlineVariant: AppColors.neutralStrokeMuted,
    shadow: Colors.black,
    scrim: Colors.black,
    inverseSurface: AppColors.surfaceNavy,
    onInverseSurface: AppColors.onBrand,
    inversePrimary: AppColors.brandPrimarySurface,
  );

  static final ThemeData light = ThemeData(
    useMaterial3: true,
    colorScheme: _lightScheme,
    scaffoldBackgroundColor: AppColors.neutralSurface,
    textTheme: AppTypography.textTheme,
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.neutralSurface,
      foregroundColor: AppColors.neutralInkBlack,
      elevation: 0,
      scrolledUnderElevation: 0,
      centerTitle: true,
      titleTextStyle: AppTypography.textTheme.titleLarge,
      surfaceTintColor: Colors.transparent,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandPrimary,
        foregroundColor: AppColors.onBrand,
        minimumSize: const Size.fromHeight(48),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.brXs),
        textStyle: AppTypography.textTheme.labelLarge,
        elevation: 0,
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.neutralInkBlack,
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: AppColors.neutralBorder),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.brXs),
        textStyle: AppTypography.textTheme.labelLarge,
      ),
    ),
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.brandPrimary,
        minimumSize: const Size(48, 48),
        textStyle: AppTypography.textTheme.labelLarge,
      ),
    ),
    iconButtonTheme: IconButtonThemeData(
      style: IconButton.styleFrom(
        foregroundColor: AppColors.neutralInkBlack,
        minimumSize: const Size(48, 48),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: AppColors.neutralSurfaceAlt,
      contentPadding: const EdgeInsets.symmetric(horizontal: 25, vertical: 14),
      hintStyle: AppTypography.textTheme.bodyMedium?.copyWith(
        color: AppColors.neutralInkSecondary,
      ),
      labelStyle: AppTypography.textTheme.bodyMedium,
      border: const OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: BorderSide.none,
      ),
      enabledBorder: const OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: BorderSide.none,
      ),
      focusedBorder: const OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: BorderSide(color: AppColors.brandPrimary, width: 1.5),
      ),
      errorBorder: const OutlineInputBorder(
        borderRadius: AppRadii.brMd,
        borderSide: BorderSide(color: AppColors.statusRejected),
      ),
    ),
    cardTheme: const CardThemeData(
      color: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: AppRadii.brLg),
      margin: EdgeInsets.zero,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.neutralSurfaceAlt,
      selectedColor: AppColors.brandPrimary,
      labelStyle: AppTypography.textTheme.labelMedium!,
      secondaryLabelStyle: AppTypography.textTheme.labelMedium!.copyWith(
        color: AppColors.onBrand,
      ),
      side: BorderSide.none,
      shape: const StadiumBorder(),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      backgroundColor: AppColors.neutralSurface,
      selectedItemColor: AppColors.brandPrimary,
      unselectedItemColor: AppColors.neutralInkSecondary,
      type: BottomNavigationBarType.fixed,
      elevation: 0,
      showUnselectedLabels: true,
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: AppColors.brandPrimary,
      contentTextStyle: AppTypography.textTheme.labelLarge?.copyWith(
        color: AppColors.onBrand,
      ),
      behavior: SnackBarBehavior.floating,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brSm),
    ),
    dialogTheme: DialogThemeData(
      backgroundColor: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brLg),
      titleTextStyle: AppTypography.textTheme.titleLarge,
      contentTextStyle: AppTypography.textTheme.bodyMedium,
    ),
    bottomSheetTheme: const BottomSheetThemeData(
      backgroundColor: AppColors.neutralSurface,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: AppRadii.brSheetTop),
      modalElevation: 0,
    ),
    dividerTheme: const DividerThemeData(
      color: AppColors.neutralBorder,
      thickness: 1,
      space: 0,
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color: AppColors.brandPrimary,
    ),
  );
}
