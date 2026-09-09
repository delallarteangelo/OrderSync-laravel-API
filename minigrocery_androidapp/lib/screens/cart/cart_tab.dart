import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
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
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final cart = store.cart;
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: const AppPrimaryAppBar(title: 'My Cart'),
          body: cart.isEmpty
              ? EmptyState(
                  icon: Icons.shopping_cart_outlined,
                  title: 'Your cart is empty',
                  description:
                      'Browse this store and add products to get started.',
                )
              : Column(
                  children: [
                    Expanded(
                      child: ListView.separated(
                        itemCount: cart.length,
                        separatorBuilder: (_, _) => const Divider(height: 1),
                        itemBuilder: (_, index) {
                          final line = cart[index];
                          return CartItemRow(
                            line: line,
                            onRemove: () => store.remove(line.product.id),
                            onQuantityChanged: (value) =>
                                store.setQuantity(line.product, value),
                          );
                        },
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
                      decoration: const BoxDecoration(
                        border: Border(
                          top: BorderSide(color: AppColors.neutralBorder),
                        ),
                      ),
                      child: SafeArea(
                        top: false,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Pickup total',
                                  style: AppTypography.textTheme.titleLarge,
                                ),
                                Text(
                                  '₱${store.total.toStringAsFixed(2)}',
                                  style: AppTypography.textTheme.titleLarge
                                      ?.copyWith(color: AppColors.brandPrimary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 14),
                            PrimaryButton(
                              label: 'Review pickup order',
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
      },
    );
  }
}
