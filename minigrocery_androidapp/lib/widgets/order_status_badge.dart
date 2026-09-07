import 'package:flutter/material.dart';

import '../mock/models.dart';
import '../theme/app_colors.dart';
import '../theme/app_radii.dart';
import '../theme/app_typography.dart';

/// OrderStatusBadge — Design.md §4.10.
class OrderStatusBadge extends StatelessWidget {
  final OrderStatus status;
  const OrderStatusBadge({super.key, required this.status});

  static ({Color bg, Color fg, String label}) styleFor(OrderStatus s) {
    switch (s) {
      case OrderStatus.pending:
        return (
          bg: AppColors.statusPending,
          fg: AppColors.neutralInkBlack,
          label: 'Pending',
        );
      case OrderStatus.confirmed:
        return (
          bg: AppColors.statusConfirmed,
          fg: AppColors.onBrand,
          label: 'Confirmed',
        );
      case OrderStatus.rejected:
        return (
          bg: AppColors.statusRejected,
          fg: AppColors.onBrand,
          label: 'Rejected',
        );
      case OrderStatus.preparing:
        return (
          bg: AppColors.statusPreparing,
          fg: AppColors.onBrand,
          label: 'Preparing',
        );
      case OrderStatus.readyForPickup:
        return (
          bg: AppColors.statusReadyForPickup,
          fg: AppColors.onBrand,
          label: 'Ready',
        );
      case OrderStatus.completed:
        return (
          bg: AppColors.statusCompleted,
          fg: AppColors.onBrand,
          label: 'Completed',
        );
      case OrderStatus.cancelled:
        return (
          bg: AppColors.statusCancelled,
          fg: AppColors.onBrand,
          label: 'Cancelled',
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = styleFor(status);
    return Container(
      height: 24,
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: s.bg, borderRadius: AppRadii.brPill),
      alignment: Alignment.center,
      child: Text(
        s.label,
        style: AppTypography.textTheme.labelMedium?.copyWith(color: s.fg),
      ),
    );
  }
}
