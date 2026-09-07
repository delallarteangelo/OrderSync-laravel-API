import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// CategoryChip — Design.md §4.7 (filter variant).
class CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback? onTap;
  const CategoryChip({
    super.key,
    required this.label,
    this.selected = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.brandPrimary : AppColors.neutralSurfaceAlt,
      borderRadius: AppRadii.brPill,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadii.brPill,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          child: Text(
            label,
            style: AppTypography.textTheme.labelMedium?.copyWith(
              color: selected ? AppColors.onBrand : AppColors.neutralInkBlack,
            ),
          ),
        ),
      ),
    );
  }
}
