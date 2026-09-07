import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';
import 'quantity_stepper.dart';

/// CartItemRow — Design.md §4.8.
class CartItemRow extends StatelessWidget {
  final CartLine line;
  final VoidCallback? onRemove;
  const CartItemRow({super.key, required this.line, this.onRemove});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          ClipRRect(
            borderRadius: AppRadii.brMd,
            child: Container(
              width: 64,
              height: 64,
              color: AppColors.neutralSurfaceAlt,
              child: Image(
                image: line.product.image,
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
                  line.product.name,
                  style: AppTypography.textTheme.titleLarge,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Text(
                  line.product.unit,
                  style: AppTypography.textTheme.bodySmall,
                ),
                const SizedBox(height: 6),
                Text(
                  '₱${line.product.price.toStringAsFixed(2)}',
                  style: AppTypography.textTheme.titleMedium?.copyWith(
                    color: AppColors.brandPrimary,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              IconButton(
                onPressed: onRemove,
                icon: const Icon(
                  Icons.delete_outline_rounded,
                  color: AppColors.neutralInkSecondary,
                ),
                visualDensity: VisualDensity.compact,
                tooltip: 'Remove',
              ),
              QuantityStepper(initial: line.quantity, min: 1),
            ],
          ),
        ],
      ),
    );
  }
}
