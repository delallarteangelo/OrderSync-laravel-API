// Design.md §5.11 — Cart tab
import 'package:flutter/material.dart';

import '../../mock/mock_cart.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/cart_item_row.dart';
import '../../widgets/empty_state.dart';
import '../../widgets/primary_button.dart';

class CartTab extends StatelessWidget {
  const CartTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'My Cart'),
      body: mockCart.isEmpty
          ? EmptyState(
              icon: Icons.shopping_cart_outlined,
              title: 'Your cart is empty',
              description:
                  'Browse our store and add fresh items to get started.',
              actionLabel: 'Start shopping',
              onAction: () => Navigator.of(
                context,
              ).pushNamedAndRemoveUntil(AppRoutes.home, (_) => false),
            )
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    itemCount: mockCart.length,
                    separatorBuilder: (_, __) => const Divider(height: 1),
                    itemBuilder: (_, i) => CartItemRow(line: mockCart[i]),
                  ),
                ),
                Container(
                  decoration: const BoxDecoration(
                    color: AppColors.neutralSurface,
                    border: Border(
                      top: BorderSide(color: AppColors.neutralBorder),
                    ),
                  ),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                  child: SafeArea(
                    top: false,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _row(
                          'Subtotal',
                          '₱${mockCartSubtotal.toStringAsFixed(2)}',
                        ),
                        const SizedBox(height: 6),
                        _row(
                          'Delivery fee',
                          '₱${mockDeliveryFee.toStringAsFixed(2)}',
                        ),
                        const SizedBox(height: 10),
                        const Divider(height: 1),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Total',
                              style: AppTypography.textTheme.titleLarge,
                            ),
                            Text(
                              '₱${mockCartTotal.toStringAsFixed(2)}',
                              style: AppTypography.textTheme.titleLarge
                                  ?.copyWith(color: AppColors.brandPrimary),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),
                        PrimaryButton(
                          label: 'Proceed to checkout',
                          onPressed: () => Navigator.of(
                            context,
                          ).pushNamed(AppRoutes.checkout),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _row(String label, String value) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(
        label,
        style: AppTypography.textTheme.bodyMedium?.copyWith(
          color: AppColors.neutralInkSecondary,
        ),
      ),
      Text(value, style: AppTypography.textTheme.bodyMedium),
    ],
  );
}
