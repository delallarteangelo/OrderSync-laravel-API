import 'dart:convert';
import 'dart:io';

import 'messaging_models.dart';

class MessagingApiException implements Exception {
  const MessagingApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

abstract class MessagingGateway {
  Future<List<MessagingThread>> listThreads(String token);
  Future<MessagingThread> createGeneralThread(String token);
  Future<List<MessagingMessage>> listMessages(String token, String threadId);
  Future<MessagingMessage> sendMessage(
    String token,
    String threadId,
    String body,
  );
  Future<MessagingMessage> askAssistant(
    String token,
    String threadId,
    String body,
  );
  Future<void> requestHumanHandoff(String token, String threadId);
  Future<List<PublishedAiKnowledge>> listPublishedAiKnowledge(String token);
  Future<void> markThreadRead(String token, String threadId);
  Future<List<AppUserNotification>> listNotifications(String token);
  Future<void> markNotificationRead(String token, String notificationId);
  Future<void> markAllNotificationsRead(String token);
  Future<NotificationPreferences> getPreferences(String token);
  Future<NotificationPreferences> updatePreferences(
    String token,
    NotificationPreferences preferences,
  );
  Future<EventPollResult> pollEvents(String token, String cursor);
  void close();
}

class MessagingApi implements MessagingGateway {
  MessagingApi({HttpClient? client, String? baseUrl})
    : _client = client ?? HttpClient(),
      _baseUrl =
          baseUrl ??
          const String.fromEnvironment(
            'ORDERSYNC_API_BASE_URL',
            defaultValue: 'http://10.0.2.2/minigrocery/public/api/v1',
          );

  final HttpClient _client;
  final String _baseUrl;

  @override
  Future<List<MessagingThread>> listThreads(String token) async {
    final body = await _request('GET', '/threads', token);
    return (body['items'] as List<dynamic>)
        .map((item) => MessagingThread.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  @override
  Future<MessagingThread> createGeneralThread(String token) async =>
      MessagingThread.fromJson(await _request('POST', '/threads', token, {}));

  @override
  Future<List<MessagingMessage>> listMessages(
    String token,
    String threadId,
  ) async {
    final body = await _request('GET', '/threads/$threadId/messages', token);
    return (body['items'] as List<dynamic>)
        .map((item) => MessagingMessage.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  @override
  Future<MessagingMessage> sendMessage(
    String token,
    String threadId,
    String body,
  ) async => MessagingMessage.fromJson(
    await _request('POST', '/threads/$threadId/messages', token, {
      'body': body,
    }),
  );

  @override
  Future<MessagingMessage> askAssistant(
    String token,
    String threadId,
    String body,
  ) async {
    final result = await _request(
      'POST',
      '/threads/$threadId/assistant',
      token,
      {'body': body},
    );
    return MessagingMessage.fromJson(
      result['response'] as Map<String, dynamic>,
    );
  }

  @override
  Future<void> requestHumanHandoff(String token, String threadId) async {
    await _request('POST', '/threads/$threadId/handoff', token, {});
  }

  @override
  Future<List<PublishedAiKnowledge>> listPublishedAiKnowledge(
    String token,
  ) async {
    final body = await _request('GET', '/ai/published', token);
    return (body['items'] as List<dynamic>)
        .map(
          (item) => PublishedAiKnowledge.fromJson(item as Map<String, dynamic>),
        )
        .toList(growable: false);
  }

  @override
  Future<void> markThreadRead(String token, String threadId) async {
    await _request('POST', '/threads/$threadId/read', token, {});
  }

  @override
  Future<List<AppUserNotification>> listNotifications(String token) async {
    final body = await _request('GET', '/notifications', token);
    return (body['items'] as List<dynamic>)
        .map(
          (item) => AppUserNotification.fromJson(item as Map<String, dynamic>),
        )
        .toList(growable: false);
  }

  @override
  Future<void> markNotificationRead(String token, String notificationId) async {
    await _request('POST', '/notifications/$notificationId/read', token, {});
  }

  @override
  Future<void> markAllNotificationsRead(String token) async {
    await _request('POST', '/notifications/read-all', token, {});
  }

  @override
  Future<NotificationPreferences> getPreferences(String token) async =>
      NotificationPreferences.fromJson(
        await _request('GET', '/notification-preferences', token),
      );

  @override
  Future<NotificationPreferences> updatePreferences(
    String token,
    NotificationPreferences preferences,
  ) async => NotificationPreferences.fromJson(
    await _request(
      'PUT',
      '/notification-preferences',
      token,
      preferences.toJson(),
    ),
  );

  @override
  Future<EventPollResult> pollEvents(String token, String cursor) async {
    final body = await _request('GET', '/events?after=$cursor', token);
    return EventPollResult(
      cursor: body['cursor'].toString(),
      hasEvents: (body['items'] as List<dynamic>).isNotEmpty,
    );
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path,
    String token, [
    Map<String, dynamic>? payload,
  ]) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = switch (method) {
      'POST' => await _client.postUrl(uri),
      'PUT' => await _client.putUrl(uri),
      _ => await _client.getUrl(uri),
    };
    request.headers.set('Accept', 'application/json');
    request.headers.set('X-Client', 'ordersync-android');
    request.headers.set('Authorization', 'Bearer $token');
    if (payload != null) {
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(payload));
    }
    final response = await request.close();
    final text = await utf8.decoder.bind(response).join();
    final body = text.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(text) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw MessagingApiException(
        body['message'] as String? ?? 'The messaging request failed.',
      );
    }
    return body;
  }

  @override
  void close() => _client.close(force: true);
}
