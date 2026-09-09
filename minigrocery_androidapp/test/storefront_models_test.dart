import 'package:flutter_test/flutter_test.dart';
import 'package:minigrocery/core/storefront/storefront_models.dart';
import 'package:minigrocery/mock/models.dart';

void main() {
  test('parses the public catalog without business-only product data', () {
    final catalog = StorefrontCatalog.fromJson({
      'business': {'id': 7, 'name': 'Example Store', 'slug': 'example-store'},
      'categories': [
        {'id': 3, 'name': 'Pantry'},
      ],
      'products': [
        {
          'id': 11,
          'categoryId': 3,
          'name': 'Rice',
          'description': 'One-kilo bag',
          'price': 58.5,
          'stockOnHand': 12,
          'imageUrl': null,
        },
      ],
    });

    expect(catalog.businessSlug, 'example-store');
    expect(catalog.categories.single.name, 'Pantry');
    expect(catalog.products.single.price, 58.5);
    expect(catalog.products.single.stock, 12);
  });

  test('parses pickup order items and status history', () {
    final order = CustomerOrder.fromJson({
      'id': 91,
      'code': 'ORD-000091',
      'business': {'id': 7, 'name': 'Example Store'},
      'status': 'READY_FOR_PICKUP',
      'total': 117,
      'placedAt': '2026-09-09T01:00:00Z',
      'items': [
        {
          'productId': 11,
          'productName': 'Rice',
          'quantity': 2,
          'unitPrice': 58.5,
          'lineTotal': 117,
        },
      ],
      'statusHistory': [
        {
          'status': 'PENDING',
          'at': '2026-09-09T01:00:00Z',
          'actorName': 'Customer Example',
          'note': null,
        },
        {
          'status': 'READY_FOR_PICKUP',
          'at': '2026-09-09T01:20:00Z',
          'actorName': 'Store Owner',
          'note': 'Packed',
        },
      ],
    });

    expect(order.status, OrderStatus.readyForPickup);
    expect(order.items.single.lineTotal, 117);
    expect(order.statusHistory.last.note, 'Packed');
  });
}
