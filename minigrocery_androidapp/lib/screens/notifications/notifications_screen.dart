// Design.md §5.21 — Notifications screen
import 'package:flutter/material.dart';

import '../../core/messaging/messaging_models.dart';
import '../../core/messaging/messaging_store.dart';
import '../../routes/app_routes.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_radii.dart';
import '../../theme/app_typography.dart';
import '../../widgets/app_primary_app_bar.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  IconData _iconFor(String type) => switch (type) {
    'MESSAGE' => Icons.chat_bubble_outline_rounded,
    'ORDER' => Icons.receipt_long_rounded,
    'PAYMENT' => Icons.payments_outlined,
    _ => Icons.info_outline_rounded,
  };

  String _hhmm(DateTime time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _open(
    BuildContext context,
    MessagingStore store,
    AppUserNotification notification,
  ) async {
    await store.markNotificationRead(notification);
    if (!context.mounted) return;
    if (notification.resourceType == 'THREAD' &&
        notification.resourceId != null) {
      Navigator.of(
        context,
      ).pushNamed(AppRoutes.chatThread, arguments: notification.resourceId);
      return;
    }
    if (notification.type == 'ORDER' || notification.type == 'PAYMENT') {
      Navigator.of(context).pushNamed(AppRoutes.ordersTab);
    }
  }

  @override
  Widget build(BuildContext context) {
    final store = MessagingScope.of(context);
    return AnimatedBuilder(
      animation: store,
      builder: (context, _) => Scaffold(
        backgroundColor: AppColors.neutralSurface,
        appBar: AppPrimaryAppBar(
          title: 'Notifications',
          showBack: true,
          actions: [
            if (store.unreadNotifications > 0)
              TextButton(
                onPressed: store.markAllNotificationsRead,
                child: const Text('Read all'),
              ),
          ],
        ),
        body: store.notifications.isEmpty
            ? const Center(child: Text('No notifications yet.'))
            : RefreshIndicator(
                onRefresh: store.refresh,
                child: ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  itemCount: store.notifications.length,
                  separatorBuilder: (_, _) => const Divider(height: 1),
                  itemBuilder: (_, index) {
                    final notification = store.notifications[index];
                    return ListTile(
                      onTap: () => _open(context, store, notification),
                      leading: Container(
                        width: 40,
                        height: 40,
                        decoration: BoxDecoration(
                          color: AppColors.brandPrimarySurface,
                          borderRadius: AppRadii.brPill,
                        ),
                        child: Icon(
                          _iconFor(notification.type),
                          color: AppColors.brandPrimary,
                          size: 20,
                        ),
                      ),
                      title: Text(
                        notification.title,
                        style: AppTypography.textTheme.titleMedium,
                      ),
                      subtitle: Text(
                        notification.body,
                        style: AppTypography.textTheme.bodySmall,
                      ),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _hhmm(notification.createdAt),
                            style: AppTypography.textTheme.labelSmall,
                          ),
                          const SizedBox(height: 4),
                          if (notification.readAt == null)
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
                  },
                ),
              ),
      ),
    );
  }
}
