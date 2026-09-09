import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

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
  Future<List<PaymentInstruction>> listPaymentInstructions(String accessToken);
  Future<Uint8List> getPaymentInstructionQr(
    String accessToken,
    String instructionId,
  );
  Future<List<CustomerOrder>> listOrders(String accessToken);
  Future<CustomerOrder> placeOrder(
    String accessToken,
    Map<String, int> quantities,
    String idempotencyKey,
  );
  Future<CustomerOrder> cancelOrder(String accessToken, String orderId);
  Future<RecordedPayment> submitOrderPayment(
    String accessToken,
    String orderId,
    WalletMethod method,
    String referenceNumber,
    String proofPath,
  );
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
  Future<List<PaymentInstruction>> listPaymentInstructions(
    String accessToken,
  ) async {
    final body = await _request(
      'GET',
      '/customer/payment-instructions',
      accessToken: accessToken,
    );
    return (body['items'] as List<dynamic>)
        .map(
          (item) => PaymentInstruction.fromJson(item as Map<String, dynamic>),
        )
        .toList(growable: false);
  }

  @override
  Future<Uint8List> getPaymentInstructionQr(
    String accessToken,
    String instructionId,
  ) async {
    final request = await _client.getUrl(
      Uri.parse(
        '$_baseUrl/customer/payment-instructions/${Uri.encodeComponent(instructionId)}/qr',
      ),
    );
    request.headers.set('Accept', 'image/*');
    request.headers.set('X-Client', 'ordersync-android');
    request.headers.set('Authorization', 'Bearer $accessToken');
    final response = await request.close();
    final bytes = await response.fold<List<int>>(
      <int>[],
      (all, chunk) => all..addAll(chunk),
    );
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const StorefrontApiException(
        'QR_UNAVAILABLE',
        'The payment QR is unavailable.',
      );
    }
    return Uint8List.fromList(bytes);
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

  @override
  Future<RecordedPayment> submitOrderPayment(
    String accessToken,
    String orderId,
    WalletMethod method,
    String referenceNumber,
    String proofPath,
  ) async {
    final proof = File(proofPath);
    final fileName = proof.uri.pathSegments.last.replaceAll('"', '');
    final extension = fileName.split('.').last.toLowerCase();
    final mime = switch (extension) {
      'png' => 'image/png',
      'webp' => 'image/webp',
      _ => 'image/jpeg',
    };
    final boundary = 'ordersync-${DateTime.now().microsecondsSinceEpoch}';
    final request = await _client.postUrl(
      Uri.parse(
        '$_baseUrl/customer/orders/${Uri.encodeComponent(orderId)}/payments',
      ),
    );
    request.headers.set('Accept', 'application/json');
    request.headers.set('X-Client', 'ordersync-android');
    request.headers.set('Authorization', 'Bearer $accessToken');
    request.headers.set(
      'Content-Type',
      'multipart/form-data; boundary=$boundary',
    );
    void field(String name, String value) {
      request.write('--$boundary\r\n');
      request.write('Content-Disposition: form-data; name="$name"\r\n\r\n');
      request.write('$value\r\n');
    }

    field('method', method == WalletMethod.maya ? 'MAYA' : 'GCASH');
    field('referenceNumber', referenceNumber);
    request.write('--$boundary\r\n');
    request.write(
      'Content-Disposition: form-data; name="proof"; filename="$fileName"\r\n',
    );
    request.write('Content-Type: $mime\r\n\r\n');
    request.add(await proof.readAsBytes());
    request.write('\r\n--$boundary--\r\n');
    final response = await request.close();
    final body = await _responseBody(response);
    return RecordedPayment.fromJson(body);
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
    return _responseBody(response);
  }

  Future<Map<String, dynamic>> _responseBody(
    HttpClientResponse response,
  ) async {
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
