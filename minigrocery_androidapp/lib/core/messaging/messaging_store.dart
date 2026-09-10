import 'dart:async';

import 'package:flutter/widgets.dart';

import '../auth/auth_models.dart';
import 'messaging_api.dart';
import 'messaging_models.dart';

class MessagingStore extends ChangeNotifier {
  MessagingStore(this._gateway, this._sessionProvider);

  final MessagingGateway _gateway;
  final AuthSession? Function() _sessionProvider;
  List<MessagingThread> threads = const [];
  Map<String, List<MessagingMessage>> messages = const {};
  List<AppUserNotification> notifications = const [];
  NotificationPreferences? preferences;
  bool busy = false;
  String? error;
  String? foregroundNotice;
  String _cursor = '0';
  Set<String>? _knownNotificationIds;
  Timer? _timer;
  bool _polling = false;

  int get unreadMessages =>
      threads.fold(0, (sum, thread) => sum + thread.unreadCount);
  int get unreadNotifications =>
      notifications.where((notification) => notification.readAt == null).length;

  Future<void> start() async {
    _timer?.cancel();
    await refresh();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) => _poll());
  }

  void stopPolling() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> refresh() async {
    final session = _sessionProvider();
    if (session == null) return;
    try {
      final nextThreads = await _gateway.listThreads(session.accessToken);
      final nextNotifications = await _gateway.listNotifications(
        session.accessToken,
      );
      final nextPreferences = await _gateway.getPreferences(
        session.accessToken,
      );
      final nextIds = nextNotifications.map((item) => item.id).toSet();
      if (_knownNotificationIds != null) {
        final fresh = nextNotifications
            .where(
              (item) =>
                  item.readAt == null &&
                  !_knownNotificationIds!.contains(item.id),
            )
            .firstOrNull;
        foregroundNotice = fresh == null
            ? null
            : '${fresh.title}\n${fresh.body}';
      }
      _knownNotificationIds = nextIds;
      threads = nextThreads;
      notifications = nextNotifications;
      preferences = nextPreferences;
      error = null;
      notifyListeners();
    } on MessagingApiException catch (exception) {
      error = exception.message;
      notifyListeners();
    }
  }

  Future<void> _poll() async {
    final session = _sessionProvider();
    if (session == null || _polling) return;
    _polling = true;
    try {
      final result = await _gateway.pollEvents(session.accessToken, _cursor);
      _cursor = result.cursor;
      if (result.hasEvents) await refresh();
    } catch (_) {
      // The next five-second poll retries without discarding local state.
    } finally {
      _polling = false;
    }
  }

  Future<MessagingThread?> createGeneralThread() async {
    final session = _sessionProvider();
    if (session == null) return null;
    busy = true;
    notifyListeners();
    try {
      final thread = await _gateway.createGeneralThread(session.accessToken);
      await refresh();
      return thread;
    } on MessagingApiException catch (exception) {
      error = exception.message;
      return null;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> loadThread(String threadId) async {
    final session = _sessionProvider();
    if (session == null) return;
    busy = true;
    notifyListeners();
    try {
      final items = await _gateway.listMessages(session.accessToken, threadId);
      await _gateway.markThreadRead(session.accessToken, threadId);
      messages = {...messages, threadId: items};
      threads = await _gateway.listThreads(session.accessToken);
      error = null;
    } on MessagingApiException catch (exception) {
      error = exception.message;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<bool> send(String threadId, String body) async {
    final session = _sessionProvider();
    if (session == null || body.trim().isEmpty) return false;
    busy = true;
    notifyListeners();
    try {
      await _gateway.sendMessage(session.accessToken, threadId, body.trim());
      await loadThread(threadId);
      return true;
    } on MessagingApiException catch (exception) {
      error = exception.message;
      return false;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> markNotificationRead(AppUserNotification notification) async {
    final session = _sessionProvider();
    if (session == null || notification.readAt != null) return;
    await _gateway.markNotificationRead(session.accessToken, notification.id);
    await refresh();
  }

  Future<void> markAllNotificationsRead() async {
    final session = _sessionProvider();
    if (session == null || unreadNotifications == 0) return;
    try {
      await _gateway.markAllNotificationsRead(session.accessToken);
      await refresh();
    } on MessagingApiException catch (exception) {
      error = exception.message;
      notifyListeners();
    }
  }

  Future<void> updatePreferences(NotificationPreferences value) async {
    final session = _sessionProvider();
    if (session == null) return;
    busy = true;
    notifyListeners();
    try {
      preferences = await _gateway.updatePreferences(
        session.accessToken,
        value,
      );
      error = null;
    } on MessagingApiException catch (exception) {
      error = exception.message;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  String? consumeForegroundNotice() {
    final notice = foregroundNotice;
    foregroundNotice = null;
    return notice;
  }

  void reset() {
    stopPolling();
    threads = const [];
    messages = const {};
    notifications = const [];
    preferences = null;
    error = null;
    foregroundNotice = null;
    _knownNotificationIds = null;
    _cursor = '0';
    notifyListeners();
  }

  @override
  void dispose() {
    stopPolling();
    _gateway.close();
    super.dispose();
  }
}

class MessagingScope extends InheritedNotifier<MessagingStore> {
  const MessagingScope({
    super.key,
    required MessagingStore store,
    required super.child,
  }) : super(notifier: store);

  static MessagingStore of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<MessagingScope>();
    assert(scope != null, 'MessagingScope is missing above this context.');
    return scope!.notifier!;
  }
}
