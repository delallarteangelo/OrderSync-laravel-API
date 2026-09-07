import { http } from "./axios";
import type { ChatThread, Message } from "@/shared/types/messaging";

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
