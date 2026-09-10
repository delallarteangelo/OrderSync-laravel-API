import { http } from "@/shared/api/axios";
import type {
  AiAssistantResponse,
  AiKnowledgeEntry,
  AiKnowledgeType,
  AiSupportSettings,
  AiUsage,
  SupportHandoff,
} from "@/shared/types/aiSupport";

export type KnowledgeInput = {
  type: AiKnowledgeType;
  title: string;
  question?: string | null;
  content: string;
  keywords?: string[];
  isActive?: boolean;
  publishedAt?: string | null;
};

export async function listAiKnowledge(): Promise<AiKnowledgeEntry[]> {
  const { data } = await http.get<{ items: AiKnowledgeEntry[] }>("/ai/knowledge");
  return data.items;
}

export async function listPublishedAiKnowledge(): Promise<AiKnowledgeEntry[]> {
  const { data } = await http.get<{ items: AiKnowledgeEntry[] }>("/ai/published");
  return data.items;
}

export async function createAiKnowledge(input: KnowledgeInput): Promise<AiKnowledgeEntry> {
  const { data } = await http.post<AiKnowledgeEntry>("/ai/knowledge", input);
  return data;
}

export async function updateAiKnowledge(
  id: string,
  input: KnowledgeInput,
): Promise<AiKnowledgeEntry> {
  const { data } = await http.put<AiKnowledgeEntry>(`/ai/knowledge/${id}`, input);
  return data;
}

export async function deactivateAiKnowledge(id: string): Promise<AiKnowledgeEntry> {
  const { data } = await http.post<AiKnowledgeEntry>(`/ai/knowledge/${id}/deactivate`);
  return data;
}

export async function getAiSupportSettings(): Promise<AiSupportSettings> {
  const { data } = await http.get<AiSupportSettings>("/ai/settings");
  return data;
}

export async function updateAiSupportSettings(
  settings: Pick<
    AiSupportSettings,
    | "assistantEnabled"
    | "dailyCustomerRequestLimit"
    | "monthlyBusinessRequestLimit"
    | "maximumQuestionCharacters"
  >,
): Promise<AiSupportSettings> {
  const { data } = await http.put<AiSupportSettings>("/ai/settings", settings);
  return data;
}

export async function getAiUsage(): Promise<AiUsage> {
  const { data } = await http.get<AiUsage>("/ai/usage");
  return data;
}

export async function askAiAssistant(threadId: string, body: string): Promise<AiAssistantResponse> {
  const { data } = await http.post<AiAssistantResponse>(`/threads/${threadId}/assistant`, {
    body,
  });
  return data;
}

export async function requestHumanHandoff(
  threadId: string,
  note?: string,
): Promise<SupportHandoff> {
  const { data } = await http.post<SupportHandoff>(`/threads/${threadId}/handoff`, { note });
  return data;
}

export async function listSupportHandoffs(): Promise<SupportHandoff[]> {
  const { data } = await http.get<{ items: SupportHandoff[] }>("/ai/handoffs");
  return data.items;
}

export async function resolveSupportHandoff(id: string): Promise<SupportHandoff> {
  const { data } = await http.post<SupportHandoff>(`/ai/handoffs/${id}/resolve`);
  return data;
}
