import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bot, Loader2, MessageCircle, Send, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import {
  askAiAssistant,
  listPublishedAiKnowledge,
  requestHumanHandoff,
} from "@/shared/api/aiSupport";
import { createThread, sendMessage } from "@/shared/api/messages";
import { isApiError } from "@/shared/api/errors";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Textarea } from "@/shared/components/ui/textarea";
import { useMessages, useThreads, qk } from "@/shared/hooks/useApi";
import { useOnlineStatus } from "@/shared/hooks/useOnlineStatus";
import { usePersistentDraft } from "@/shared/hooks/usePersistentDraft";
import { fmtDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/cn";

export function CustomerSupportPanel({ businessSlug }: { businessSlug: string }) {
  const user = useAuthStore((state) => state.user)!;
  const businessId = user.business?.id ?? "no-business";
  const online = useOnlineStatus();
  const queryClient = useQueryClient();
  const threadsQuery = useThreads();
  const threads = threadsQuery.data ?? [];
  const [selectedId, setSelectedId] = React.useState<string | undefined>();
  const [askAi, setAskAi] = React.useState(false);
  const activeId =
    selectedId ?? threads.find((thread) => thread.kind === "GENERAL")?.id ?? threads[0]?.id;
  const activeThread = threads.find((thread) => thread.id === activeId);
  const messagesQuery = useMessages(activeId);
  const messages = messagesQuery.data ?? [];
  const draftScope = `${businessSlug}:${user.id}:${activeId ?? "new"}`;
  const [draft, setDraft, clearDraft] = usePersistentDraft(draftScope);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const knowledgeQuery = useQuery({
    queryKey: ["tenant", businessId, "ai", "published"],
    queryFn: listPublishedAiKnowledge,
    enabled: online,
    retry: false,
  });

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  const ensureThread = React.useCallback(async () => {
    if (activeId) return activeId;
    const thread = await createThread();
    return thread.id;
  }, [activeId]);

  const refreshThread = React.useCallback(
    async (threadId: string) => {
      setSelectedId(threadId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.threads(businessId) }),
        queryClient.invalidateQueries({ queryKey: qk.messages(businessId, threadId) }),
      ]);
    },
    [businessId, queryClient],
  );

  const submit = useMutation({
    mutationFn: async ({ body, ai }: { body: string; ai: boolean }) => {
      const threadId = await ensureThread();
      if (ai) await askAiAssistant(threadId, body);
      else await sendMessage(threadId, body);
      return threadId;
    },
    onSuccess: async (threadId, variables) => {
      clearDraft();
      await refreshThread(threadId);
      toast.success(
        variables.ai
          ? "Grounded AI response received from the server."
          : "Message sent to the store.",
      );
    },
    onError: (error) => {
      toast.error(
        `${isApiError(error) ? error.message : "Unable to contact support."} Your draft is still saved.`,
      );
    },
  });

  const handoff = useMutation({
    mutationFn: async () => {
      const threadId = await ensureThread();
      await requestHumanHandoff(threadId, draft.trim() || undefined);
      return threadId;
    },
    onSuccess: async (threadId) => {
      clearDraft();
      await refreshThread(threadId);
      toast.success("Human support request confirmed by the server.");
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Unable to request human support."),
  });

  const send = () => {
    const body = draft.trim();
    if (!body || !online || submit.isPending) return;
    submit.mutate({ body, ai: askAi });
  };

  return (
    <Card id="support" className="scroll-mt-20">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Store support
          </CardTitle>
          <Badge variant={activeThread?.handoffStatus === "OPEN" ? "warning" : "outline"}>
            {activeThread?.handoffStatus === "OPEN"
              ? "Human help requested"
              : "Server-confirmed chat"}
          </Badge>
        </div>
        {threads.length > 1 && (
          <label className="text-sm">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">
              Conversation
            </span>
            <select
              className="h-10 w-full rounded-md border bg-background px-3"
              value={activeId}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {threads.map((thread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.kind === "ORDER"
                    ? `Order ${thread.orderCode ?? thread.orderId}`
                    : "General support"}
                </option>
              ))}
            </select>
          </label>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {(knowledgeQuery.data ?? []).length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Store FAQs and announcements
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {(knowledgeQuery.data ?? []).slice(0, 6).map((entry) => (
                <Button
                  key={entry.id}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-auto shrink-0 whitespace-normal text-left"
                  onClick={() => setDraft(entry.question ?? entry.title)}
                >
                  {entry.title}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div
          ref={scrollRef}
          aria-live="polite"
          className="max-h-80 min-h-32 space-y-2 overflow-y-auto rounded-md border bg-muted/30 p-3"
        >
          {messagesQuery.isLoading && (
            <p className="text-sm text-muted-foreground">Loading messages…</p>
          )}
          {!messagesQuery.isLoading && messages.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Ask the store a question, or switch to the clearly labeled grounded assistant.
            </p>
          )}
          {messages.map((message) => {
            if (message.kind === "SYSTEM") {
              return (
                <p key={message.id} className="text-center text-xs text-muted-foreground">
                  {message.body}
                </p>
              );
            }
            const ai = message.kind === "AI";
            return (
              <div
                key={message.id}
                className={cn("flex", message.mine ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3 py-2 text-sm",
                    message.mine && "rounded-br-sm bg-primary text-primary-foreground",
                    !message.mine && !ai && "rounded-bl-sm bg-background shadow-sm",
                    ai && "rounded-bl-sm border border-blue-200 bg-blue-50 text-blue-950",
                  )}
                >
                  {ai && (
                    <Badge variant="info" className="mb-1 text-[10px]">
                      AI · grounded assistant
                    </Badge>
                  )}
                  {!message.mine && !ai && (
                    <p className="text-[10px] font-semibold">{message.senderName}</p>
                  )}
                  <p className="whitespace-pre-wrap">{message.body}</p>
                  <p className="mt-1 text-[10px] opacity-70">{fmtDateTime(message.sentAt)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-2" aria-label="Reply mode">
          <Button
            type="button"
            size="sm"
            variant={!askAi ? "default" : "outline"}
            onClick={() => setAskAi(false)}
          >
            <UserRound className="mr-1 h-4 w-4" /> Ask the store
          </Button>
          <Button
            type="button"
            size="sm"
            variant={askAi ? "default" : "outline"}
            onClick={() => setAskAi(true)}
          >
            <Bot className="mr-1 h-4 w-4" /> Ask AI
          </Button>
        </div>

        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={askAi ? "Ask the grounded OrderSync AI…" : "Write a message to the store…"}
          rows={3}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              send();
            }
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            className="sm:min-w-32"
            disabled={!online || !draft.trim() || submit.isPending}
            onClick={send}
          >
            {submit.isPending ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-1 h-4 w-4" />
            )}
            {submit.isPending ? "Waiting…" : askAi ? "Ask AI" : "Send"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!online || handoff.isPending || activeThread?.handoffStatus === "OPEN"}
            onClick={() => handoff.mutate()}
          >
            <UserRound className="mr-1 h-4 w-4" /> Request human support
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Drafts stay on this device. Messages, AI answers, and handoffs appear only after the
          server confirms them.
        </p>
      </CardContent>
    </Card>
  );
}
