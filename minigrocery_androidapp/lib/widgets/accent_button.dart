import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// AccentButton — Design.md §4.3 (yellow promo CTA).
class AccentButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final bool expand;

  const AccentButton({
    super.key,
    required this.label,
    this.onPressed,
    this.expand = false,
  });

  @override
  Widget build(BuildContext context) {
    final button = ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.brandAccentYellowBold,
        foregroundColor: AppColors.neutralInkBlack,
        minimumSize: const Size.fromHeight(48),
        shape: RoundedRectangleBorder(
          borderRadius: AppRadii.brXs,
          side: const BorderSide(
            color: AppColors.brandAccentYellowBold,
            width: 2,
          ),
        ),
        elevation: 0,
      ),
      child: Text(
        label,
        style: AppTypography.textTheme.labelLarge?.copyWith(
          color: AppColors.neutralInkBlack,
        ),
      ),
    );
    return expand ? SizedBox(width: double.infinity, child: button) : button;
  }
}
