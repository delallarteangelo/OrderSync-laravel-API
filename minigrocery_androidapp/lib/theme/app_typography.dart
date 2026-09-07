import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Typography tokens — verbatim from Design.md §3.2.
class AppTypography {
  AppTypography._();

  static TextStyle _inter({
    required double size,
    required FontWeight weight,
    required double height,
    double letterSpacing = 0,
    Color color = AppColors.neutralInkBlack,
  }) => GoogleFonts.inter(
    fontSize: size,
    fontWeight: weight,
    height: height / size,
    letterSpacing: letterSpacing,
    color: color,
  );

  static final TextTheme textTheme = TextTheme(
    displayLarge: _inter(
      size: 32,
      weight: FontWeight.w700,
      height: 38,
      letterSpacing: -0.5,
    ),
    displayMedium: _inter(
      size: 28,
      weight: FontWeight.w700,
      height: 34,
      letterSpacing: -0.25,
    ),
    headlineLarge: _inter(size: 24, weight: FontWeight.w700, height: 28),
    headlineMedium: _inter(size: 20, weight: FontWeight.w700, height: 24),
    headlineSmall: _inter(size: 18, weight: FontWeight.w600, height: 22),
    titleLarge: _inter(size: 16, weight: FontWeight.w600, height: 19),
    titleMedium: _inter(
      size: 14,
      weight: FontWeight.w600,
      height: 17,
      letterSpacing: 0.1,
    ),
    titleSmall: _inter(
      size: 13,
      weight: FontWeight.w600,
      height: 16,
      letterSpacing: 0.1,
    ),
    bodyLarge: _inter(
      size: 16,
      weight: FontWeight.w500,
      height: 20,
      letterSpacing: 0.15,
    ),
    bodyMedium: _inter(
      size: 14,
      weight: FontWeight.w500,
      height: 20,
      letterSpacing: 0.25,
    ),
    bodySmall: _inter(
      size: 12,
      weight: FontWeight.w500,
      height: 15,
      letterSpacing: 0.4,
      color: AppColors.neutralInkSecondary,
    ),
    labelLarge: _inter(
      size: 14,
      weight: FontWeight.w600,
      height: 20,
      letterSpacing: 0.1,
    ),
    labelMedium: _inter(
      size: 13,
      weight: FontWeight.w600,
      height: 16,
      letterSpacing: 0.5,
    ),
    labelSmall: _inter(
      size: 12,
      weight: FontWeight.w600,
      height: 15,
      letterSpacing: 0.5,
      color: AppColors.neutralInkSecondary,
    ),
  );
}
