import 'package:flutter_test/flutter_test.dart';
import 'dart:typed_data';
import 'package:minigrocery/core/auth/auth_models.dart';
import 'package:minigrocery/core/storefront/storefront_api.dart';
import 'package:minigrocery/core/storefront/storefront_models.dart';
import 'package:minigrocery/core/storefront/storefront_store.dart';
import 'package:minigrocery/mock/models.dart';

void main() {
  late _FakeStorefrontGateway gateway;
  late AuthSession session;
  late StorefrontStore store;

  setUp(() {
    gateway = _FakeStorefrontGateway();
    session = _session('store-one');
    store = StorefrontStore(gateway, () => session);
  });

  tearDown(() => store.dispose());

  test('loads the authenticated tenant catalog and order history', () async {
    await store.load();

    expect(gateway.requestedSlug, 'store-one');
    expect(store.catalog?.businessSlug, 'store-one');
    expect(store.orders.single.code, 'ORD-1');
  });

  test(
    'keeps cart and idempotency key after a failed placement retry',
    () async {
      await store.load();
      store.add(store.catalog!.products.single);
      gateway.failNextPlacement = true;

      expect(await store.placeOrder(), isNull);
      expect(store.cart.single.quantity, 1);
      expect(store.error, 'Please retry.');

      final retry = await store.placeOrder();
      expect(retry?.code, 'ORD-2');
      expect(store.cart, isEmpty);
      expect(gateway.placementKeys, hasLength(2));
      expect(gateway.placementKeys[1], gateway.placementKeys[0]);
    },
  );

  test('clears catalog, history, and cart at the auth boundary', () async {
    await store.load();
    store.add(store.catalog!.products.single);

    store.reset();

    expect(store.catalog, isNull);
    expect(store.orders, isEmpty);
    expect(store.cart, isEmpty);
  });
}

AuthSession _session(String slug) => AuthSession(
  accessToken: 'access',
  accessExpiresAt: DateTime.utc(2026, 9, 9, 2),
  refreshToken: 'refresh',
  refreshExpiresAt: DateTime.utc(2026, 10, 9),
  user: AuthUser(
    id: '5',
    email: 'customer@example.com',
    fullName: 'Customer Example',
    role: AuthRole.customer,
    businessId: '7',
    businessName: 'Example Store',
    businessSlug: slug,
  ),
);

class _FakeStorefrontGateway implements StorefrontGateway {
  String? requestedSlug;
  bool failNextPlacement = false;
  final List<String> placementKeys = [];

  final product = const Product(
    id: '11',
    name: 'Rice',
    categoryId: '3',
    price: 58.5,
    unit: 'item',
    stock: 12,
    rating: 0,
    reviewCount: 0,
    description: 'One-kilo bag',
  );

  CustomerOrder order(String id) => CustomerOrder(
    id: id,
    code: 'ORD-$id',
    businessName: 'Example Store',
    items: const [],
    total: 58.5,
    status: OrderStatus.pending,
    placedAt: DateTime.utc(2026, 9, 9),
    statusHistory: const [],
  );

  @override
  Future<StorefrontCatalog> getStorefront(String slug) async {
    requestedSlug = slug;
    return StorefrontCatalog(
      businessId: '7',
      businessName: 'Example Store',
      businessSlug: slug,
      categories: const [],
      products: [product],
    );
  }

  @override
  Future<List<PaymentInstruction>> listPaymentInstructions(
    String accessToken,
  ) async => const [];

  @override
  Future<Uint8List> getPaymentInstructionQr(
    String accessToken,
    String instructionId,
  ) async => Uint8List(0);

  @override
  Future<List<CustomerOrder>> listOrders(String accessToken) async => [
    order('1'),
  ];

  @override
  Future<CustomerOrder> placeOrder(
    String accessToken,
    Map<String, int> quantities,
    String idempotencyKey,
  ) async {
    placementKeys.add(idempotencyKey);
    if (failNextPlacement) {
      failNextPlacement = false;
      throw const StorefrontApiException('RETRY', 'Please retry.');
    }
    return order('2');
  }

  @override
  Future<CustomerOrder> cancelOrder(String accessToken, String orderId) async =>
      order(orderId);

  @override
  Future<RecordedPayment> submitOrderPayment(
    String accessToken,
    String orderId,
    WalletMethod method,
    String referenceNumber,
    String proofPath,
  ) async => RecordedPayment(
    id: 'payment-1',
    method: method,
    referenceNumber: referenceNumber,
    amount: 58.5,
    status: RecordedPaymentStatus.submitted,
    proofAvailable: true,
  );

  @override
  void close() {}
}
