import { isoMinutesAgo, isoHoursAgo } from "@/shared/lib/dates";

export type NotificationItem = {
  id: string;
  kind: "order" | "stock" | "message" | "system";
  title: string;
  body: string;
  at: string;
  read: boolean;
};

export const mockNotifications: NotificationItem[] = [
  {
    id: "n-1",
    kind: "order",
    title: "New order ORD-2026013",
    body: "Aling Nena placed a ₱1,240 order",
    at: isoMinutesAgo(8),
    read: false,
  },
  {
    id: "n-2",
    kind: "message",
    title: "New message",
    body: "Mang Berto: Okay po, sigurado may stock pa kayo ng Lucky Me?",
    at: isoMinutesAgo(45),
    read: false,
  },
  {
    id: "n-3",
    kind: "stock",
    title: "Low stock alert",
    body: "Piattos Cheese 85g is below threshold (4 left)",
    at: isoHoursAgo(2),
    read: true,
  },
  {
    id: "n-4",
    kind: "stock",
    title: "Out of stock",
    body: "Nescafe 3-in-1 Original 20g is out of stock",
    at: isoHoursAgo(5),
    read: true,
  },
  {
    id: "n-5",
    kind: "system",
    title: "Daily backup complete",
    body: "All data backed up at 02:00 AM",
    at: isoHoursAgo(10),
    read: true,
  },
];
