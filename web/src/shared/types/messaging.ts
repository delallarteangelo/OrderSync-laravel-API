export type ThreadKind = "GENERAL" | "ORDER";

export type ChatThread = {
  id: string;
  kind: ThreadKind;
  orderId?: string;
  customer: { id: string; name: string; avatarUrl?: string };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type Message = {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: "CUSTOMER" | "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "SYSTEM";
  body: string;
  sentAt: string;
  status?: "sending" | "sent" | "read";
};
