import 'package:flutter/material.dart';

/// Color tokens — verbatim from Design.md §3.1.
class AppColors {
  AppColors._();

  // Brand
  static const Color brandPrimary = Color(0xFF0CA201);
  static const Color brandPrimarySurface = Color(0xFFD7FFD4);
  static const Color brandAccentYellow = Color(0xFFFFDB24);
  static const Color brandAccentYellowBold = Color(0xFFFFD500);
  static const Color brandAccentAmber = Color(0xFFFBB400);

  // Neutral
  static const Color neutralSurface = Color(0xFFFFFFFF);
  static const Color neutralSurfaceAlt = Color(0xFFF6F6F6);
  static const Color neutralBorder = Color(0xFFECECEC);
  static const Color neutralStrokeMuted = Color(0xFF726C6C);
  static const Color neutralInk = Color(0xFF0A0B0A);
  static const Color neutralInkBlack = Color(0xFF000000);
  static const Color neutralInkSecondary = Color(0xFF5A5555);

  // Surfaces
  static const Color surfaceNavy = Color(0xFF170E2B);
  static const Color onBrand = Color(0xFFFFFFFF);

  // Shadows
  static const Color shadowSoft = Color(0x0D000000); // rgba(0,0,0,0.05)
  static const Color shadowMedium = Color(0x12000000); // rgba(0,0,0,0.07)
  static const Color shadowStrong = Color(0x1A000000); // rgba(0,0,0,0.10)

  // Order status (derived — see Design.md §9)
  static const Color statusPending = brandAccentAmber;
  static const Color statusConfirmed = brandPrimary;
  static const Color statusPreparing = Color(0xFF2D8CFF);
  static const Color statusReadyForPickup = Color(0xFF7A5AF8);
  static const Color statusCompleted = Color(0xFF0A7A02);
  static const Color statusRejected = Color(0xFFD7263D);
  static const Color statusCancelled = neutralInkSecondary;
}
