import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  listPlatformApplications,
  listPlatformWallets,
  reviewPlatformApplication,
  savePlatformWallet,
} from "@/shared/api/subscriptionApplications";
import type { PlatformWallet } from "@/shared/api/subscriptionApplications";
import type { WalletMethod } from "@/shared/types/payments";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Badge } from "@/shared/components/ui/badge";
import { Money } from "@/shared/components/Money";
import { PrivatePaymentProofPreview } from "@/features/payments/components/PrivatePaymentProofPreview";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog";
import { TextEntryDialog } from "@/shared/components/TextEntryDialog";

function WalletForm({ method, current }: { method: WalletMethod; current?: PlatformWallet }) {
  const [name, setName] = React.useState("");
  const [number, setNumber] = React.useState("");
  const [active, setActive] = React.useState(false);
  const queryClient = useQueryClient();
  React.useEffect(() => {
    setName(current?.accountName ?? "");
    setNumber(current?.accountNumber ?? "");
    setActive(current?.isActive ?? false);
  }, [current]);
  const save = useMutation({
    mutationFn: () => savePlatformWallet(method, name, number, active),
    onSuccess: () => {
      toast.success(`${method} platform wallet saved.`);
      void queryClient.invalidateQueries({ queryKey: ["platform", "wallets"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <Card>
      <CardHeader>
        <CardTitle>{method} receiving wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Label htmlFor={`${method}-name`}>Account holder name</Label>
        <Input
          id={`${method}-name`}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Label htmlFor={`${method}-number`}>Account number</Label>
        <Input
          id={`${method}-number`}
          value={number}
          onChange={(event) => setNumber(event.target.value)}
        />
        <label className="flex gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />{" "}
          Active for subscription payments
        </label>
        <Button
          disabled={save.isPending || !name.trim() || !number.trim()}
          onClick={() => save.mutate()}
        >
          Save wallet
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlatformApplicationsPage() {
  const [approveTarget, setApproveTarget] = React.useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = React.useState<string | null>(null);
  const applications = useQuery({
    queryKey: ["platform", "subscription-applications"],
    queryFn: listPlatformApplications,
    refetchInterval: 30_000,
  });
  const wallets = useQuery({ queryKey: ["platform", "wallets"], queryFn: listPlatformWallets });
  const queryClient = useQueryClient();
  const review = useMutation({
    mutationFn: ({
      id,
      decision,
      reason,
    }: {
      id: string;
      decision: "APPROVE" | "REJECT";
      reason?: string;
    }) => reviewPlatformApplication(id, decision, reason),
    onSuccess: () => {
      toast.success("Application review saved.");
      setApproveTarget(null);
      setRejectTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["platform"] });
    },
    onError: (error) => toast.error(error.message),
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Subscription applications</h1>
        <p className="text-sm text-muted-foreground">
          Review the business first, then verify actual incoming funds in the platform wallet before
          activating a paid plan.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {(["GCASH", "MAYA"] as const).map((method) => (
          <WalletForm
            key={method}
            method={method}
            current={wallets.data?.find((wallet) => wallet.method === method)}
          />
        ))}
      </div>
      <p className="text-sm text-amber-800">
        Configure only OrderSync-owned receiving accounts here. Never put a customer-facing business
        wallet in this section.
      </p>
      <h2 className="text-lg font-semibold">Registration and upgrade requests</h2>
      {applications.isLoading && <p>Loading applications…</p>}
      {applications.isError && (
        <p className="text-destructive">Applications could not be loaded.</p>
      )}
      {!applications.data?.length && !applications.isLoading && <p>No applications yet.</p>}
      {applications.data?.map((item) => (
        <Card key={item.id}>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.businessName}</p>
                  <Badge variant="secondary">
                    {item.kind === "INITIAL" ? "Registration" : "Upgrade"}
                  </Badge>
                  <Badge>{item.status.replaceAll("_", " ")}</Badge>
                </div>
                <p className="text-sm">
                  {item.owner?.name} ({item.owner?.email})
                </p>
                <p className="text-sm">
                  {item.fromPlan?.name ? `${item.fromPlan.name} → ` : ""}
                  {item.desiredPlan.name} · Amount due{" "}
                  <Money value={item.amountDueMinor / 100} className="font-semibold" />
                </p>
                <p className="text-sm text-muted-foreground">
                  Requested {new Date(item.createdAt).toLocaleString("en-PH")}
                  {item.quoteExpiresAt
                    ? ` · Quote expires ${new Date(item.quoteExpiresAt).toLocaleString("en-PH")}`
                    : ""}
                </p>
                {item.rejectionReason && (
                  <p className="text-sm text-destructive">{item.rejectionReason}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {item.status === "PENDING_REVIEW" && (
                  <>
                    <Button disabled={review.isPending} onClick={() => setApproveTarget(item.id)}>
                      Approve and request payment
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={review.isPending}
                      onClick={() => setRejectTarget(item.id)}
                    >
                      Reject request
                    </Button>
                  </>
                )}
                {item.status === "PAYMENT_SUBMITTED" && (
                  <Button asChild>
                    <Link to="/platform/payments">Open payment verification</Link>
                  </Button>
                )}
              </div>
            </div>
            {item.status === "PENDING_REVIEW" && (
              <p className="rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">
                No payment is requested until this first review is approved. Approval creates the
                bill and unlocks the owner’s receipt upload.
              </p>
            )}
            {!!item.payments.length && (
              <div className="space-y-3 border-t pt-4">
                <h3 className="font-medium">Submitted payment evidence</h3>
                {item.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid gap-4 rounded-lg border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]"
                  >
                    <div className="space-y-2 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{payment.method}</Badge>
                        <Badge>{payment.status}</Badge>
                        {(payment.duplicateReference || payment.duplicateProof) && (
                          <Badge variant="destructive">Duplicate signal</Badge>
                        )}
                      </div>
                      <p>
                        Reference: <span className="font-medium">{payment.referenceNumber}</span>
                      </p>
                      <p>
                        Claimed amount: <Money value={payment.amount} className="font-semibold" />
                      </p>
                      <p>Payer: {payment.payer.name}</p>
                      <p className="text-muted-foreground">
                        Submitted {new Date(payment.submittedAt).toLocaleString("en-PH")}
                      </p>
                      {payment.rejectionReason && (
                        <p className="text-destructive">Rejected: {payment.rejectionReason}</p>
                      )}
                      {payment.status === "SUBMITTED" && (
                        <p className="rounded border border-amber-300 bg-amber-50 p-2 text-amber-900">
                          The proof is supporting evidence only. Confirm the matching incoming
                          transaction in the OrderSync receiving-wallet ledger before verification.
                        </p>
                      )}
                    </div>
                    {payment.proofAvailable ? (
                      <PrivatePaymentProofPreview
                        path={`/platform/payments/${payment.id}/proof`}
                        mimeType={payment.proofMimeType}
                        paymentId={payment.id}
                        autoLoad={payment.status === "SUBMITTED"}
                      />
                    ) : (
                      <p className="rounded border p-3 text-sm text-muted-foreground">
                        The retained proof file is unavailable.
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <ConfirmDialog
        open={approveTarget !== null}
        onOpenChange={(open) => !open && setApproveTarget(null)}
        title="Approve this subscription request?"
        description="Approval confirms the business review and locks the quote. A paid plan will activate only after the owner submits payment and the actual incoming wallet transaction is verified."
        confirmLabel="Approve and request payment"
        busy={review.isPending}
        onConfirm={() => {
          if (approveTarget) review.mutate({ id: approveTarget, decision: "APPROVE" });
        }}
      />
      <TextEntryDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => !open && setRejectTarget(null)}
        title="Reject subscription request?"
        description="Explain why the request cannot be approved. The business owner will see this reason."
        label="Rejection reason"
        placeholder="Enter a clear reason"
        confirmLabel="Reject request"
        destructive
        multiline
        busy={review.isPending}
        onSubmit={(reason) => {
          if (rejectTarget) review.mutate({ id: rejectTarget, decision: "REJECT", reason });
        }}
      />
    </div>
  );
}
