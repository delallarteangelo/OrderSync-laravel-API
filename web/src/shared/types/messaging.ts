export type ThreadKind = "GENERAL" | "ORDER";

export type ChatThread = {
  id: string;
  kind: ThreadKind;
  orderId?: string | null;
  orderCode?: string | null;
  customer: { id: string | null; name: string; avatarUrl?: string };
  lastMessage: string;
  lastMessageAt: string | null;
  unreadCount: number;
  handoffStatus?: "OPEN" | null;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "SYSTEM" | "AI";
  kind?: "HUMAN" | "SYSTEM" | "AI";
  body: string;
  sentAt: string;
  status: "sending" | "sent" | "read";
  mine?: boolean;
};

export type UserNotification = {
  id: string;
  type: "MESSAGE" | "ORDER" | "PAYMENT" | "SYSTEM";
  title: string;
  body: string;
  resourceType: "THREAD" | "PAYMENT" | null;
  resourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationPreferences = {
  messagesEnabled: boolean;
  ordersEnabled: boolean;
  paymentsEnabled: boolean;
};

export type RealtimeEvent = {
  id: string;
  type: "NOTIFICATION_CREATED";
  resourceType: "NOTIFICATION";
  resourceId: string;
  data: { notificationType?: UserNotification["type"] };
  occurredAt: string;
};
