import 'package:flutter/material.dart';

import '../../core/storefront/storefront_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/primary_button.dart';

class CheckoutScreen extends StatelessWidget {
  const CheckoutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => Scaffold(
        backgroundColor: AppColors.neutralSurface,
        appBar: const AppPrimaryAppBar(title: 'Review order', showBack: true),
        body: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text(
              store.catalog?.businessName ?? 'Selected store',
              style: AppTypography.textTheme.titleLarge,
            ),
            const SizedBox(height: 4),
            Text(
              'Pickup only · Stock is deducted after store confirmation.',
              style: AppTypography.textTheme.bodySmall,
            ),
            const Divider(height: 32),
            ...store.cart.map(
              (line) => ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(line.product.name),
                subtitle: Text(
                  '${line.quantity} × ₱${line.product.price.toStringAsFixed(2)}',
                ),
                trailing: Text('₱${line.subtotal.toStringAsFixed(2)}'),
              ),
            ),
            const Divider(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Total', style: AppTypography.textTheme.titleLarge),
                Text(
                  '₱${store.total.toStringAsFixed(2)}',
                  style: AppTypography.textTheme.titleLarge,
                ),
              ],
            ),
            if (store.error != null) ...[
              const SizedBox(height: 12),
              Text(
                store.error!,
                style: const TextStyle(color: AppColors.statusRejected),
              ),
            ],
            const SizedBox(height: 24),
            PrimaryButton(
              label: 'Place pickup order',
              loading: store.busy,
              onPressed: store.cart.isEmpty
                  ? null
                  : () async {
                      final order = await store.placeOrder();
                      if (context.mounted && order != null) {
                        Navigator.of(context).pushReplacementNamed(
                          AppRoutes.orderDetail,
                          arguments: order,
                        );
                      }
                    },
            ),
          ],
        ),
      ),
    );
  }
}
