import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// SecondaryButton — Design.md §4.3.
class SecondaryButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool expand;

  const SecondaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.icon,
    this.expand = true,
  });

  @override
  Widget build(BuildContext context) {
    final button = OutlinedButton(
      onPressed: onPressed,
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.neutralInkBlack,
        backgroundColor: AppColors.neutralSurface,
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: AppColors.neutralBorder),
        shape: const RoundedRectangleBorder(borderRadius: AppRadii.brXs),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 18, color: AppColors.neutralInkBlack),
            const SizedBox(width: 8),
          ],
          Text(
            label,
            style: AppTypography.textTheme.labelLarge?.copyWith(
              color: AppColors.neutralInkBlack,
            ),
          ),
        ],
      ),
    );

    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
