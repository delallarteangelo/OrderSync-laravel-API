import 'package:flutter/material.dart';

import '../../core/storefront/storefront_models.dart';
import '../../core/storefront/storefront_store.dart';
import '../../mock/models.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/order_status_badge.dart';
import '../../widgets/secondary_button.dart';

class OrderDetailScreen extends StatelessWidget {
  const OrderDetailScreen({super.key, required this.order});
  final CustomerOrder order;

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final current =
            store.orders.where((item) => item.id == order.id).firstOrNull ??
            order;
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: AppPrimaryAppBar(title: current.code, showBack: true),
          body: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    current.businessName,
                    style: AppTypography.textTheme.titleLarge,
                  ),
                  OrderStatusBadge(status: current.status),
                ],
              ),
              const SizedBox(height: 4),
              Text('Pickup order', style: AppTypography.textTheme.bodySmall),
              const Divider(height: 28),
              Text('Items', style: AppTypography.textTheme.titleLarge),
              ...current.items.map(
                (item) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(item.productName),
                  subtitle: Text(
                    '${item.quantity} × ₱${item.unitPrice.toStringAsFixed(2)}',
                  ),
                  trailing: Text('₱${item.lineTotal.toStringAsFixed(2)}'),
                ),
              ),
              const Divider(height: 28),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total', style: AppTypography.textTheme.titleLarge),
                  Text(
                    '₱${current.total.toStringAsFixed(2)}',
                    style: AppTypography.textTheme.titleLarge,
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text('Status history', style: AppTypography.textTheme.titleLarge),
              const SizedBox(height: 8),
              ...current.statusHistory.map(
                (event) => ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(
                    Icons.check_circle_outline_rounded,
                    color: AppColors.brandPrimary,
                  ),
                  title: Text(
                    event.status.name.replaceAll(
                      'readyForPickup',
                      'ready for pickup',
                    ),
                  ),
                  subtitle: Text(
                    '${event.actorName}${event.note == null ? '' : ' · ${event.note}'}',
                  ),
                ),
              ),
              if (current.status == OrderStatus.pending) ...[
                const SizedBox(height: 16),
                SecondaryButton(
                  label: 'Cancel pending order',
                  onPressed: store.busy ? null : () => store.cancel(current),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
