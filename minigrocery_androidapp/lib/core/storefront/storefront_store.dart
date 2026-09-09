import 'package:flutter/widgets.dart';

import '../auth/auth_models.dart';
import '../../mock/models.dart';
import 'storefront_api.dart';
import 'storefront_models.dart';

class StorefrontStore extends ChangeNotifier {
  StorefrontStore(this._gateway, this._sessionProvider);

  final StorefrontGateway _gateway;
  final AuthSession? Function() _sessionProvider;
  StorefrontCatalog? catalog;
  List<CustomerOrder> orders = const [];
  final Map<String, int> _quantities = {};
  bool busy = false;
  String? error;
  String? _pendingOrderKey;

  List<CartLine> get cart => _quantities.entries
      .map((entry) {
        final product = catalog?.products
            .where((item) => item.id == entry.key)
            .firstOrNull;
        return product == null
            ? null
            : CartLine(product: product, quantity: entry.value);
      })
      .whereType<CartLine>()
      .toList(growable: false);

  double get total => cart.fold(0, (sum, line) => sum + line.subtotal);

  Future<void> load() async {
    final session = _sessionProvider();
    final slug = session?.user.businessSlug;
    if (session == null || slug == null) return;
    if (catalog != null && catalog!.businessSlug != slug) {
      reset(notify: false);
    }
    busy = true;
    error = null;
    notifyListeners();
    try {
      catalog = await _gateway.getStorefront(slug);
      orders = await _gateway.listOrders(session.accessToken);
    } on StorefrontApiException catch (exception) {
      error = exception.message;
    } catch (_) {
      error = 'Unable to load this store. Check your connection and try again.';
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  void add(Product product) {
    if (product.stock <= 0) return;
    _quantities[product.id] = ((_quantities[product.id] ?? 0) + 1).clamp(
      1,
      product.stock,
    );
    notifyListeners();
  }

  void setQuantity(Product product, int quantity) {
    _quantities[product.id] = quantity.clamp(1, product.stock);
    notifyListeners();
  }

  void remove(String productId) {
    _quantities.remove(productId);
    notifyListeners();
  }

  void reset({bool notify = true}) {
    catalog = null;
    orders = const [];
    _quantities.clear();
    _pendingOrderKey = null;
    busy = false;
    error = null;
    if (notify) notifyListeners();
  }

  Future<CustomerOrder?> placeOrder() async {
    final session = _sessionProvider();
    if (session == null || _quantities.isEmpty) return null;
    busy = true;
    error = null;
    _pendingOrderKey ??= 'android-${DateTime.now().microsecondsSinceEpoch}';
    notifyListeners();
    try {
      final order = await _gateway.placeOrder(
        session.accessToken,
        Map.unmodifiable(_quantities),
        _pendingOrderKey!,
      );
      _quantities.clear();
      _pendingOrderKey = null;
      orders = [order, ...orders.where((item) => item.id != order.id)];
      return order;
    } on StorefrontApiException catch (exception) {
      error = exception.message;
      return null;
    } catch (_) {
      error = 'Unable to place the order. Your cart has been kept.';
      return null;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  Future<void> cancel(CustomerOrder order) async {
    final session = _sessionProvider();
    if (session == null || order.status != OrderStatus.pending) return;
    busy = true;
    error = null;
    notifyListeners();
    try {
      final updated = await _gateway.cancelOrder(session.accessToken, order.id);
      orders = orders
          .map((item) => item.id == updated.id ? updated : item)
          .toList(growable: false);
    } on StorefrontApiException catch (exception) {
      error = exception.message;
    } finally {
      busy = false;
      notifyListeners();
    }
  }

  @override
  void dispose() {
    _gateway.close();
    super.dispose();
  }
}

class StorefrontScope extends InheritedNotifier<StorefrontStore> {
  const StorefrontScope({
    super.key,
    required StorefrontStore store,
    required super.child,
  }) : super(notifier: store);

  static StorefrontStore of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<StorefrontScope>();
    assert(scope != null, 'StorefrontScope is missing above this context.');
    return scope!.notifier!;
  }
}
