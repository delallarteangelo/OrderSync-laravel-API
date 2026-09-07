// Design.md §5.12 — Checkout screen
import 'package:flutter/material.dart';

import '../../mock/mock_cart.dart';
import '../../mock/mock_user.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/primary_button.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Checkout', showBack: true),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Delivery address'),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.location_on_rounded,
                      color: AppColors.brandPrimary,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        mockUser.address.full,
                        style: AppTypography.textTheme.bodyMedium,
                      ),
                    ),
                    TextButton(onPressed: () {}, child: const Text('Change')),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _sectionTitle('Items (${mockCart.length})'),
                const SizedBox(height: 8),
                ...mockCart.map(
                  (l) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Text(
                          '${l.quantity}× ',
                          style: AppTypography.textTheme.bodyMedium,
                        ),
                        Expanded(
                          child: Text(
                            l.product.name,
                            style: AppTypography.textTheme.bodyMedium,
                          ),
                        ),
                        Text(
                          '₱${l.subtotal.toStringAsFixed(2)}',
                          style: AppTypography.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _card(
            child: Column(
              children: [
                _sectionTitle('Payment method', leftAligned: true),
                const SizedBox(height: 8),
                InkWell(
                  onTap: () =>
                      Navigator.of(context).pushNamed(AppRoutes.paymentMethod),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.payments_outlined,
                        color: AppColors.brandPrimary,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Cash on Delivery',
                          style: AppTypography.textTheme.bodyMedium,
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _sectionTitle('Order summary', leftAligned: true),
                const SizedBox(height: 8),
                _kv('Subtotal', '₱${mockCartSubtotal.toStringAsFixed(2)}'),
                const SizedBox(height: 4),
                _kv('Delivery fee', '₱${mockDeliveryFee.toStringAsFixed(2)}'),
                const Divider(height: 20),
                _kv(
                  'Total',
                  '₱${mockCartTotal.toStringAsFixed(2)}',
                  bold: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            label: 'Place order',
            onPressed: () =>
                Navigator.of(context).pushNamed(AppRoutes.paymentProcessing),
          ),
        ],
      ),
    );
  }

  Widget _sectionTitle(String t, {bool leftAligned = true}) =>
      Text(t, style: AppTypography.textTheme.titleLarge);

  Widget _kv(String k, String v, {bool bold = false}) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(
        k,
        style: AppTypography.textTheme.bodyMedium?.copyWith(
          color: AppColors.neutralInkSecondary,
        ),
      ),
      Text(
        v,
        style: bold
            ? AppTypography.textTheme.titleLarge?.copyWith(
                color: AppColors.brandPrimary,
              )
            : AppTypography.textTheme.bodyMedium,
      ),
    ],
  );

  Widget _card({required Widget child}) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: AppColors.neutralSurface,
      borderRadius: AppRadii.brLg,
      border: Border.all(color: AppColors.neutralBorder),
    ),
    child: child,
  );
}
