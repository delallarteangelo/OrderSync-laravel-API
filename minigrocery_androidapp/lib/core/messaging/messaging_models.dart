class MessagingThread {
  const MessagingThread({
    required this.id,
    required this.kind,
    required this.customerName,
    required this.lastMessage,
    required this.lastMessageAt,
    required this.unreadCount,
    this.orderId,
    this.orderCode,
  });

  final String id;
  final String kind;
  final String? orderId;
  final String? orderCode;
  final String customerName;
  final String lastMessage;
  final DateTime? lastMessageAt;
  final int unreadCount;

  factory MessagingThread.fromJson(Map<String, dynamic> json) {
    final customer = json['customer'] as Map<String, dynamic>;
    return MessagingThread(
      id: json['id'].toString(),
      kind: json['kind'] as String,
      orderId: json['orderId']?.toString(),
      orderCode: json['orderCode'] as String?,
      customerName: customer['name'] as String,
      lastMessage: json['lastMessage'] as String? ?? '',
      lastMessageAt: json['lastMessageAt'] == null
          ? null
          : DateTime.parse(json['lastMessageAt'] as String),
      unreadCount: json['unreadCount'] as int,
    );
  }
}

class MessagingMessage {
  const MessagingMessage({
    required this.id,
    required this.threadId,
    required this.senderName,
    required this.senderRole,
    required this.kind,
    required this.body,
    required this.sentAt,
    required this.status,
    required this.mine,
  });

  final String id;
  final String threadId;
  final String senderName;
  final String senderRole;
  final String kind;
  final String body;
  final DateTime sentAt;
  final String status;
  final bool mine;

  factory MessagingMessage.fromJson(Map<String, dynamic> json) =>
      MessagingMessage(
        id: json['id'].toString(),
        threadId: json['threadId'].toString(),
        senderName: json['senderName'] as String,
        senderRole: json['senderRole'] as String,
        kind: json['kind'] as String,
        body: json['body'] as String,
        sentAt: DateTime.parse(json['sentAt'] as String),
        status: json['status'] as String,
        mine: json['mine'] as bool,
      );
}

class AppUserNotification {
  const AppUserNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.createdAt,
    this.resourceType,
    this.resourceId,
    this.readAt,
  });

  final String id;
  final String type;
  final String title;
  final String body;
  final String? resourceType;
  final String? resourceId;
  final DateTime createdAt;
  final DateTime? readAt;

  factory AppUserNotification.fromJson(Map<String, dynamic> json) =>
      AppUserNotification(
        id: json['id'].toString(),
        type: json['type'] as String,
        title: json['title'] as String,
        body: json['body'] as String,
        resourceType: json['resourceType'] as String?,
        resourceId: json['resourceId']?.toString(),
        readAt: json['readAt'] == null
            ? null
            : DateTime.parse(json['readAt'] as String),
        createdAt: DateTime.parse(json['createdAt'] as String),
      );
}

class NotificationPreferences {
  const NotificationPreferences({
    required this.messagesEnabled,
    required this.ordersEnabled,
    required this.paymentsEnabled,
  });

  final bool messagesEnabled;
  final bool ordersEnabled;
  final bool paymentsEnabled;

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) =>
      NotificationPreferences(
        messagesEnabled: json['messagesEnabled'] as bool,
        ordersEnabled: json['ordersEnabled'] as bool,
        paymentsEnabled: json['paymentsEnabled'] as bool,
      );

  Map<String, dynamic> toJson() => {
    'messagesEnabled': messagesEnabled,
    'ordersEnabled': ordersEnabled,
    'paymentsEnabled': paymentsEnabled,
  };

  NotificationPreferences copyWith({
    bool? messagesEnabled,
    bool? ordersEnabled,
    bool? paymentsEnabled,
  }) => NotificationPreferences(
    messagesEnabled: messagesEnabled ?? this.messagesEnabled,
    ordersEnabled: ordersEnabled ?? this.ordersEnabled,
    paymentsEnabled: paymentsEnabled ?? this.paymentsEnabled,
  );
}

class EventPollResult {
  const EventPollResult({required this.cursor, required this.hasEvents});
  final String cursor;
  final bool hasEvents;
}
