import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// AppSnackBar helpers — Design.md §4.13.
class AppSnackBar {
  AppSnackBar._();

  static void showSuccess(BuildContext context, String message) => _show(
    context,
    message,
    bg: AppColors.brandPrimary,
    icon: Icons.check_circle_rounded,
  );

  static void showError(BuildContext context, String message) => _show(
    context,
    message,
    bg: AppColors.statusRejected,
    icon: Icons.error_rounded,
  );

  static void showInfo(BuildContext context, String message) => _show(
    context,
    message,
    bg: AppColors.surfaceNavy,
    icon: Icons.info_outline_rounded,
  );

  static void _show(
    BuildContext context,
    String message, {
    required Color bg,
    required IconData icon,
  }) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(
          behavior: SnackBarBehavior.floating,
          backgroundColor: bg,
          shape: const RoundedRectangleBorder(borderRadius: AppRadii.brSm),
          margin: const EdgeInsets.fromLTRB(16, 16, 16, 24),
          content: Row(
            children: [
              Icon(icon, color: AppColors.onBrand, size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  message,
                  style: AppTypography.textTheme.labelLarge?.copyWith(
                    color: AppColors.onBrand,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
  }
}
