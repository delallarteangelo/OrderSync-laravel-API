// Design.md §5.17 — Order detail screen
import 'package:flutter/material.dart';

import '../../mock/models.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/order_status_badge.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/secondary_button.dart';

class OrderDetailScreen extends StatelessWidget {
  final AppOrder order;
  const OrderDetailScreen({super.key, required this.order});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: AppPrimaryAppBar(title: 'Order #${order.id}', showBack: true),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  order.eta ?? '',
                  style: AppTypography.textTheme.bodyMedium,
                ),
              ),
              OrderStatusBadge(status: order.status),
            ],
          ),
          const SizedBox(height: 16),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Delivery to', style: AppTypography.textTheme.titleLarge),
                const SizedBox(height: 6),
                Text(
                  order.address.full,
                  style: AppTypography.textTheme.bodyMedium,
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Items', style: AppTypography.textTheme.titleLarge),
                const SizedBox(height: 8),
                ...order.items.map(
                  (it) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    child: Row(
                      children: [
                        Text(
                          '${it.quantity}× ',
                          style: AppTypography.textTheme.bodyMedium,
                        ),
                        Expanded(
                          child: Text(
                            it.product.name,
                            style: AppTypography.textTheme.bodyMedium,
                          ),
                        ),
                        Text(
                          '₱${it.subtotal.toStringAsFixed(2)}',
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
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text('Summary', style: AppTypography.textTheme.titleLarge),
                const SizedBox(height: 8),
                _kv('Subtotal', '₱${order.subtotal.toStringAsFixed(2)}'),
                const SizedBox(height: 4),
                _kv('Delivery fee', '₱${order.deliveryFee.toStringAsFixed(2)}'),
                const Divider(height: 20),
                _kv('Total', '₱${order.total.toStringAsFixed(2)}', bold: true),
              ],
            ),
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            label: 'Track order',
            onPressed: () => Navigator.of(
              context,
            ).pushNamed(AppRoutes.orderTracking, arguments: order),
          ),
          const SizedBox(height: 10),
          SecondaryButton(
            label: 'Message store',
            onPressed: () => Navigator.of(
              context,
            ).pushNamed(AppRoutes.chatThread, arguments: order.id),
          ),
        ],
      ),
    );
  }

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
