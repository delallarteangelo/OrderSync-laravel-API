import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'secondary_button.dart';

/// ErrorState — Design.md §4.12.
class ErrorState extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback? onRetry;
  const ErrorState({
    super.key,
    this.title = 'Something went wrong',
    this.description = 'Please check your connection and try again.',
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error_outline_rounded,
            size: 32,
            color: AppColors.statusRejected,
          ),
          const SizedBox(height: 12),
          Text(title, style: AppTypography.textTheme.titleLarge),
          const SizedBox(height: 8),
          Text(
            description,
            textAlign: TextAlign.center,
            style: AppTypography.textTheme.bodyMedium?.copyWith(
              color: AppColors.neutralInkSecondary,
            ),
          ),
          const SizedBox(height: 20),
          SecondaryButton(
            label: 'Try again',
            onPressed: onRetry,
            expand: false,
          ),
        ],
      ),
    );
  }
}
