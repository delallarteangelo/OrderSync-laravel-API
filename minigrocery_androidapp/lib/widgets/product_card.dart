import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_shadows.dart';
import '../theme/app_typography.dart';
import 'app_icon_button.dart';

/// ProductCard (grid variant) — Design.md §4.5.
class ProductCard extends StatelessWidget {
  final Product product;
  final VoidCallback? onTap;
  final VoidCallback? onAdd;

  const ProductCard({super.key, required this.product, this.onTap, this.onAdd});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: AppColors.neutralSurface,
      borderRadius: AppRadii.brLg,
      child: InkWell(
        onTap: onTap,
        borderRadius: AppRadii.brLg,
        child: Padding(
          padding: const EdgeInsets.all(5),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image area
              Flexible(
                child: AspectRatio(
                  aspectRatio: 160 / 147,
                  child: Container(
                    decoration: const BoxDecoration(
                      color: AppColors.neutralSurfaceAlt,
                      borderRadius: AppRadii.brMd,
                    ),
                    child: ClipRRect(
                      borderRadius: AppRadii.brMd,
                      child: Image(
                        image: product.image,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.shopping_basket_outlined,
                          color: AppColors.neutralInkSecondary,
                          size: 40,
                        ),
                        loadingBuilder: (_, child, p) => p == null
                            ? child
                            : const Center(
                                child: SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                  ),
                                ),
                              ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppTypography.textTheme.titleLarge,
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
                          '${product.rating} (${product.reviewCount})',
                          style: AppTypography.textTheme.bodyMedium?.copyWith(
                            color: AppColors.neutralInkSecondary,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: Text(
                        '₱${product.price.toStringAsFixed(2)}',
                        style: AppTypography.textTheme.titleLarge,
                      ),
                    ),
                    Container(
                      decoration: const BoxDecoration(
                        borderRadius: AppRadii.brPill,
                        boxShadow: AppShadows.shadow2,
                      ),
                      child: AppIconButton(
                        icon: Icons.add_rounded,
                        onPressed: onAdd,
                        background: AppColors.brandPrimary,
                        foreground: AppColors.onBrand,
                        elevated: false,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 5),
            ],
          ),
        ),
      ),
    );
  }
}
