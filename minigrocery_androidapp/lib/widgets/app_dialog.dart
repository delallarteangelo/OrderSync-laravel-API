import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';
import 'primary_button.dart';

/// AppDialog helper — Design.md §4.15.
Future<T?> showAppDialog<T>({
  required BuildContext context,
  required String title,
  required String message,
  String? confirmLabel,
  String cancelLabel = 'Cancel',
  VoidCallback? onConfirm,
}) {
  return showDialog<T>(
    context: context,
    builder: (ctx) => Dialog(
      backgroundColor: AppColors.neutralSurface,
      shape: const RoundedRectangleBorder(borderRadius: AppRadii.brLg),
      child: Padding(
        padding: const EdgeInsets.fromLTRB(24, 24, 24, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: AppTypography.textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              message,
              style: AppTypography.textTheme.bodyMedium?.copyWith(
                color: AppColors.neutralInkSecondary,
              ),
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: Text(cancelLabel),
                ),
                const SizedBox(width: 8),
                if (confirmLabel != null)
                  PrimaryButton(
                    label: confirmLabel,
                    expand: false,
                    onPressed: () {
                      Navigator.of(ctx).pop();
                      onConfirm?.call();
                    },
                  ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}
