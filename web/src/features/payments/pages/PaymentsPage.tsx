import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Download, Save } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import {
  listBusinessPaymentInstructions,
  listBusinessPayments,
  listPlatformPayments,
  openPrivatePaymentFile,
  reviewPayment,
  savePaymentInstruction,
} from "@/shared/api/payments";
import { isApiError } from "@/shared/api/errors";
import type { PaymentInstruction, RecordedPayment, WalletMethod } from "@/shared/types/payments";
import { Money } from "@/shared/components/Money";
import { PageHeader } from "@/shared/components/PageHeader";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { fmtDateTime } from "@/shared/lib/dates";
import { EmptyState } from "@/shared/components/EmptyState";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";

export function PaymentsPage() {
  const user = useAuthStore((state) => state.user)!;
  const platform = user.role === "SUPER_ADMIN";
  const businessId = user.business?.id ?? "platform";
  const queryClient = useQueryClient();
  const payments = useQuery({
    queryKey: [platform ? "platform" : "tenant", businessId, "recorded-payments"],
    queryFn: platform ? listPlatformPayments : listBusinessPayments,
  });
  const review = useMutation({
    mutationFn: ({
      payment,
      decision,
    }: {
      payment: RecordedPayment;
      decision: "VERIFIED" | "REJECTED";
    }) => {
      const reason =
        decision === "REJECTED" ? window.prompt("Reason for rejection:")?.trim() : undefined;
      if (decision === "REJECTED" && !reason) throw new Error("A rejection reason is required.");
      return reviewPayment(payment.id, decision, platform, reason);
    },
    onSuccess: () => {
      toast.success("Payment review saved.");
      queryClient.invalidateQueries({ queryKey: [platform ? "platform" : "tenant", businessId] });
    },
    onError: (error) => toast.error(isApiError(error) ? error.message : error.message),
  });

  return (
    <>
      <PageHeader
        title={platform ? "Subscription payment review" : "Customer payment review"}
        description="Proofs are reviewed manually. OrderSync does not contact GCash or Maya."
      />
      {!platform && user.role === "BUSINESS_OWNER" && <InstructionManager />}
      <div className="mt-6 space-y-3">
        {payments.isLoading && <LoadingState label="Loading payments…" />}
        {payments.isError && (
          <ErrorState
            title="Payments are unavailable"
            message="The payment records could not be loaded."
            onRetry={() => void payments.refetch()}
          />
        )}
        {(payments.data ?? []).length === 0 && !payments.isLoading && !payments.isError && (
          <EmptyState
            title="No recorded payments"
            description="Submitted customer or subscription payment proofs will appear here."
          />
        )}
        {!payments.isError &&
          (payments.data ?? []).map((payment) => (
            <PaymentReviewCard
              key={payment.id}
              payment={payment}
              platform={platform}
              busy={review.isPending}
              onReview={(decision) => review.mutate({ payment, decision })}
            />
          ))}
      </div>
    </>
  );
}

function PaymentReviewCard({
  payment,
  platform,
  busy,
  onReview,
}: {
  payment: RecordedPayment;
  platform: boolean;
  busy: boolean;
  onReview: (decision: "VERIFIED" | "REJECTED") => void;
}) {
  const duplicate = payment.duplicateProof || payment.duplicateReference;
  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-4 p-4">
        <div className="min-w-56 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{payment.orderCode ?? `Bill ${payment.billingRecordId}`}</p>
            <Badge variant="secondary">{payment.method}</Badge>
            <Badge>{payment.status}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {payment.business.name} · {payment.payer.name} · {fmtDateTime(payment.submittedAt)}
          </p>
          <p className="text-sm">Reference: {payment.referenceNumber}</p>
          {duplicate && (
            <p className="mt-1 flex items-center gap-1 text-sm text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              Review duplicate {payment.duplicateReference && "reference"}
              {payment.duplicateReference && payment.duplicateProof && " and "}
              {payment.duplicateProof && "proof"} signal
            </p>
          )}
          {payment.rejectionReason && (
            <p className="text-sm text-destructive">{payment.rejectionReason}</p>
          )}
          {payment.receiptNumber && <p className="text-sm">Receipt: {payment.receiptNumber}</p>}
        </div>
        <Money value={payment.amount} className="font-semibold" />
        {payment.proofAvailable && (
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              openPrivatePaymentFile(
                `${platform ? "/platform" : ""}/payments/${payment.id}/proof`,
                `payment-proof-${payment.id}`,
              )
            }
          >
            <Download className="mr-1 h-4 w-4" /> Proof
          </Button>
        )}
        {payment.status === "SUBMITTED" && (
          <div className="flex gap-2">
            <Button size="sm" disabled={busy} onClick={() => onReview("VERIFIED")}>
              Verify manually
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={busy}
              onClick={() => onReview("REJECTED")}
            >
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function InstructionManager() {
  const businessId = useAuthStore((state) => state.user?.business?.id ?? "no-business");
  const queryClient = useQueryClient();
  const instructions = useQuery({
    queryKey: ["tenant", businessId, "payment-instructions"],
    queryFn: listBusinessPaymentInstructions,
  });

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {(["GCASH", "MAYA"] as const).map((method) => (
        <InstructionForm
          key={method}
          method={method}
          current={instructions.data?.find((item) => item.method === method)}
          onSaved={() =>
            queryClient.invalidateQueries({
              queryKey: ["tenant", businessId, "payment-instructions"],
            })
          }
        />
      ))}
    </div>
  );
}

function InstructionForm({
  method,
  current,
  onSaved,
}: {
  method: WalletMethod;
  current?: PaymentInstruction;
  onSaved: () => void;
}) {
  const [accountName, setAccountName] = React.useState("");
  const [accountNumber, setAccountNumber] = React.useState("");
  const [instructions, setInstructions] = React.useState("");
  const [active, setActive] = React.useState(true);
  const [qr, setQr] = React.useState<File>();
  React.useEffect(() => {
    if (!current) return;
    setAccountName(current.accountName);
    setAccountNumber(current.accountNumber);
    setInstructions(current.instructions ?? "");
    setActive(current.active);
  }, [current]);
  const save = useMutation({
    mutationFn: () =>
      savePaymentInstruction(method, { accountName, accountNumber, instructions, active }, qr),
    onSuccess: () => {
      toast.success(`${method} instructions saved.`);
      onSaved();
    },
    onError: (error) =>
      toast.error(isApiError(error) ? error.message : "Unable to save instructions."),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{method} instructions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="Account name">
          <Input value={accountName} onChange={(event) => setAccountName(event.target.value)} />
        </Field>
        <Field label="Account number">
          <Input value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} />
        </Field>
        <Field label="Customer instructions">
          <Textarea
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </Field>
        <Field label="QR image (private)">
          <Input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => setQr(event.target.files?.[0])}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={active}
            onChange={(event) => setActive(event.target.checked)}
          />{" "}
          Active
        </label>
        <Button
          disabled={save.isPending || !accountName.trim() || !accountNumber.trim()}
          onClick={() => save.mutate()}
        >
          <Save className="mr-1 h-4 w-4" /> Save
        </Button>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
