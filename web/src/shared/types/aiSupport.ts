import type { Message } from "@/shared/types/messaging";

export type AiKnowledgeType = "FAQ" | "ANNOUNCEMENT";

export type AiKnowledgeEntry = {
  id: string;
  type: AiKnowledgeType;
  title: string;
  question: string | null;
  content: string;
  keywords: string[];
  isActive: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AiSupportSettings = {
  assistantEnabled: boolean;
  dailyCustomerRequestLimit: number;
  monthlyBusinessRequestLimit: number;
  maximumQuestionCharacters: number;
  provider: "LOCAL_GROUNDED" | "GEMINI";
  externalProviderConfigured: boolean;
  publicInformationOnly: boolean;
};

export type AiUsage = {
  period: string;
  provider: string;
  externalProviderConfigured: boolean;
  publicInformationOnly: boolean;
  requests: number;
  answered: number;
  handedOff: number;
  inputCharacters: number;
  outputCharacters: number;
  estimatedCostMinor: number;
  averageLatencyMs: number;
};

export type SupportHandoff = {
  id: string;
  threadId: string;
  customer: { id: string | null; name: string };
  status: "OPEN" | "RESOLVED";
  reasonCode: string;
  customerNote: string | null;
  requestedAt: string;
  resolvedAt: string | null;
  resolvedBy: string | null;
};

export type AiSupportRun = {
  id: string;
  status: "ANSWERED" | "HANDOFF" | "REFUSED" | "LIMITED" | "UNAVAILABLE";
  provider: string;
  model: string | null;
  toolsUsed: string[];
  inputCharacters: number;
  outputCharacters: number;
  estimatedCostMinor: number;
  latencyMs: number;
  reasonCode: string | null;
  createdAt: string;
};

export type AiAssistantResponse = {
  question: Message;
  response: Message;
  run: AiSupportRun;
  handoff: SupportHandoff | null;
};
