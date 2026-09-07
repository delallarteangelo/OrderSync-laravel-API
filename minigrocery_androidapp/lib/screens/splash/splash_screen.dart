// Design.md §5.1 — Splash screen
import 'dart:async';
import 'package:flutter/material.dart';

import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 2500), () {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.onboarding);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.brandPrimary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: const BoxDecoration(
                color: AppColors.neutralSurface,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.storefront_rounded,
                size: 64,
                color: AppColors.brandPrimary,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              "Tonette's Minimart",
              style: AppTypography.textTheme.headlineMedium?.copyWith(
                color: AppColors.onBrand,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              'Fresh. Fast. Local.',
              style: AppTypography.textTheme.bodyLarge?.copyWith(
                color: AppColors.onBrand,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
