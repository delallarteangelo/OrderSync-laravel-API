// Design.md §5.16 — Orders tab
import 'package:flutter/material.dart';

import '../../mock/mock_orders.dart';
import '../../mock/models.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';
import '../../widgets/category_chip.dart';
import '../../widgets/order_status_badge.dart';

enum _OrdersFilter { all, active, completed, cancelled }

class OrdersTab extends StatefulWidget {
  const OrdersTab({super.key});
  @override
  State<OrdersTab> createState() => _OrdersTabState();
}

class _OrdersTabState extends State<OrdersTab> {
  _OrdersFilter _filter = _OrdersFilter.all;

  bool _matches(AppOrder o) {
    switch (_filter) {
      case _OrdersFilter.all:
        return true;
      case _OrdersFilter.active:
        return [
          OrderStatus.pending,
          OrderStatus.confirmed,
          OrderStatus.preparing,
          OrderStatus.readyForPickup,
        ].contains(o.status);
      case _OrdersFilter.completed:
        return o.status == OrderStatus.completed;
      case _OrdersFilter.cancelled:
        return o.status == OrderStatus.cancelled ||
            o.status == OrderStatus.rejected;
    }
  }

  @override
  Widget build(BuildContext context) {
    final filtered = mockOrders.where(_matches).toList();
    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'My Orders'),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
            child: Row(
              children: [
                _chip('All', _OrdersFilter.all),
                const SizedBox(width: 8),
                _chip('Active', _OrdersFilter.active),
                const SizedBox(width: 8),
                _chip('Completed', _OrdersFilter.completed),
                const SizedBox(width: 8),
                _chip('Cancelled', _OrdersFilter.cancelled),
              ],
            ),
          ),
          Expanded(
            child: filtered.isEmpty
                ? Center(
                    child: Text(
                      'No orders here yet',
                      style: AppTypography.textTheme.bodyMedium,
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, i) => _OrderTile(order: filtered[i]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _chip(String label, _OrdersFilter f) => CategoryChip(
    label: label,
    selected: _filter == f,
    onTap: () => setState(() => _filter = f),
  );
}

class _OrderTile extends StatelessWidget {
  final AppOrder order;
  const _OrderTile({required this.order});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => Navigator.of(
        context,
      ).pushNamed(AppRoutes.orderDetail, arguments: order),
      borderRadius: AppRadii.brLg,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.neutralSurface,
          borderRadius: AppRadii.brLg,
          border: Border.all(color: AppColors.neutralBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Order #${order.id}',
                    style: AppTypography.textTheme.titleLarge,
                  ),
                ),
                OrderStatusBadge(status: order.status),
              ],
            ),
            const SizedBox(height: 6),
            Text(
              '${order.items.length} item${order.items.length == 1 ? '' : 's'} · ${order.eta ?? ''}',
              style: AppTypography.textTheme.bodySmall,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Text(
                  'Total',
                  style: AppTypography.textTheme.bodyMedium?.copyWith(
                    color: AppColors.neutralInkSecondary,
                  ),
                ),
                const SizedBox(width: 6),
                Text(
                  '₱${order.total.toStringAsFixed(2)}',
                  style: AppTypography.textTheme.titleMedium?.copyWith(
                    color: AppColors.brandPrimary,
                  ),
                ),
                const Spacer(),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: AppColors.neutralInkSecondary,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
