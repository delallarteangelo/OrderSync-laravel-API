import { http } from "./axios";
import type {
  ChatThread,
  Message,
  NotificationPreferences,
  RealtimeEvent,
  UserNotification,
} from "@/shared/types/messaging";

export async function listThreads(): Promise<ChatThread[]> {
  const { data } = await http.get<{ items: ChatThread[] }>("/threads");
  return data.items;
}

export async function listMessages(threadId: string): Promise<Message[]> {
  const { data } = await http.get<{ items: Message[] }>(`/threads/${threadId}/messages`);
  return data.items;
}

export async function sendMessage(threadId: string, body: string): Promise<Message> {
  const { data } = await http.post<Message>(`/threads/${threadId}/messages`, { body });
  return data;
}

export async function markThreadRead(threadId: string): Promise<void> {
  await http.post(`/threads/${threadId}/read`);
}

export async function createThread(orderId?: string): Promise<ChatThread> {
  const { data } = await http.post<ChatThread>("/threads", orderId ? { orderId } : {});
  return data;
}

export async function listNotifications(): Promise<{
  items: UserNotification[];
  unreadCount: number;
}> {
  const { data } = await http.get<{ items: UserNotification[]; unreadCount: number }>(
    "/notifications",
  );
  return data;
}

export async function markNotificationRead(id: string): Promise<UserNotification> {
  const { data } = await http.post<UserNotification>(`/notifications/${id}/read`);
  return data;
}

export async function markAllNotificationsRead(): Promise<void> {
  await http.post("/notifications/read-all");
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  const { data } = await http.get<NotificationPreferences>("/notification-preferences");
  return data;
}

export async function updateNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<NotificationPreferences> {
  const { data } = await http.put<NotificationPreferences>(
    "/notification-preferences",
    preferences,
  );
  return data;
}

export async function pollEvents(after = "0"): Promise<{
  items: RealtimeEvent[];
  cursor: string;
  transport: "POLLING";
}> {
  const { data } = await http.get<{
    items: RealtimeEvent[];
    cursor: string;
    transport: "POLLING";
  }>("/events", { params: { after } });
  return data;
}
