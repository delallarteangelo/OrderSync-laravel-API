import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// CategoryTile — Design.md §4.7 (home circular tile).
class CategoryTile extends StatelessWidget {
  final Category category;
  final VoidCallback? onTap;
  const CategoryTile({super.key, required this.category, this.onTap});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadii.brMd,
      child: SizedBox(
        width: 86,
        child: Column(
          children: [
            Container(
              width: 70,
              height: 70,
              decoration: BoxDecoration(
                color: category.tint,
                borderRadius: AppRadii.brFull,
              ),
              child: Icon(
                category.icon,
                size: 32,
                color: AppColors.neutralInkBlack,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              category.name,
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.textTheme.labelSmall,
            ),
          ],
        ),
      ),
    );
  }
}
