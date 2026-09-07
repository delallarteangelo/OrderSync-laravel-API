// Design.md §5.15 — Order confirmation screen
import 'package:flutter/material.dart';

import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/secondary_button.dart';

class OrderConfirmationScreen extends StatelessWidget {
  const OrderConfirmationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(),
              Center(
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: const BoxDecoration(
                    color: AppColors.brandPrimarySurface,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    size: 80,
                    color: AppColors.brandPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Order placed!',
                textAlign: TextAlign.center,
                style: AppTypography.textTheme.headlineMedium,
              ),
              const SizedBox(height: 8),
              Text(
                'Your order #1207 has been placed successfully. We will notify you when it is ready.',
                textAlign: TextAlign.center,
                style: AppTypography.textTheme.bodyMedium?.copyWith(
                  color: AppColors.neutralInkSecondary,
                ),
              ),
              const Spacer(),
              PrimaryButton(
                label: 'Track order',
                onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil(
                  AppRoutes.orderTracking,
                  (_) => false,
                ),
              ),
              const SizedBox(height: 10),
              SecondaryButton(
                label: 'Continue shopping',
                onPressed: () => Navigator.of(
                  context,
                ).pushNamedAndRemoveUntil(AppRoutes.home, (_) => false),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
