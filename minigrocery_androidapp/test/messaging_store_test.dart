import 'package:flutter_test/flutter_test.dart';
import 'package:minigrocery/core/auth/auth_models.dart';
import 'package:minigrocery/core/messaging/messaging_api.dart';
import 'package:minigrocery/core/messaging/messaging_models.dart';
import 'package:minigrocery/core/messaging/messaging_store.dart';

void main() {
  late _FakeMessagingGateway gateway;
  late MessagingStore store;

  setUp(() {
    gateway = _FakeMessagingGateway();
    store = MessagingStore(gateway, () => _session);
  });

  tearDown(() => store.dispose());

  test('loads durable threads, notifications, and preferences', () async {
    await store.refresh();

    expect(store.threads.single.unreadCount, 1);
    expect(store.unreadNotifications, 1);
    expect(store.preferences?.paymentsEnabled, isTrue);
    expect(store.foregroundNotice, isNull);
  });

  test('sends a message and marks the opened thread read', () async {
    await store.refresh();
    final sent = await store.send('thread-1', 'Hello store');

    expect(sent, isTrue);
    expect(gateway.sentBodies, ['Hello store']);
    expect(gateway.readThreads, ['thread-1']);
    expect(store.messages['thread-1']?.last.body, 'Hello store');
  });

  test('persists preferences and read-all state through the gateway', () async {
    await store.refresh();
    await store.updatePreferences(
      store.preferences!.copyWith(messagesEnabled: false),
    );
    await store.markAllNotificationsRead();

    expect(store.preferences?.messagesEnabled, isFalse);
    expect(store.unreadNotifications, 0);
    expect(gateway.markedAllRead, isTrue);
  });
}

final _session = AuthSession(
  accessToken: 'access',
  accessExpiresAt: _expiry,
  refreshToken: 'refresh',
  refreshExpiresAt: _expiry,
  user: AuthUser(
    id: '5',
    email: 'customer@example.com',
    fullName: 'Customer Example',
    role: AuthRole.customer,
    businessId: '7',
    businessName: 'Example Store',
    businessSlug: 'example-store',
  ),
);

final _expiry = DateTime.utc(2027);

class _FakeMessagingGateway implements MessagingGateway {
  final sentBodies = <String>[];
  final readThreads = <String>[];
  bool markedAllRead = false;
  NotificationPreferences preferences = const NotificationPreferences(
    messagesEnabled: true,
    ordersEnabled: true,
    paymentsEnabled: true,
  );
  List<MessagingMessage> messages = const [];
  List<AppUserNotification> notifications = [
    AppUserNotification(
      id: 'notification-1',
      type: 'MESSAGE',
      title: 'New message',
      body: 'Can I help?',
      resourceType: 'THREAD',
      resourceId: 'thread-1',
      createdAt: DateTime.utc(2026, 9, 10),
    ),
  ];

  MessagingThread get thread => MessagingThread(
    id: 'thread-1',
    kind: 'GENERAL',
    customerName: 'Customer Example',
    lastMessage: messages.isEmpty ? 'Can I help?' : messages.last.body,
    lastMessageAt: DateTime.utc(2026, 9, 10),
    unreadCount: readThreads.isEmpty ? 1 : 0,
  );

  @override
  Future<MessagingThread> createGeneralThread(String token) async => thread;

  @override
  Future<NotificationPreferences> getPreferences(String token) async =>
      preferences;

  @override
  Future<List<MessagingMessage>> listMessages(
    String token,
    String threadId,
  ) async => messages;

  @override
  Future<List<AppUserNotification>> listNotifications(String token) async =>
      notifications;

  @override
  Future<List<MessagingThread>> listThreads(String token) async => [thread];

  @override
  Future<void> markAllNotificationsRead(String token) async {
    markedAllRead = true;
    notifications = notifications
        .map(
          (item) => AppUserNotification(
            id: item.id,
            type: item.type,
            title: item.title,
            body: item.body,
            resourceType: item.resourceType,
            resourceId: item.resourceId,
            createdAt: item.createdAt,
            readAt: DateTime.utc(2026, 9, 10, 1),
          ),
        )
        .toList();
  }

  @override
  Future<void> markNotificationRead(
    String token,
    String notificationId,
  ) async {}

  @override
  Future<void> markThreadRead(String token, String threadId) async {
    readThreads.add(threadId);
  }

  @override
  Future<EventPollResult> pollEvents(String token, String cursor) async =>
      EventPollResult(cursor: cursor, hasEvents: false);

  @override
  Future<MessagingMessage> sendMessage(
    String token,
    String threadId,
    String body,
  ) async {
    sentBodies.add(body);
    final message = MessagingMessage(
      id: 'message-${messages.length + 1}',
      threadId: threadId,
      senderName: 'Customer Example',
      senderRole: 'CUSTOMER',
      kind: 'HUMAN',
      body: body,
      sentAt: DateTime.utc(2026, 9, 10, 1),
      status: 'sent',
      mine: true,
    );
    messages = [...messages, message];
    return message;
  }

  @override
  Future<NotificationPreferences> updatePreferences(
    String token,
    NotificationPreferences next,
  ) async {
    preferences = next;
    return preferences;
  }

  @override
  void close() {}
}
