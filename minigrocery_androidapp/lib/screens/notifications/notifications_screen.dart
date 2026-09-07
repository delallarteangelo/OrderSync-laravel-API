// Design.md §5.21 — Notifications screen
import 'package:flutter/material.dart';

import '../../mock/mock_notifications.dart';
import '../../mock/models.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  IconData _iconFor(NotificationType t) {
    switch (t) {
      case NotificationType.order:
        return Icons.receipt_long_rounded;
      case NotificationType.promo:
        return Icons.local_offer_rounded;
      case NotificationType.system:
        return Icons.info_outline_rounded;
    }
  }

  String _hhmm(DateTime t) {
    final h = t.hour.toString().padLeft(2, '0');
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  @override
  Widget build(BuildContext context) {
    final now = DateTime(2026, 5, 14);
    final today = mockNotifications
        .where(
          (n) =>
              n.at.year == now.year &&
              n.at.month == now.month &&
              n.at.day == now.day,
        )
        .toList();
    final earlier = mockNotifications.where((n) => !today.contains(n)).toList();

    return Scaffold(
      backgroundColor: AppColors.neutralSurface,
      appBar: const AppPrimaryAppBar(title: 'Notifications', showBack: true),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          if (today.isNotEmpty) _section('Today'),
          ...today.map(_buildTile),
          if (earlier.isNotEmpty) _section('Earlier'),
          ...earlier.map(_buildTile),
        ],
      ),
    );
  }

  Widget _section(String label) => Padding(
    padding: const EdgeInsets.fromLTRB(20, 12, 20, 4),
    child: Text(
      label,
      style: AppTypography.textTheme.labelMedium?.copyWith(
        color: AppColors.neutralInkSecondary,
      ),
    ),
  );

  Widget _buildTile(AppNotification n) => ListTile(
    leading: Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: AppColors.brandPrimarySurface,
        borderRadius: AppRadii.brPill,
      ),
      child: Icon(_iconFor(n.type), color: AppColors.brandPrimary, size: 20),
    ),
    title: Text(n.title, style: AppTypography.textTheme.titleMedium),
    subtitle: Text(n.body, style: AppTypography.textTheme.bodySmall),
    trailing: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(_hhmm(n.at), style: AppTypography.textTheme.labelSmall),
        const SizedBox(height: 4),
        if (n.unread)
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: AppColors.brandPrimary,
              shape: BoxShape.circle,
            ),
          ),
      ],
    ),
  );
}
