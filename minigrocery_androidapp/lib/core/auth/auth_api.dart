import 'dart:convert';
import 'dart:io';

import 'auth_models.dart';

class AuthApiException implements Exception {
  const AuthApiException({
    required this.code,
    required this.message,
    this.businesses = const [],
  });

  final String code;
  final String message;
  final List<BusinessMembership> businesses;

  @override
  String toString() => message;
}

class AuthApi {
  AuthApi({HttpClient? client, String? baseUrl})
    : _client = client ?? HttpClient(),
      _baseUrl =
          baseUrl ??
          const String.fromEnvironment(
            'ORDERSYNC_API_BASE_URL',
            defaultValue: 'http://10.0.2.2/minigrocery/public/api/v1',
          );

  final HttpClient _client;
  final String _baseUrl;

  Future<AuthSession> login({
    required String email,
    required String password,
    String? businessId,
  }) async {
    return _sessionRequest('/auth/login', {
      'email': email.trim(),
      'password': password,
      if (businessId != null) 'businessId': int.parse(businessId),
    });
  }

  Future<AuthSession> refresh(String refreshToken) {
    return _sessionRequest('/auth/refresh', {'refreshToken': refreshToken});
  }

  Future<void> logout(AuthSession session) async {
    await _request(
      '/auth/logout',
      {'refreshToken': session.refreshToken},
      accessToken: session.accessToken,
      acceptedStatuses: const {204},
    );
  }

  Future<AuthSession> _sessionRequest(
    String path,
    Map<String, dynamic> payload,
  ) async {
    final body = await _request(path, payload, acceptedStatuses: const {200});
    return AuthSession.fromJson(body);
  }

  Future<Map<String, dynamic>> _request(
    String path,
    Map<String, dynamic> payload, {
    String? accessToken,
    required Set<int> acceptedStatuses,
  }) async {
    final request = await _client.postUrl(Uri.parse('$_baseUrl$path'));
    request.headers.contentType = ContentType.json;
    request.headers.set('Accept', 'application/json');
    request.headers.set('X-Client', 'ordersync-android');
    request.headers.set('X-Client-Platform', 'mobile');
    if (accessToken != null) {
      request.headers.set('Authorization', 'Bearer $accessToken');
    }
    request.write(jsonEncode(payload));

    final response = await request.close();
    final responseText = await utf8.decoder.bind(response).join();
    final body = responseText.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(responseText) as Map<String, dynamic>;

    if (!acceptedStatuses.contains(response.statusCode)) {
      final memberships = (body['businesses'] as List<dynamic>? ?? const [])
          .map(
            (item) => BusinessMembership.fromJson(item as Map<String, dynamic>),
          )
          .toList(growable: false);
      throw AuthApiException(
        code: body['code'] as String? ?? 'HTTP_${response.statusCode}',
        message: body['message'] as String? ?? 'Authentication failed.',
        businesses: memberships,
      );
    }

    return body;
  }

  void close() => _client.close(force: true);
}
