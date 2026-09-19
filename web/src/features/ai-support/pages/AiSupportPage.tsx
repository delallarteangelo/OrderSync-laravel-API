import * as React from "react";
import { Bot, CircleDollarSign, HandHelping, Plus, Save, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { PageHeader } from "@/shared/components/PageHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Textarea } from "@/shared/components/ui/textarea";
import {
  useAiKnowledge,
  useAiSupportSettings,
  useAiUsage,
  useCreateAiKnowledge,
  useDeactivateAiKnowledge,
  useDeleteAiKnowledge,
  useResolveSupportHandoff,
  useSupportHandoffs,
  useUpdateAiSupportSettings,
} from "@/shared/hooks/useApi";
import type { AiKnowledgeType, AiSupportSettings } from "@/shared/types/aiSupport";
import { isApiError } from "@/shared/api/errors";
import { fmtDateTime } from "@/shared/lib/dates";

type KnowledgeDraft = {
  type: AiKnowledgeType;
  title: string;
  question: string;
  content: string;
  keywords: string;
};

const emptyKnowledge: KnowledgeDraft = {
  type: "FAQ",
  title: "",
  question: "",
  content: "",
  keywords: "",
};

export function AiSupportPage() {
  const knowledge = useAiKnowledge();
  const settings = useAiSupportSettings();
  const usage = useAiUsage();
  const handoffs = useSupportHandoffs();
  const createKnowledge = useCreateAiKnowledge();
  const deactivateKnowledge = useDeactivateAiKnowledge();
  const deleteKnowledge = useDeleteAiKnowledge();
  const updateSettings = useUpdateAiSupportSettings();
  const resolveHandoff = useResolveSupportHandoff();
  const [draft, setDraft] = React.useState<KnowledgeDraft>(emptyKnowledge);
  const [settingsDraft, setSettingsDraft] = React.useState<AiSupportSettings | null>(null);
  const [deleteEntry, setDeleteEntry] = React.useState<{ id: string; title: string } | null>(null);

  React.useEffect(() => {
    if (settings.data && !settingsDraft) setSettingsDraft(settings.data);
  }, [settings.data, settingsDraft]);

  const fail = (error: unknown) =>
    toast.error(isApiError(error) ? error.message : "The AI support request failed");

  const addKnowledge = () => {
    createKnowledge.mutate(
      {
        type: draft.type,
        title: draft.title,
        question: draft.type === "FAQ" ? draft.question : null,
        content: draft.content,
        keywords: draft.keywords
          .split(",")
          .map((keyword) => keyword.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setDraft(emptyKnowledge);
          toast.success("Published knowledge saved");
        },
        onError: fail,
      },
    );
  };

  const saveSettings = () => {
    if (!settingsDraft) return;
    updateSettings.mutate(settingsDraft, {
      onSuccess: () => toast.success("AI support limits saved"),
      onError: fail,
    });
  };

  return (
    <>
      <PageHeader
        title="AI customer support"
        description="Grounded answers, published store knowledge, usage controls, and human handoff."
      />
      <div className="mb-4 grid gap-4 md:grid-cols-4">
        <Summary
          label="Provider mode"
          value={
            usage.data?.provider === "GEMINI"
              ? usage.data.publicInformationOnly
                ? "Gemini · public info"
                : "Google Gemini"
              : "Local grounded"
          }
          icon={<Bot className="h-4 w-4" />}
        />
        <Summary
          label="Requests this month"
          value={usage.data?.requests ?? 0}
          icon={<ShieldCheck className="h-4 w-4" />}
        />
        <Summary
          label="Human handoffs"
          value={usage.data?.handedOff ?? 0}
          icon={<HandHelping className="h-4 w-4" />}
        />
        <Summary
          label="Estimated provider cost"
          value={`₱${((usage.data?.estimatedCostMinor ?? 0) / 100).toFixed(2)}`}
          icon={<CircleDollarSign className="h-4 w-4" />}
        />
      </div>
      <Card className="mb-4 border-blue-200 bg-blue-50/50">
        <CardContent className="p-4 text-sm text-blue-950">
          {settings.data?.externalProviderConfigured
            ? settings.data.publicInformationOnly
              ? "Free-tier Gemini is connected for public store information only. Laravel selects published knowledge and public product/stock facts; the customer’s raw message and order details are never sent to Google. Personal questions use OrderSync’s local support, and unverified replies go to a person."
              : "Google Gemini is connected through Laravel. It receives only this tenant’s selected published knowledge, live product/stock facts, and the signed-in customer’s own order facts; unverified replies are handed to a person."
            : "No external AI provider is configured. Answers are assembled only from this tenant’s published knowledge, live products/stock, and the signed-in customer’s own orders."}
        </CardContent>
      </Card>
      <Tabs defaultValue="knowledge">
        <TabsList>
          <TabsTrigger value="knowledge">Knowledge</TabsTrigger>
          <TabsTrigger value="handoffs">Human handoffs</TabsTrigger>
          <TabsTrigger value="limits">Limits & usage</TabsTrigger>
        </TabsList>

        <TabsContent value="knowledge" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Publish a verified answer</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Field label="Type">
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={draft.type}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      type: event.target.value as AiKnowledgeType,
                    }))
                  }
                >
                  <option value="FAQ">FAQ</option>
                  <option value="ANNOUNCEMENT">Announcement</option>
                </select>
              </Field>
              <Field label="Title">
                <Input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </Field>
              {draft.type === "FAQ" && (
                <Field label="Customer question" className="md:col-span-2">
                  <Input
                    value={draft.question}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, question: event.target.value }))
                    }
                  />
                </Field>
              )}
              <Field label="Verified answer or announcement" className="md:col-span-2">
                <Textarea
                  rows={4}
                  value={draft.content}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, content: event.target.value }))
                  }
                />
              </Field>
              <Field label="Keywords (comma separated)" className="md:col-span-2">
                <Input
                  value={draft.keywords}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, keywords: event.target.value }))
                  }
                />
              </Field>
              <div className="md:col-span-2">
                <Button
                  onClick={addKnowledge}
                  disabled={
                    createKnowledge.isPending ||
                    !draft.title.trim() ||
                    !draft.content.trim() ||
                    (draft.type === "FAQ" && !draft.question.trim())
                  }
                >
                  <Plus className="mr-1 h-4 w-4" /> Publish
                </Button>
              </div>
            </CardContent>
          </Card>
          <div className="grid gap-3">
            {(knowledge.data ?? []).map((entry) => (
              <Card key={entry.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div>
                    <div className="mb-1 flex gap-2">
                      <Badge variant="outline">{entry.type}</Badge>
                      <Badge variant={entry.isActive ? "success" : "secondary"}>
                        {entry.isActive ? "Published" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="font-medium">{entry.title}</p>
                    {entry.question && (
                      <p className="text-sm text-muted-foreground">{entry.question}</p>
                    )}
                    <p className="mt-2 whitespace-pre-wrap text-sm">{entry.content}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {entry.isActive && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          deactivateKnowledge.mutate(entry.id, {
                            onSuccess: () => toast.success("Knowledge entry deactivated"),
                            onError: fail,
                          })
                        }
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteEntry({ id: entry.id, title: entry.title })}
                    >
                      <Trash2 className="mr-1 h-4 w-4" /> Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="handoffs">
          <Card>
            <CardContent className="divide-y p-0">
              {(handoffs.data ?? []).map((handoff) => (
                <div key={handoff.id} className="flex items-center justify-between gap-4 p-4">
                  <div>
                    <p className="font-medium">{handoff.customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {handoff.reasonCode.replaceAll("_", " ")} · {fmtDateTime(handoff.requestedAt)}
                    </p>
                    {handoff.customerNote && <p className="mt-1 text-sm">{handoff.customerNote}</p>}
                  </div>
                  {handoff.status === "OPEN" ? (
                    <Button
                      onClick={() =>
                        resolveHandoff.mutate(handoff.id, {
                          onSuccess: () => toast.success("Handoff marked resolved"),
                          onError: fail,
                        })
                      }
                    >
                      Resolve
                    </Button>
                  ) : (
                    <Badge variant="secondary">Resolved</Badge>
                  )}
                </div>
              ))}
              {(handoffs.data ?? []).length === 0 && (
                <p className="p-6 text-sm text-muted-foreground">No handoff requests.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="limits">
          <Card>
            <CardContent className="grid gap-4 p-6 md:grid-cols-2">
              {settingsDraft ? (
                <>
                  <div className="flex items-center justify-between rounded-md border p-3 md:col-span-2">
                    <div>
                      <p className="text-sm font-medium">Automated support enabled</p>
                      <p className="text-xs text-muted-foreground">
                        Human messaging remains available when this is off.
                      </p>
                    </div>
                    <Switch
                      checked={settingsDraft.assistantEnabled}
                      onCheckedChange={(assistantEnabled) =>
                        setSettingsDraft((current) =>
                          current ? { ...current, assistantEnabled } : current,
                        )
                      }
                    />
                  </div>
                  <NumberField
                    label="Daily requests per customer"
                    value={settingsDraft.dailyCustomerRequestLimit}
                    onChange={(dailyCustomerRequestLimit) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, dailyCustomerRequestLimit } : current,
                      )
                    }
                  />
                  <NumberField
                    label="Monthly requests for this business"
                    value={settingsDraft.monthlyBusinessRequestLimit}
                    onChange={(monthlyBusinessRequestLimit) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, monthlyBusinessRequestLimit } : current,
                      )
                    }
                  />
                  <NumberField
                    label="Maximum question characters"
                    value={settingsDraft.maximumQuestionCharacters}
                    onChange={(maximumQuestionCharacters) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, maximumQuestionCharacters } : current,
                      )
                    }
                  />
                  <div className="rounded-md border p-3 text-sm">
                    <p className="font-medium">Provider: {settingsDraft.provider}</p>
                    <p className="text-muted-foreground">
                      External provider configured:{" "}
                      {settingsDraft.externalProviderConfigured ? "Yes" : "No"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <Button onClick={saveSettings} disabled={updateSettings.isPending}>
                      <Save className="mr-1 h-4 w-4" /> Save limits
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Loading limits…</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <ConfirmDialog
        open={deleteEntry !== null}
        onOpenChange={(open) => !open && setDeleteEntry(null)}
        title="Delete knowledge entry?"
        description={
          deleteEntry
            ? `“${deleteEntry.title}” will be permanently removed and will no longer be available to customer support.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        busy={deleteKnowledge.isPending}
        onConfirm={() => {
          if (!deleteEntry) return;
          deleteKnowledge.mutate(deleteEntry.id, {
            onSuccess: () => {
              toast.success("Knowledge entry deleted");
              setDeleteEntry(null);
            },
            onError: (error) => {
              fail(error);
              setDeleteEntry(null);
            },
          });
        }}
      />
    </>
  );
}

function Summary({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-1 text-xl font-semibold">{value}</p>
        </div>
        <span className="text-primary">{icon}</span>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </Field>
  );
}
