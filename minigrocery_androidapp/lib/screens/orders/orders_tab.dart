import 'package:flutter/material.dart';

import '../../core/storefront/storefront_models.dart';
import '../../core/storefront/storefront_store.dart';
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

  bool _matches(CustomerOrder order) => switch (_filter) {
    _OrdersFilter.all => true,
    _OrdersFilter.active => const [
      OrderStatus.pending,
      OrderStatus.confirmed,
      OrderStatus.preparing,
      OrderStatus.readyForPickup,
    ].contains(order.status),
    _OrdersFilter.completed => order.status == OrderStatus.completed,
    _OrdersFilter.cancelled => const [
      OrderStatus.cancelled,
      OrderStatus.rejected,
    ].contains(order.status),
  };

  @override
  Widget build(BuildContext context) {
    final store = StorefrontScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) {
        final filtered = store.orders.where(_matches).toList(growable: false);
        return Scaffold(
          backgroundColor: AppColors.neutralSurface,
          appBar: const AppPrimaryAppBar(title: 'My Orders'),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
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
              ),
              if (store.error != null)
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Text(
                    store.error!,
                    style: const TextStyle(color: AppColors.statusRejected),
                  ),
                ),
              Expanded(
                child: RefreshIndicator(
                  onRefresh: store.load,
                  child: filtered.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 160),
                            Center(child: Text('No orders here yet')),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: filtered.length,
                          separatorBuilder: (_, _) =>
                              const SizedBox(height: 10),
                          itemBuilder: (_, index) => _OrderTile(
                            order: filtered[index],
                            onCancel:
                                filtered[index].status == OrderStatus.pending
                                ? () => store.cancel(filtered[index])
                                : null,
                          ),
                        ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _chip(String label, _OrdersFilter filter) => CategoryChip(
    label: label,
    selected: _filter == filter,
    onTap: () => setState(() => _filter = filter),
  );
}

class _OrderTile extends StatelessWidget {
  const _OrderTile({required this.order, this.onCancel});
  final CustomerOrder order;
  final VoidCallback? onCancel;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: () => Navigator.of(
      context,
    ).pushNamed(AppRoutes.orderDetail, arguments: order),
    borderRadius: AppRadii.brLg,
    child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
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
                  order.code,
                  style: AppTypography.textTheme.titleLarge,
                ),
              ),
              OrderStatusBadge(status: order.status),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '${order.items.length} item(s) · Pickup',
            style: AppTypography.textTheme.bodySmall,
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                '₱${order.total.toStringAsFixed(2)}',
                style: AppTypography.textTheme.titleMedium,
              ),
              const Spacer(),
              if (onCancel != null)
                TextButton(onPressed: onCancel, child: const Text('Cancel'))
              else
                const Icon(Icons.chevron_right_rounded),
            ],
          ),
        ],
      ),
    ),
  );
}
