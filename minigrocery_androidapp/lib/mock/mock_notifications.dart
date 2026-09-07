import 'models.dart';

final List<AppNotification> mockNotifications = [
  AppNotification(
    id: 'n1',
    type: NotificationType.order,
    title: 'Order #1206 is preparing',
    body: 'Your order is being prepared. ETA 12 minutes.',
    at: DateTime(2026, 5, 14, 8, 50),
    unread: true,
  ),
  AppNotification(
    id: 'n2',
    type: NotificationType.promo,
    title: 'Up to 30% off on Fruits today!',
    body: 'Sale ends at midnight. Tap to browse.',
    at: DateTime(2026, 5, 14, 8, 0),
    unread: true,
  ),
  AppNotification(
    id: 'n3',
    type: NotificationType.order,
    title: 'Order #1203 delivered',
    body: 'Rate your order to help us improve.',
    at: DateTime(2026, 5, 12, 12, 30),
    unread: false,
  ),
  AppNotification(
    id: 'n4',
    type: NotificationType.system,
    title: 'New app version available',
    body: 'Update to enjoy the latest features and fixes.',
    at: DateTime(2026, 5, 11, 9, 15),
    unread: false,
  ),
  AppNotification(
    id: 'n5',
    type: NotificationType.promo,
    title: 'Refer & earn ₱100',
    body: 'Invite a friend and earn shopping credit.',
    at: DateTime(2026, 5, 10, 18, 0),
    unread: false,
  ),
];
