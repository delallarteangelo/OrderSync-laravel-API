import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTenantSubscription } from "@/shared/api/platform";
import {
  cancelTenantUpgrade,
  publicSubscriptionPlans,
  listTenantApplications,
  listTenantPlatformWallets,
  requestTenantUpgrade,
} from "@/shared/api/subscriptionApplications";
import { submitSubscriptionPayment } from "@/shared/api/payments";
import type { SubscriptionApplication } from "@/shared/api/subscriptionApplications";
import type { WalletMethod } from "@/shared/types/payments";
import { PageHeader } from "@/shared/components/PageHeader";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { PlanPerkList } from "@/features/subscription/components/PlanPerkList";
import { PrivatePaymentProofPreview } from "@/features/payments/components/PrivatePaymentProofPreview";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";

function money(minor: number | null) {
  return minor === null
    ? "Price unavailable"
    : `₱${(minor / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function UpgradePayment({ application }: { application: SubscriptionApplication }) {
  const wallets = useQuery({
    queryKey: ["tenant", "platform-wallets"],
    queryFn: listTenantPlatformWallets,
  });
  const [method, setMethod] = React.useState<WalletMethod>("GCASH");
  const [reference, setReference] = React.useState("");
  const [proof, setProof] = React.useState<File>();
  const queryClient = useQueryClient();
  React.useEffect(() => {
    if (wallets.data?.length && !wallets.data.some((wallet) => wallet.method === method)) {
      setMethod(wallets.data[0].method);
    }
  }, [method, wallets.data]);
  const submit = useMutation({
    mutationFn: () => submitSubscriptionPayment(application.bill!.id, method, reference, proof!),
    onSuccess: () => {
      toast.success("Proof submitted for manual review.");
      setReference("");
      setProof(undefined);
      void queryClient.invalidateQueries({ queryKey: ["tenant", "subscription-applications"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const selectedWallet = wallets.data?.find((wallet) => wallet.method === method);
  return (
    <div className="space-y-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
      <div>
        <p className="font-semibold">Payment is now ready</p>
        <p className="text-sm text-muted-foreground">
          Send exactly {money(application.amountDueMinor)} to one of the OrderSync accounts below,
          then attach the GCash or Maya receipt.
        </p>
      </div>
      {wallets.isLoading && <p className="text-sm">Loading OrderSync payment accounts…</p>}
      {wallets.data?.map((wallet) => (
        <button
          type="button"
          key={wallet.id}
          onClick={() => setMethod(wallet.method)}
          className={`w-full rounded-lg border p-3 text-left text-sm ${method === wallet.method ? "border-primary bg-background" : "bg-background/60"}`}
        >
          <span className="font-semibold">{wallet.method}</span>
          <br />
          {wallet.accountName} · {wallet.accountNumber}
        </button>
      ))}
      {!wallets.isLoading && !wallets.data?.length && (
        <p className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          No OrderSync payment account is available. Do not send payment yet.
        </p>
      )}
      {!!wallets.data?.length && (
        <form
          className="space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit.mutate();
          }}
        >
          <p className="text-xs text-muted-foreground">
            Selected: {selectedWallet?.method} · {selectedWallet?.accountName} ·{" "}
            {selectedWallet?.accountNumber}
          </p>
          <Label htmlFor={`reference-${application.id}`}>GCash or Maya reference number</Label>
          <Input
            id={`reference-${application.id}`}
            placeholder="Enter the reference shown on your receipt"
            value={reference}
            onChange={(event) => setReference(event.target.value)}
            required
          />
          <Label htmlFor={`proof-${application.id}`}>Attach receipt or screenshot</Label>
          <Input
            id={`proof-${application.id}`}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={(event) => setProof(event.target.files?.[0])}
            required
          />
          <p className="text-xs text-muted-foreground">
            JPG, PNG, WebP, or PDF · maximum 5 MB. The file stays private and is visible only to you
            and OrderSync administrators.
          </p>
          {proof && (
            <p className="rounded border bg-background p-2 text-sm">
              Selected file: <span className="font-medium">{proof.name}</span> ·{" "}
              {(proof.size / 1024).toFixed(0)} KB
            </p>
          )}
          <Button type="submit" disabled={submit.isPending || !reference.trim() || !proof}>
            {submit.isPending ? "Uploading…" : "Submit payment proof"}
          </Button>
        </form>
      )}
    </div>
  );
}

const statusText: Record<
  SubscriptionApplication["status"],
  { title: string; description: string }
> = {
  PENDING_REVIEW: {
    title: "Step 1 of 3 · Upgrade request under review",
    description:
      "OrderSync must approve the request and confirm the prorated quote before payment. Do not send money yet—the receipt upload will unlock here after approval.",
  },
  AWAITING_PAYMENT: {
    title: "Step 2 of 3 · Payment required",
    description: "Use an OrderSync GCash or Maya account below and attach the receipt.",
  },
  PAYMENT_SUBMITTED: {
    title: "Step 3 of 3 · Payment being verified",
    description:
      "OrderSync is comparing the proof with the actual incoming wallet transaction. Your current plan remains active while verification is pending.",
  },
  APPROVED: {
    title: "Upgrade completed",
    description: "The payment was verified and the new plan is active.",
  },
  REJECTED: {
    title: "Request not approved",
    description: "Review the reason below before submitting a new request.",
  },
  CANCELLED: {
    title: "Request cancelled",
    description: "This request is closed and no payment is due.",
  },
};

export function SubscriptionPage() {
  const [cancelTarget, setCancelTarget] = React.useState<string | null>(null);
  const current = useQuery({
    queryKey: ["tenant", "subscription"],
    queryFn: getTenantSubscription,
  });
  const plans = useQuery({
    queryKey: ["public", "subscription-plans"],
    queryFn: publicSubscriptionPlans,
  });
  const applications = useQuery({
    queryKey: ["tenant", "subscription-applications"],
    queryFn: listTenantApplications,
    refetchInterval: 30_000,
  });
  const queryClient = useQueryClient();
  const upgrade = useMutation({
    mutationFn: requestTenantUpgrade,
    onSuccess: () => {
      toast.success("Upgrade application sent for review.");
      void queryClient.invalidateQueries({ queryKey: ["tenant", "subscription-applications"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const cancel = useMutation({
    mutationFn: cancelTenantUpgrade,
    onSuccess: () => {
      toast.success("Upgrade application cancelled. You can request a fresh quote.");
      void queryClient.invalidateQueries({ queryKey: ["tenant", "subscription-applications"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const subscription = current.data?.subscription;
  const open = applications.data?.some((item) =>
    ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED"].includes(item.status),
  );
  const currentPrice = subscription?.plan.priceMinor ?? 0;
  return (
    <div className="space-y-5">
      <PageHeader
        title="Subscription"
        description="Your current plan, renewal date, and upgrade applications."
      />
      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent>
          {current.isLoading ? (
            "Loading…"
          ) : current.isError ? (
            "Subscription could not be loaded."
          ) : subscription ? (
            <p>
              {subscription.plan.name} · {money(subscription.plan.priceMinor)} / month ·{" "}
              {subscription.effectiveStatus}
              <br />
              Renewal date:{" "}
              {new Date(subscription.currentPeriodEnd).toLocaleDateString("en-PH", {
                dateStyle: "medium",
              })}
            </p>
          ) : (
            "No subscription assigned."
          )}
        </CardContent>
      </Card>
      <div className="grid gap-3 md:grid-cols-3">
        {plans.data?.map((plan) => (
          <Card key={plan.id}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p>{money(plan.priceMinor)} / month</p>
              <PlanPerkList plan={plan} />
              {plan.code !== "BASIC" &&
                plan.code !== subscription?.plan.code &&
                plan.isActive &&
                plan.priceMinor !== null &&
                plan.priceMinor > currentPrice && (
                  <Button
                    disabled={
                      !subscription ||
                      subscription.effectiveStatus !== "ACTIVE" ||
                      !!open ||
                      upgrade.isPending
                    }
                    onClick={() => upgrade.mutate(plan.code as "STANDARD" | "PREMIUM")}
                  >
                    Request upgrade
                  </Button>
                )}
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">
        A mid-period upgrade is quoted from the remaining time and the price difference. Your
        existing renewal date does not change. Prices are editable by OrderSync administration; the
        submitted quote is locked for review.
      </p>
      <h2 className="text-lg font-semibold">Applications</h2>
      {!applications.data?.length && <p>No subscription applications yet.</p>}
      {applications.data?.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-4 p-5">
            <div>
              <p className="font-medium">
                {item.fromPlan?.name ?? "New business"} → {item.desiredPlan.name}
              </p>
              <p className="mt-1 text-sm font-medium text-primary">
                {statusText[item.status].title}
              </p>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                {statusText[item.status].description}
              </p>
            </div>
            <p className="text-sm">
              Amount due: {money(item.amountDueMinor)}
              {item.periodEndSnapshot &&
                ` · Renewal stays ${new Date(item.periodEndSnapshot).toLocaleDateString("en-PH")}`}
            </p>
            {item.rejectionReason && (
              <p className="text-sm text-destructive">{item.rejectionReason}</p>
            )}
            {["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(item.status) &&
              item.payments.every((payment) => payment.status === "REJECTED") && (
                <Button
                  variant="outline"
                  disabled={cancel.isPending}
                  onClick={() => setCancelTarget(item.id)}
                >
                  Cancel request
                </Button>
              )}
            {item.status === "AWAITING_PAYMENT" && item.bill && (
              <UpgradePayment application={item} />
            )}
            {item.status === "PAYMENT_SUBMITTED" &&
              item.payments
                .filter((payment) => payment.status === "SUBMITTED")
                .map((payment) => (
                  <div
                    key={payment.id}
                    className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]"
                  >
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">Submitted {payment.method} payment</p>
                      <p>Reference: {payment.referenceNumber}</p>
                      <p>Claimed amount: {money(Math.round(payment.amount * 100))}</p>
                      <p className="text-muted-foreground">
                        Submitted {new Date(payment.submittedAt).toLocaleString("en-PH")}
                      </p>
                    </div>
                    {payment.proofAvailable && (
                      <PrivatePaymentProofPreview
                        path={`/tenant/payments/${payment.id}/proof`}
                        mimeType={payment.proofMimeType}
                        paymentId={payment.id}
                        autoLoad
                      />
                    )}
                  </div>
                ))}
          </CardContent>
        </Card>
      ))}
      <ConfirmDialog
        open={cancelTarget !== null}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancel upgrade request?"
        description="This closes the upgrade request and voids its unpaid bill. You can request a new quote later."
        confirmLabel="Cancel request"
        destructive
        busy={cancel.isPending}
        onConfirm={() => {
          if (cancelTarget) cancel.mutate(cancelTarget, { onSuccess: () => setCancelTarget(null) });
        }}
      />
    </div>
  );
}
