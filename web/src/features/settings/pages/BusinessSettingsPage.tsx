import * as React from "react";
import { toast } from "sonner";
import { Save } from "lucide-react";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { useSettings, useUpdateSettings } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import type { BusinessSettings } from "@/shared/types/settings";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTenantSubscription } from "@/shared/api/platform";
import { Badge } from "@/shared/components/ui/badge";
import {
  getPaymentReceipt,
  listTenantBillingRecords,
  openPrivatePaymentFile,
  submitSubscriptionPayment,
} from "@/shared/api/payments";
import type { BillingRecord } from "@/shared/types/platform";
import type { RecordedPayment, WalletMethod } from "@/shared/types/payments";

export function BusinessSettingsPage() {
  const settingsQ = useSettings();
  const updateM = useUpdateSettings();
  const [draft, setDraft] = React.useState<BusinessSettings | null>(null);
  const subscriptionQ = useQuery({
    queryKey: ["tenant", "subscription"],
    queryFn: getTenantSubscription,
  });

  React.useEffect(() => {
    if (settingsQ.data && !draft) setDraft(settingsQ.data);
  }, [settingsQ.data, draft]);

  if (!draft) {
    return (
      <>
        <PageHeader title="Business settings" description="Loading…" />
      </>
    );
  }

  const set = <K extends keyof BusinessSettings>(k: K, v: BusinessSettings[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));

  const save = () => {
    updateM.mutate(draft, {
      onSuccess: () => toast.success("Settings saved"),
      onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to save settings"),
    });
  };

  return (
    <>
      <PageHeader
        title="Business settings"
        description="Store profile, tax, receipt template, and inventory defaults."
        actions={
          <Button onClick={save} disabled={updateM.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {updateM.isPending ? "Saving…" : "Save changes"}
          </Button>
        }
      />
      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Store profile</TabsTrigger>
          <TabsTrigger value="tax">Tax &amp; currency</TabsTrigger>
          <TabsTrigger value="receipt">Receipt</TabsTrigger>
          <TabsTrigger value="inventory">Inventory defaults</TabsTrigger>
          <TabsTrigger value="subscription">Subscription</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Store name">
                <Input value={draft.storeName} onChange={(e) => set("storeName", e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <Input
                  type="email"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Address" className="md:col-span-2">
                <Textarea
                  rows={2}
                  value={draft.address}
                  onChange={(e) => set("address", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Tax rate (%)">
                <Input
                  type="number"
                  step="0.01"
                  value={draft.taxRate}
                  onChange={(e) => set("taxRate", Number(e.target.value))}
                />
              </Field>
              <Field label="Currency symbol">
                <Input
                  value={draft.currencySymbol}
                  onChange={(e) => set("currencySymbol", e.target.value)}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receipt">
          <Card>
            <CardContent className="space-y-4 p-6">
              <Field label="Receipt header">
                <Textarea
                  rows={2}
                  value={draft.receiptHeader}
                  onChange={(e) => set("receiptHeader", e.target.value)}
                />
              </Field>
              <Field label="Receipt footer">
                <Textarea
                  rows={2}
                  value={draft.receiptFooter}
                  onChange={(e) => set("receiptFooter", e.target.value)}
                />
              </Field>
              <p className="text-xs text-muted-foreground">
                Both fields appear on every printed POS receipt.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
              <Field label="Default low-stock threshold">
                <Input
                  type="number"
                  value={draft.lowStockDefault}
                  onChange={(e) => set("lowStockDefault", Number(e.target.value))}
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription">
          <Card>
            <CardContent className="space-y-4 p-6">
              {subscriptionQ.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading subscription…</p>
              ) : subscriptionQ.data?.subscription ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Current plan</p>
                      <p className="text-xl font-semibold">
                        {subscriptionQ.data.subscription.plan.name}
                      </p>
                    </div>
                    <Badge>{subscriptionQ.data.subscription.effectiveStatus}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Current period ends{" "}
                    {new Intl.DateTimeFormat("en-PH", { dateStyle: "long" }).format(
                      new Date(subscriptionQ.data.subscription.currentPeriodEnd),
                    )}
                    .
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {Object.entries(subscriptionQ.data.subscription.plan.entitlements).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <span>{key.replaceAll("_", " ")}</span>
                          <strong>
                            {typeof value === "boolean"
                              ? value
                                ? "Included"
                                : "Not included"
                              : value}
                          </strong>
                        </div>
                      ),
                    )}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No subscription has been assigned.</p>
              )}
              <SubscriptionPayments />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

type TenantBill = BillingRecord & { payments: RecordedPayment[] };

function SubscriptionPayments() {
  const bills = useQuery({
    queryKey: ["tenant", "billing-records"],
    queryFn: listTenantBillingRecords,
  });

  return (
    <section className="space-y-3 border-t pt-5">
      <div>
        <h3 className="font-medium">Subscription payment records</h3>
        <p className="text-sm text-muted-foreground">
          Upload a GCash or Maya proof for manual platform review. This does not contact the wallet
          provider.
        </p>
      </div>
      {bills.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading billing records…</p>
      ) : null}
      {bills.isError ? (
        <p className="text-sm text-destructive">Unable to load billing records.</p>
      ) : null}
      {bills.data?.length === 0 ? (
        <p className="text-sm text-muted-foreground">No billing records yet.</p>
      ) : null}
      {bills.data?.map((bill) => (
        <SubscriptionBill key={bill.id} bill={bill} />
      ))}
    </section>
  );
}

function SubscriptionBill({ bill }: { bill: TenantBill }) {
  const queryClient = useQueryClient();
  const [method, setMethod] = React.useState<WalletMethod>("GCASH");
  const [reference, setReference] = React.useState("");
  const [proof, setProof] = React.useState<File | null>(null);
  const active = bill.payments.find((payment) => payment.status !== "REJECTED");
  const submit = useMutation({
    mutationFn: () => {
      if (!proof) throw new Error("Choose a proof image or PDF.");
      return submitSubscriptionPayment(bill.id, method, reference, proof);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tenant", "billing-records"] });
      setReference("");
      setProof(null);
      toast.success("Payment proof submitted for manual review");
    },
    onError: (error) => toast.error(error.message),
  });

  const showReceipt = async (payment: RecordedPayment) => {
    try {
      const receipt = await getPaymentReceipt(payment, "tenant");
      toast.success(
        `Receipt ${receipt.receiptNumber} · ${receipt.method} · ₱${receipt.amount.toFixed(2)}`,
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load receipt");
    }
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">
            {new Intl.NumberFormat("en-PH", { style: "currency", currency: bill.currency }).format(
              bill.amountMinor / 100,
            )}
          </p>
          <p className="text-xs text-muted-foreground">
            Due{" "}
            {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(bill.dueAt))}
          </p>
        </div>
        <Badge>{bill.status}</Badge>
      </div>

      {bill.payments.map((payment) => (
        <div
          key={payment.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/40 p-3 text-sm"
        >
          <span>
            {payment.method} · {payment.referenceNumber}
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{payment.status}</Badge>
            {payment.proofAvailable ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  void openPrivatePaymentFile(
                    `/tenant/payments/${payment.id}/proof`,
                    `subscription-proof-${payment.id}`,
                  )
                }
              >
                Proof
              </Button>
            ) : null}
            {payment.status === "VERIFIED" ? (
              <Button size="sm" variant="ghost" onClick={() => void showReceipt(payment)}>
                Receipt
              </Button>
            ) : null}
          </div>
          {payment.rejectionReason ? (
            <p className="w-full text-xs text-destructive">Rejected: {payment.rejectionReason}</p>
          ) : null}
        </div>
      ))}

      {!active && ["PENDING", "OVERDUE"].includes(bill.status) ? (
        <div className="grid gap-2 md:grid-cols-[120px_1fr_1fr_auto]">
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={method}
            onChange={(event) => setMethod(event.target.value as WalletMethod)}
          >
            <option value="GCASH">GCash</option>
            <option value="MAYA">Maya</option>
          </select>
          <Input
            aria-label="Subscription payment reference"
            placeholder="Reference number"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
          />
          <Input
            aria-label="Subscription payment proof"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setProof(event.target.files?.[0] ?? null)}
          />
          <Button
            disabled={submit.isPending || !reference.trim() || !proof}
            onClick={() => submit.mutate()}
          >
            {submit.isPending ? "Uploading…" : "Submit proof"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
