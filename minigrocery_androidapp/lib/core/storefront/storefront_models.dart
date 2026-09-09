import 'package:flutter/material.dart';

import '../../mock/models.dart';

class StorefrontCatalog {
  const StorefrontCatalog({
    required this.businessId,
    required this.businessName,
    required this.businessSlug,
    required this.categories,
    required this.products,
  });

  final String businessId;
  final String businessName;
  final String businessSlug;
  final List<Category> categories;
  final List<Product> products;

  factory StorefrontCatalog.fromJson(Map<String, dynamic> json) {
    final business = json['business'] as Map<String, dynamic>;
    final categories = (json['categories'] as List<dynamic>)
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => Category(
            id: item['id'].toString(),
            name: item['name'] as String,
            icon: Icons.shopping_basket_outlined,
            tint: const Color(0xFFEAF7EE),
          ),
        )
        .toList(growable: false);
    final products = (json['products'] as List<dynamic>)
        .map((item) => item as Map<String, dynamic>)
        .map(
          (item) => Product(
            id: item['id'].toString(),
            name: item['name'] as String,
            categoryId: item['categoryId'].toString(),
            price: (item['price'] as num).toDouble(),
            unit: 'item',
            stock: item['stockOnHand'] as int,
            rating: 0,
            reviewCount: 0,
            description: item['description'] as String? ?? '',
            remoteImageUrl: item['imageUrl'] as String?,
          ),
        )
        .toList(growable: false);
    return StorefrontCatalog(
      businessId: business['id'].toString(),
      businessName: business['name'] as String,
      businessSlug: business['slug'] as String,
      categories: categories,
      products: products,
    );
  }
}

class CustomerOrderItem {
  const CustomerOrderItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  final String productId;
  final String productName;
  final int quantity;
  final double unitPrice;
  final double lineTotal;

  factory CustomerOrderItem.fromJson(Map<String, dynamic> json) =>
      CustomerOrderItem(
        productId: json['productId'].toString(),
        productName: json['productName'] as String,
        quantity: json['quantity'] as int,
        unitPrice: (json['unitPrice'] as num).toDouble(),
        lineTotal: (json['lineTotal'] as num).toDouble(),
      );
}

class CustomerOrderEvent {
  const CustomerOrderEvent({
    required this.status,
    required this.at,
    required this.actorName,
    this.note,
  });

  final OrderStatus status;
  final DateTime at;
  final String actorName;
  final String? note;
}

enum WalletMethod { gcash, maya }

enum RecordedPaymentStatus { submitted, verified, rejected }

class PaymentInstruction {
  const PaymentInstruction({
    required this.id,
    required this.method,
    required this.accountName,
    required this.accountNumber,
    required this.instructions,
    required this.qrAvailable,
  });

  final String id;
  final WalletMethod method;
  final String accountName;
  final String accountNumber;
  final String? instructions;
  final bool qrAvailable;

  factory PaymentInstruction.fromJson(Map<String, dynamic> json) =>
      PaymentInstruction(
        id: json['id'].toString(),
        method: json['method'] == 'MAYA'
            ? WalletMethod.maya
            : WalletMethod.gcash,
        accountName: json['accountName'] as String,
        accountNumber: json['accountNumber'] as String,
        instructions: json['instructions'] as String?,
        qrAvailable: json['qrAvailable'] as bool? ?? false,
      );
}

class RecordedPayment {
  const RecordedPayment({
    required this.id,
    required this.method,
    required this.referenceNumber,
    required this.amount,
    required this.status,
    required this.proofAvailable,
    this.receiptNumber,
    this.rejectionReason,
  });

  final String id;
  final WalletMethod method;
  final String referenceNumber;
  final double amount;
  final RecordedPaymentStatus status;
  final bool proofAvailable;
  final String? receiptNumber;
  final String? rejectionReason;

  factory RecordedPayment.fromJson(Map<String, dynamic> json) =>
      RecordedPayment(
        id: json['id'].toString(),
        method: json['method'] == 'MAYA'
            ? WalletMethod.maya
            : WalletMethod.gcash,
        referenceNumber: json['referenceNumber'] as String,
        amount: (json['amount'] as num).toDouble(),
        status: switch (json['status']) {
          'VERIFIED' => RecordedPaymentStatus.verified,
          'REJECTED' => RecordedPaymentStatus.rejected,
          _ => RecordedPaymentStatus.submitted,
        },
        proofAvailable: json['proofAvailable'] as bool? ?? false,
        receiptNumber: json['receiptNumber'] as String?,
        rejectionReason: json['rejectionReason'] as String?,
      );
}

class CustomerOrder {
  const CustomerOrder({
    required this.id,
    required this.code,
    required this.businessName,
    required this.items,
    required this.total,
    required this.status,
    required this.placedAt,
    required this.statusHistory,
    this.payments = const [],
  });

  final String id;
  final String code;
  final String businessName;
  final List<CustomerOrderItem> items;
  final double total;
  final OrderStatus status;
  final DateTime placedAt;
  final List<CustomerOrderEvent> statusHistory;
  final List<RecordedPayment> payments;

  factory CustomerOrder.fromJson(Map<String, dynamic> json) {
    final business = json['business'] as Map<String, dynamic>;
    return CustomerOrder(
      id: json['id'].toString(),
      code: json['code'] as String,
      businessName: business['name'] as String,
      items: (json['items'] as List<dynamic>)
          .map(
            (item) => CustomerOrderItem.fromJson(item as Map<String, dynamic>),
          )
          .toList(growable: false),
      total: (json['total'] as num).toDouble(),
      status: _status(json['status'] as String),
      placedAt: DateTime.parse(json['placedAt'] as String),
      statusHistory: (json['statusHistory'] as List<dynamic>)
          .map((item) => item as Map<String, dynamic>)
          .map(
            (item) => CustomerOrderEvent(
              status: _status(item['status'] as String),
              at: DateTime.parse(item['at'] as String),
              actorName: item['actorName'] as String,
              note: item['note'] as String?,
            ),
          )
          .toList(growable: false),
      payments: (json['payments'] as List<dynamic>? ?? const [])
          .map((item) => RecordedPayment.fromJson(item as Map<String, dynamic>))
          .toList(growable: false),
    );
  }

  static OrderStatus _status(String value) => switch (value) {
    'PENDING' => OrderStatus.pending,
    'CONFIRMED' => OrderStatus.confirmed,
    'REJECTED' => OrderStatus.rejected,
    'PREPARING' => OrderStatus.preparing,
    'READY_FOR_PICKUP' => OrderStatus.readyForPickup,
    'COMPLETED' => OrderStatus.completed,
    'CANCELLED' => OrderStatus.cancelled,
    _ => throw const FormatException('Unsupported order status.'),
  };
}
