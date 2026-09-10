import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCheck, Loader2, MessageSquare, Search, Send } from "lucide-react";
import type { Message } from "@/shared/types/messaging";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Textarea } from "@/shared/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { EmptyState } from "@/shared/components/EmptyState";
import { useMarkThreadRead, useMessages, useSendMessage, useThreads } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import { relative, fmtDateTime } from "@/shared/lib/dates";
import { cn } from "@/shared/lib/cn";

export function ChatPage() {
  const params = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const user = useAuthStore.getState().user!;

  const threadsQ = useThreads();
  const threads = threadsQ.data ?? [];
  const [search, setSearch] = React.useState("");
  const [draft, setDraft] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const activeId = params.threadId ?? threads[0]?.id;
  const active = threads.find((t) => t.id === activeId);
  const messagesQ = useMessages(activeId);
  const remoteMessages = messagesQ.data ?? [];
  const [pending, setPending] = React.useState<Message[]>([]);
  const messages = activeId
    ? [...remoteMessages, ...pending.filter((m) => m.threadId === activeId)]
    : [];
  const sendM = useSendMessage(activeId ?? "");
  const markReadM = useMarkThreadRead();

  const filteredThreads = threads.filter((t) =>
    [t.customer.name, t.lastMessage].some((s) => s.toLowerCase().includes(search.toLowerCase())),
  );

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages.length, activeId]);

  React.useEffect(() => {
    if (!activeId) return;
    markReadM.mutate(activeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const initials = (name: string) =>
    name
      .split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const send = () => {
    if (!draft.trim() || !activeId) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      threadId: activeId,
      senderId: user.id,
      senderName: user.fullName,
      senderRole: user.role === "SUPER_ADMIN" ? "STAFF" : user.role,
      kind: "HUMAN",
      body: draft.trim(),
      sentAt: new Date().toISOString(),
      status: "sending",
      mine: true,
    };
    setPending((p) => [...p, optimistic]);
    const body = draft.trim();
    setDraft("");
    sendM.mutate(body, {
      onSuccess: () => {
        setPending((p) => p.filter((m) => m.id !== tempId));
      },
      onError: (e) => {
        setPending((p) => p.filter((m) => m.id !== tempId));
        toast.error(isApiError(e) ? e.message : "Failed to send message");
        setDraft(body);
      },
    });
  };

  return (
    <>
      <PageHeader
        title="Messages"
        description="Conversations with customers and order-specific threads."
        actions={
          <Badge variant="outline" className="gap-1">
            {threadsQ.isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
            Secure polling · 5 seconds
          </Badge>
        }
      />
      <Card className="grid h-[calc(100vh-220px)] grid-cols-[320px_1fr] overflow-hidden">
        {/* Thread list */}
        <div className="flex flex-col border-r">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search conversations…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <ul className="divide-y">
              {filteredThreads.map((t) => (
                <li key={t.id}>
                  <button
                    onClick={() => navigate(`/messages/${t.id}`)}
                    className={cn(
                      "flex w-full items-start gap-3 p-3 text-left hover:bg-muted/40",
                      t.id === activeId && "bg-muted/60",
                    )}
                  >
                    <Avatar>
                      <AvatarFallback>{initials(t.customer.name)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{t.customer.name}</p>
                        <span className="text-[10px] text-muted-foreground">
                          {t.lastMessageAt ? relative(t.lastMessageAt) : "New"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs text-muted-foreground">{t.lastMessage}</p>
                        {t.unreadCount > 0 && (
                          <Badge variant="success" className="h-5 px-1.5 text-[10px]">
                            {t.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {t.kind === "ORDER" && (
                        <Badge variant="info" className="mt-1 text-[10px]">
                          Order thread
                        </Badge>
                      )}
                      {t.handoffStatus === "OPEN" && (
                        <Badge variant="warning" className="ml-1 mt-1 text-[10px]">
                          Human handoff
                        </Badge>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>

        {/* Active thread */}
        <div className="flex min-h-0 flex-col">
          {active ? (
            <>
              <div className="flex items-center gap-3 border-b p-3">
                <Button asChild variant="ghost" size="icon" className="md:hidden">
                  <Link to="/messages">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <Avatar>
                  <AvatarFallback>{initials(active.customer.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{active.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {active.kind === "ORDER"
                      ? `Order ${active.orderCode ?? active.orderId}`
                      : "General inquiry"}
                  </p>
                </div>
              </div>
              <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-4">
                {messages.map((m) => {
                  if (m.kind === "SYSTEM") {
                    return (
                      <div key={m.id} className="my-2 text-center">
                        <span className="rounded-full bg-muted px-3 py-1 text-[11px] text-muted-foreground">
                          {m.body} · {fmtDateTime(m.sentAt)}
                        </span>
                      </div>
                    );
                  }
                  if (m.kind === "AI") {
                    return (
                      <div key={m.id} className="flex justify-start">
                        <div className="max-w-[70%] rounded-2xl rounded-bl-sm border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-950 shadow-sm">
                          <Badge variant="info" className="mb-1 text-[10px]">
                            AI · grounded assistant
                          </Badge>
                          <p className="whitespace-pre-wrap">{m.body}</p>
                          <p className="mt-1 text-[10px] text-blue-700">{fmtDateTime(m.sentAt)}</p>
                        </div>
                      </div>
                    );
                  }
                  const mine = m.mine;
                  return (
                    <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          mine
                            ? "rounded-br-sm bg-primary text-primary-foreground"
                            : "rounded-bl-sm bg-card",
                        )}
                      >
                        {!mine && (
                          <p className="mb-0.5 text-[10px] font-semibold opacity-80">
                            {m.senderName}
                          </p>
                        )}
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p
                          className={cn(
                            "mt-1 flex items-center gap-1 text-[10px]",
                            mine ? "text-primary-foreground/70" : "text-muted-foreground",
                          )}
                        >
                          {fmtDateTime(m.sentAt)}
                          {mine && m.status === "sending" && (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          )}
                          {mine && m.status === "sent" && <CheckCheck className="h-3 w-3" />}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="border-t p-3">
                <div className="flex items-end gap-2">
                  <Textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Write a message…"
                    rows={2}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        send();
                      }
                    }}
                  />
                  <Button onClick={send} disabled={!draft.trim()}>
                    <Send className="mr-1 h-4 w-4" />
                    Send
                  </Button>
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Enter to send · Shift+Enter for newline
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <EmptyState
                icon={<MessageSquare className="h-8 w-8" />}
                title="Pick a conversation"
                description="Choose a thread from the list to view messages."
              />
            </div>
          )}
        </div>
      </Card>
    </>
  );
}
