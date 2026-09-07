import 'package:flutter/material.dart';

enum OrderStatus {
  pending,
  confirmed,
  rejected,
  preparing,
  readyForPickup,
  completed,
  cancelled,
}

enum MessageDirection { sent, received, system }

enum NotificationType { order, promo, system }

class Category {
  final String id;
  final String name;
  final IconData icon;
  final Color tint;
  const Category({
    required this.id,
    required this.name,
    required this.icon,
    required this.tint,
  });
}

class Product {
  final String id;
  final String name;
  final String categoryId;
  final double price;
  final String unit;
  final int stock;
  final double rating;
  final int reviewCount;
  final String description;
  final String? imageAsset;
  const Product({
    required this.id,
    required this.name,
    required this.categoryId,
    required this.price,
    required this.unit,
    required this.stock,
    required this.rating,
    required this.reviewCount,
    required this.description,
    this.imageAsset,
  });

  String get imageUrl => 'https://picsum.photos/seed/$id/300/300';

  ImageProvider get image => imageAsset != null
      ? AssetImage(imageAsset!) as ImageProvider
      : NetworkImage(imageUrl);
}

class CartLine {
  final Product product;
  final int quantity;
  const CartLine({required this.product, required this.quantity});
  double get subtotal => product.price * quantity;
}

class OrderItem {
  final Product product;
  final int quantity;
  const OrderItem({required this.product, required this.quantity});
  double get subtotal => product.price * quantity;
}

class Address {
  final String label;
  final String line1;
  final String line2;
  final String city;
  const Address({
    required this.label,
    required this.line1,
    required this.line2,
    required this.city,
  });
  String get full => '$line1, $line2, $city';
}

class AppOrder {
  final String id;
  final DateTime placedAt;
  final List<OrderItem> items;
  final double subtotal;
  final double deliveryFee;
  final double total;
  final OrderStatus status;
  final String? eta;
  final Address address;
  const AppOrder({
    required this.id,
    required this.placedAt,
    required this.items,
    required this.subtotal,
    required this.deliveryFee,
    required this.total,
    required this.status,
    required this.eta,
    required this.address,
  });
}

class ChatMessage {
  final String id;
  final MessageDirection direction;
  final String text;
  final DateTime sentAt;
  const ChatMessage({
    required this.id,
    required this.direction,
    required this.text,
    required this.sentAt,
  });
}

class ChatThreadSummary {
  final String id;
  final String partnerName;
  final String lastMessage;
  final DateTime lastAt;
  final int unread;
  const ChatThreadSummary({
    required this.id,
    required this.partnerName,
    required this.lastMessage,
    required this.lastAt,
    required this.unread,
  });
}

class AppNotification {
  final String id;
  final NotificationType type;
  final String title;
  final String body;
  final DateTime at;
  final bool unread;
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.at,
    required this.unread,
  });
}

class UserProfile {
  final String name;
  final String email;
  final String phone;
  final Address address;
  final String avatarUrl;
  const UserProfile({
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.avatarUrl,
  });
}
