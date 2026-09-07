import type { ChatThread, Message } from "@/shared/types/messaging";
import { isoMinutesAgo, isoHoursAgo, isoDaysAgo } from "@/shared/lib/dates";

export const mockThreads: ChatThread[] = [
  {
    id: "t-1",
    kind: "GENERAL",
    customer: { id: "c-1", name: "Aling Nena Sari-Sari Store" },
    lastMessage: "Salamat po! Pakidagdag na lang sa bukas na delivery.",
    lastMessageAt: isoMinutesAgo(12),
    unreadCount: 2,
  },
  {
    id: "t-2",
    kind: "ORDER",
    orderId: "o-1000",
    customer: { id: "c-2", name: "Mang Berto's Carinderia" },
    lastMessage: "Okay po, sigurado may stock pa kayo ng Lucky Me?",
    lastMessageAt: isoMinutesAgo(45),
    unreadCount: 1,
  },
  {
    id: "t-3",
    kind: "GENERAL",
    customer: { id: "c-3", name: "Cely Mini-Store" },
    lastMessage: "Order confirmed",
    lastMessageAt: isoHoursAgo(3),
    unreadCount: 0,
  },
  {
    id: "t-4",
    kind: "ORDER",
    orderId: "o-1004",
    customer: { id: "c-4", name: "Tindahan ni Aleng Rosa" },
    lastMessage: "Pickup po bukas ng tanghali, pwede po ba?",
    lastMessageAt: isoHoursAgo(8),
    unreadCount: 0,
  },
  {
    id: "t-5",
    kind: "GENERAL",
    customer: { id: "c-5", name: "JB Variety Shop" },
    lastMessage: "Pasalamat po sa mabilis na service!",
    lastMessageAt: isoDaysAgo(2),
    unreadCount: 0,
  },
];

function makeMessages(threadId: string, customerName: string, count: number): Message[] {
  const msgs: Message[] = [];
  for (let i = 0; i < count; i++) {
    const fromCustomer = i % 2 === 0;
    msgs.push({
      id: `m-${threadId}-${i}`,
      threadId,
      senderId: fromCustomer ? "c" : "u-cash-1",
      senderName: fromCustomer ? customerName : "Maria Santos",
      senderRole: fromCustomer ? "CUSTOMER" : "CASHIER",
      body: fromCustomer
        ? [
            "Magandang umaga po!",
            "May stock pa po ba kayo ng Lucky Me Pancit Canton?",
            "Salamat po, ipa-place ko na ang order ko.",
            "Saang oras po pwede mag-pickup?",
            "Pakiconfirm na lang po pag ready na.",
          ][i % 5]
        : [
            "Magandang umaga rin po!",
            "Yes po, may natitira pang 90 packs.",
            "Sige po, hinihintay namin order niyo.",
            "Pwede po ng 9AM bukas.",
            "Confirmed na po ang order niyo, ready for pickup.",
          ][i % 5],
      sentAt: isoMinutesAgo((count - i) * 4),
      status: "sent",
    });
  }
  if (threadId === "t-2") {
    msgs.splice(3, 0, {
      id: `m-${threadId}-sys-1`,
      threadId,
      senderId: "system",
      senderName: "System",
      senderRole: "SYSTEM",
      body: "Order ORD-2026001 confirmed",
      sentAt: isoMinutesAgo(40),
      status: "sent",
    });
  }
  return msgs;
}

export const mockMessages: Record<string, Message[]> = {
  "t-1": makeMessages("t-1", "Aling Nena", 8),
  "t-2": makeMessages("t-2", "Mang Berto", 9),
  "t-3": makeMessages("t-3", "Cely", 6),
  "t-4": makeMessages("t-4", "Aleng Rosa", 7),
  "t-5": makeMessages("t-5", "JB Variety", 8),
};
