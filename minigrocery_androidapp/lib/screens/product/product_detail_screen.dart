// Design.md §5.10 — Product detail screen
import 'package:flutter/material.dart';

import '../../mock/models.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_icon_button.dart';
import '../../widgets/app_snack_bar.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/quantity_stepper.dart';

class ProductDetailScreen extends StatelessWidget {
  final Product product;
  const ProductDetailScreen({super.key, required this.product});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurfaceAlt,
      body: Stack(
        children: [
          Positioned.fill(
            child: Column(
              children: [
                SizedBox(
                  height: 360,
                  width: double.infinity,
                  child: Image(
                    image: product.image,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: AppColors.neutralSurfaceAlt,
                      child: const Icon(
                        Icons.shopping_basket_outlined,
                        size: 64,
                        color: AppColors.neutralInkSecondary,
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: Transform.translate(
                    offset: const Offset(0, -20),
                    child: Container(
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: AppColors.neutralSurface,
                        borderRadius: BorderRadius.only(
                          topLeft: AppRadii.xl,
                          topRight: AppRadii.xl,
                        ),
                      ),
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
                      child: SingleChildScrollView(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    product.name,
                                    style:
                                        AppTypography.textTheme.headlineSmall,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                QuantityStepper(initial: 1),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                const Icon(
                                  Icons.star_rounded,
                                  size: 18,
                                  color: AppColors.brandAccentYellowBold,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${product.rating}',
                                  style: AppTypography.textTheme.titleMedium,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '(${product.reviewCount} reviews)',
                                  style: AppTypography.textTheme.bodySmall,
                                ),
                                const SizedBox(width: 16),
                                const Icon(
                                  Icons.inventory_2_outlined,
                                  size: 16,
                                  color: AppColors.neutralInkSecondary,
                                ),
                                const SizedBox(width: 4),
                                Text(
                                  '${product.stock} in stock',
                                  style: AppTypography.textTheme.bodySmall,
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              '₱${product.price.toStringAsFixed(2)}',
                              style: AppTypography.textTheme.headlineMedium
                                  ?.copyWith(color: AppColors.brandPrimary),
                            ),
                            Text(
                              'per ${product.unit}',
                              style: AppTypography.textTheme.bodySmall,
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'Description',
                              style: AppTypography.textTheme.titleLarge,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              product.description,
                              style: AppTypography.textTheme.bodyMedium,
                            ),
                            const SizedBox(height: 100),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Top icons
          Positioned(
            top: MediaQuery.of(context).padding.top + 12,
            left: 20,
            right: 20,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                AppIconButton(
                  icon: Icons.arrow_back_ios_new_rounded,
                  onPressed: () => Navigator.of(context).pop(),
                ),
                AppIconButton(
                  icon: Icons.favorite_border_rounded,
                  onPressed: () =>
                      AppSnackBar.showSuccess(context, 'Added to favorites'),
                ),
              ],
            ),
          ),
          // Bottom add-to-cart bar
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              decoration: const BoxDecoration(
                color: AppColors.neutralSurface,
                border: Border(top: BorderSide(color: AppColors.neutralBorder)),
              ),
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
              child: SafeArea(
                top: false,
                child: Row(
                  children: [
                    Expanded(
                      child: PrimaryButton(
                        icon: Icons.shopping_cart_outlined,
                        label: 'Add to cart',
                        onPressed: () {
                          AppSnackBar.showSuccess(context, 'Added to cart');
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: PrimaryButton(
                        label: 'Buy now',
                        onPressed: () =>
                            Navigator.of(context).pushNamed(AppRoutes.checkout),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
