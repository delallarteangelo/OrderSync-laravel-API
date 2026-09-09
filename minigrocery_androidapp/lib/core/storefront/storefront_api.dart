import 'dart:convert';
import 'dart:io';

import 'storefront_models.dart';

class StorefrontApiException implements Exception {
  const StorefrontApiException(this.code, this.message);
  final String code;
  final String message;
  @override
  String toString() => message;
}

abstract class StorefrontGateway {
  Future<StorefrontCatalog> getStorefront(String slug);
  Future<List<CustomerOrder>> listOrders(String accessToken);
  Future<CustomerOrder> placeOrder(
    String accessToken,
    Map<String, int> quantities,
    String idempotencyKey,
  );
  Future<CustomerOrder> cancelOrder(String accessToken, String orderId);
  void close();
}

class StorefrontApi implements StorefrontGateway {
  StorefrontApi({HttpClient? client, String? baseUrl})
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
  Future<StorefrontCatalog> getStorefront(String slug) async {
    final body = await _request(
      'GET',
      '/storefronts/${Uri.encodeComponent(slug)}',
    );
    return StorefrontCatalog.fromJson(body);
  }

  @override
  Future<List<CustomerOrder>> listOrders(String accessToken) async {
    final body = await _request(
      'GET',
      '/customer/orders',
      accessToken: accessToken,
    );
    return (body['items'] as List<dynamic>)
        .map((item) => CustomerOrder.fromJson(item as Map<String, dynamic>))
        .toList(growable: false);
  }

  @override
  Future<CustomerOrder> placeOrder(
    String accessToken,
    Map<String, int> quantities,
    String idempotencyKey,
  ) async {
    final body = await _request(
      'POST',
      '/customer/orders',
      accessToken: accessToken,
      idempotencyKey: idempotencyKey,
      payload: {
        'items': quantities.entries
            .map(
              (entry) => {
                'productId': int.parse(entry.key),
                'quantity': entry.value,
              },
            )
            .toList(growable: false),
      },
    );
    return CustomerOrder.fromJson(body);
  }

  @override
  Future<CustomerOrder> cancelOrder(String accessToken, String orderId) async {
    final body = await _request(
      'POST',
      '/customer/orders/${Uri.encodeComponent(orderId)}/cancel',
      accessToken: accessToken,
      payload: {'note': 'Cancelled by customer'},
    );
    return CustomerOrder.fromJson(body);
  }

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    String? accessToken,
    String? idempotencyKey,
    Map<String, dynamic>? payload,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final request = method == 'GET'
        ? await _client.getUrl(uri)
        : await _client.postUrl(uri);
    request.headers.set('Accept', 'application/json');
    request.headers.set('X-Client', 'ordersync-android');
    if (accessToken != null) {
      request.headers.set('Authorization', 'Bearer $accessToken');
    }
    if (idempotencyKey != null) {
      request.headers.set('Idempotency-Key', idempotencyKey);
    }
    if (payload != null) {
      request.headers.contentType = ContentType.json;
      request.write(jsonEncode(payload));
    }
    final response = await request.close();
    final responseText = await utf8.decoder.bind(response).join();
    final body = responseText.isEmpty
        ? <String, dynamic>{}
        : jsonDecode(responseText) as Map<String, dynamic>;
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw StorefrontApiException(
        body['code'] as String? ?? 'HTTP_${response.statusCode}',
        body['message'] as String? ?? 'The store request failed.',
      );
    }
    return body;
  }

  @override
  void close() => _client.close(force: true);
}
