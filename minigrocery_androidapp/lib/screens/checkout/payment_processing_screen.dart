// Design.md §5.14 — Payment processing screen
import 'dart:async';
import 'package:flutter/material.dart';

import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';

class PaymentProcessingScreen extends StatefulWidget {
  const PaymentProcessingScreen({super.key});
  @override
  State<PaymentProcessingScreen> createState() =>
      _PaymentProcessingScreenState();
}

class _PaymentProcessingScreenState extends State<PaymentProcessingScreen> {
  @override
  void initState() {
    super.initState();
    Timer(const Duration(milliseconds: 2200), () {
      if (mounted) {
        Navigator.of(context).pushReplacementNamed(AppRoutes.orderConfirmation);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      body: SafeArea(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const SizedBox(
                width: 64,
                height: 64,
                child: CircularProgressIndicator(
                  strokeWidth: 5,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    AppColors.brandPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Processing payment…',
                style: AppTypography.textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              Text(
                'Please wait while we confirm your order.',
                style: AppTypography.textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutralInkSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
