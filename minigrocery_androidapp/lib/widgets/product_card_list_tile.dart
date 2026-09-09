import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// ProductCardListTile — Design.md §4.6 (list variant).
class ProductCardListTile extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAdd;
  final Widget? trailing;

  const ProductCardListTile({
    super.key,
    required this.product,
    this.onTap,
    this.onAdd,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadii.brMd,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
        child: Row(
          children: [
            ClipRRect(
              borderRadius: AppRadii.brMd,
              child: Container(
                width: 64,
                height: 64,
                color: AppColors.neutralSurfaceAlt,
                child: Image(
                  image: product.image,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.shopping_basket_outlined),
                ),
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: AppTypography.textTheme.titleLarge,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${product.unit} · ₱${product.price.toStringAsFixed(2)}',
                    style: AppTypography.textTheme.bodySmall,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(
                        Icons.star_rounded,
                        size: 14,
                        color: AppColors.brandAccentYellowBold,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '${product.rating}',
                        style: AppTypography.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),
            if (trailing != null)
              trailing!
            else if (onAdd != null)
              IconButton(
                onPressed: onAdd,
                icon: const Icon(Icons.add_circle_rounded),
                color: AppColors.brandPrimary,
              ),
          ],
        ),
      ),
    );
  }
}
