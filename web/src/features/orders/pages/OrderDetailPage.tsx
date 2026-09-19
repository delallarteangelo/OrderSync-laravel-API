import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Mail, RefreshCw, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { collectOrderCounterPayment, recordOrderRefund } from "@/shared/api/orders";
import type { OrderStatus } from "@/shared/types/orders";
import type { RecordedPayment } from "@/shared/types/payments";
import { getBusinessPaymentProof, openPrivatePaymentFile } from "@/shared/api/payments";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusChip } from "@/shared/components/StatusChip";
import { Money } from "@/shared/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useOrder, useTransitionOrder } from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { useAuthStore } from "@/app/stores/authStore";
import { allowedTransitions } from "@/shared/lib/roleGuards";
import { fmtDateTime } from "@/shared/lib/dates";
import { ErrorState } from "@/shared/components/ErrorState";
import { LoadingState } from "@/shared/components/LoadingState";
import { TextEntryDialog } from "@/shared/components/TextEntryDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

const statusActionLabel: Record<OrderStatus, string> = {
  PENDING: "Mark Pending",
  CONFIRMED: "Confirm",
  REJECTED: "Reject",
  PREPARING: "Start Preparing",
  READY_FOR_PICKUP: "Mark Ready",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
  REFUND_PENDING: "Refund pending",
  REFUNDED: "Refunded",
};

export function OrderDetailPage() {
  const [cashDialogOpen, setCashDialogOpen] = React.useState(false);
  const [refundDialogOpen, setRefundDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const { id } = useParams<{ id: string }>();
  const orderQ = useOrder(id);
  const order = orderQ.data;
  const transitionM = useTransitionOrder();
  const user = useAuthStore((s) => s.user)!;
  const counter = useMutation({
    mutationFn: ({ amountMinor, reference }: { amountMinor: number; reference: string }) =>
      collectOrderCounterPayment(id!, amountMinor, reference),
    onSuccess: () => {
      setCashDialogOpen(false);
      toast.success("Pickup cash recorded.");
      void orderQ.refetch();
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : "Could not record cash payment"),
  });
  const refund = useMutation({
    mutationFn: ({
      amountMinor,
      method,
      reference,
    }: {
      amountMinor: number;
      method: "GCASH" | "MAYA" | "CASH";
      reference: string;
    }) => recordOrderRefund(id!, method, amountMinor, reference),
    onSuccess: () => {
      setRefundDialogOpen(false);
      toast.success("Manual refund recorded.");
      void orderQ.refetch();
    },
    onError: (e) => toast.error(isApiError(e) ? e.message : "Could not record refund"),
  });

  if (orderQ.isLoading) {
    return <LoadingState label="Loading order…" className="mx-auto max-w-3xl" />;
  }

  if (!order) {
    return (
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/orders">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to orders
          </Link>
        </Button>
        <ErrorState
          title="Order not found"
          message="The order may not exist or may belong to another business."
          onRetry={() => void orderQ.refetch()}
        />
      </div>
    );
  }

  const transitions = allowedTransitions(user.role, order.status);

  const handleTransition = (next: OrderStatus, note?: string) => {
    if (next === "REJECTED" && !note) {
      setRejectDialogOpen(true);
      return;
    }
    transitionM.mutate(
      { id: order.id, next, note },
      {
        onSuccess: () => {
          setRejectDialogOpen(false);
          toast.success(`Order ${order.code} → ${next.replaceAll("_", " ")}`);
        },
        onError: (e) => toast.error(isApiError(e) ? e.message : "Failed to update status"),
      },
    );
  };

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Button asChild variant="ghost" size="sm" className="-ml-3 h-7 px-2">
            <Link to="/orders">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              All orders
            </Link>
          </Button>
        }
        title={order.code}
        description={`Placed ${fmtDateTime(order.placedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void orderQ.refetch()}>
              <RefreshCw className="mr-1 h-4 w-4" /> Refresh
            </Button>
            <StatusChip status={order.status} />
            {order.status === "READY_FOR_PICKUP" &&
              order.balanceDue > 0 &&
              order.balanceCollectionMethod === "CASH_AT_PICKUP" && (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={counter.isPending}
                  onClick={() => setCashDialogOpen(true)}
                >
                  Record pickup cash
                </Button>
              )}
            {order.status === "REFUND_PENDING" && user.role === "BUSINESS_OWNER" && (
              <Button
                size="sm"
                variant="destructive"
                disabled={refund.isPending}
                onClick={() => setRefundDialogOpen(true)}
              >
                Record completed refund
              </Button>
            )}
            {transitions.length === 0 ? (
              <span className="text-xs text-muted-foreground">No actions available</span>
            ) : (
              transitions.map((next) => (
                <Button
                  key={next}
                  variant={next === "REJECTED" || next === "CANCELLED" ? "destructive" : "default"}
                  size="sm"
                  onClick={() => handleTransition(next)}
                >
                  {statusActionLabel[next]}
                </Button>
              ))
            )}
          </div>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((it, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{it.productName}</TableCell>
                      <TableCell className="text-right">{it.quantity}</TableCell>
                      <TableCell className="text-right">
                        <Money value={it.unitPrice} />
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <Money value={it.lineTotal} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Separator className="my-4" />
              <div className="flex justify-end">
                <div className="w-72 space-y-1.5 text-sm">
                  <Row label="Subtotal" value={<Money value={order.subtotal} />} />
                  <Row label="Discount" value={<Money value={0} />} />
                  <Row
                    label="Verified wallet receipts"
                    value={<Money value={order.walletPaid} />}
                  />
                  <Row label="Pickup cash collected" value={<Money value={order.counterPaid} />} />
                  <Row label="Balance due" value={<Money value={order.balanceDue} />} />
                  <Separator />
                  <Row
                    label={<span className="text-base font-semibold">Total</span>}
                    value={
                      <span className="text-base font-semibold">
                        <Money value={order.total} />
                      </span>
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{order.customer.name}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{order.customer.email}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Payment and pickup balance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md bg-muted p-3 text-sm">
                <p>
                  Financial status: {order.financialStatus.replaceAll("_", " ")} · Balance choice:{" "}
                  {order.balanceCollectionMethod === "WALLET_TOPUP"
                    ? "Wallet top-up"
                    : "Cash at pickup"}
                </p>
                <p className="font-medium">
                  Received <Money value={order.amountReceived} /> of <Money value={order.total} /> ·
                  Still due <Money value={order.balanceDue} />
                </p>
              </div>
              {order.status === "REFUND_PENDING" && (
                <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                  Do not close this order until the received money has actually been refunded.
                  OrderSync records the outgoing refund; it does not transfer funds.
                </p>
              )}
              {order.refunds.map((item) => (
                <p key={item.referenceNumber} className="text-sm">
                  Refunded <Money value={item.amount} /> via {item.method} · {item.referenceNumber}
                </p>
              ))}
              {order.counterPayments.map((cash) => (
                <p key={cash.id} className="text-sm">
                  Counter cash <Money value={cash.amount} /> · {cash.referenceNumber} ·{" "}
                  {fmtDateTime(cash.receivedAt)}
                </p>
              ))}
              {order.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {order.balanceCollectionMethod === "WALLET_TOPUP"
                    ? "No payment proof submitted yet. The customer chose wallet top-up."
                    : "No payment proof submitted. The customer may pay at pickup."}
                </p>
              ) : (
                order.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="space-y-2 border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{payment.method}</span>
                      <Badge variant="secondary">{payment.status}</Badge>
                    </div>
                    <p className="text-sm">Reference: {payment.referenceNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      Claimed <Money value={payment.amount} /> · Submitted{" "}
                      {fmtDateTime(payment.submittedAt)}
                    </p>
                    {payment.verifiedAmount != null && (
                      <p className="text-sm font-medium">
                        Actually received <Money value={payment.verifiedAmount} />
                      </p>
                    )}
                    {payment.rejectionReason && (
                      <p className="text-sm text-destructive">
                        Rejected: {payment.rejectionReason}
                      </p>
                    )}
                    {payment.proofAvailable && user.role !== "CASHIER" && (
                      <PaymentProofPreview payment={payment} businessId={order.business.id} />
                    )}
                    {payment.proofAvailable && user.role === "CASHIER" && (
                      <p className="text-xs text-muted-foreground">
                        The private proof can be opened by an owner or staff member.
                      </p>
                    )}
                  </div>
                ))
              )}
              {order.payments.some((payment) => payment.status === "SUBMITTED") &&
                user.role !== "CASHIER" && (
                  <Button asChild variant="outline" size="sm">
                    <Link to="/payments">Review payment</Link>
                  </Button>
                )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Status timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-4 border-l pl-4">
                {order.statusHistory.map((ev, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[21px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary">
                      <ChevronRight className="h-2 w-2 text-primary-foreground" />
                    </span>
                    <div>
                      <p className="text-sm font-medium">{ev.status.replaceAll("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {fmtDateTime(ev.at)} · {ev.actorName}
                      </p>
                      {ev.note && (
                        <p className="mt-1 text-xs italic text-muted-foreground">{ev.note}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
      <CounterPaymentDialog
        open={cashDialogOpen}
        onOpenChange={setCashDialogOpen}
        balanceDue={order.balanceDue}
        busy={counter.isPending}
        onSubmit={(amountMinor, reference) => counter.mutate({ amountMinor, reference })}
      />
      <RefundDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        outstanding={order.amountReceived - order.refundedAmount}
        busy={refund.isPending}
        onSubmit={(amountMinor, method, reference) =>
          refund.mutate({ amountMinor, method, reference })
        }
      />
      <TextEntryDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        title={`Reject order ${order.code}?`}
        description="The customer will see this reason. If verified money has already been received, the order will move to refund pending instead of closing."
        label="Rejection reason"
        placeholder="Explain why the order cannot be fulfilled"
        confirmLabel="Reject order"
        destructive
        multiline
        busy={transitionM.isPending}
        onSubmit={(reason) => handleTransition("REJECTED", reason)}
      />
    </>
  );
}

function CounterPaymentDialog({
  open,
  onOpenChange,
  balanceDue,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  balanceDue: number;
  busy: boolean;
  onSubmit: (amountMinor: number, reference: string) => void;
}) {
  const [amount, setAmount] = React.useState(balanceDue.toFixed(2));
  const [reference, setReference] = React.useState("");
  const amountMinor = Math.round(Number(amount) * 100);
  const validAmount =
    Number.isFinite(amountMinor) && amountMinor >= 1 && amountMinor <= Math.round(balanceDue * 100);
  React.useEffect(() => {
    if (open) {
      setAmount(balanceDue.toFixed(2));
      setReference("");
    }
  }, [balanceDue, open]);
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (validAmount && reference.trim()) onSubmit(amountMinor, reference.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Record pickup cash</DialogTitle>
            <DialogDescription>
              Record only cash you actually received at the counter. The remaining order balance is
              ₱{balanceDue.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="counter-amount">Cash received (₱)</Label>
            <Input
              id="counter-amount"
              autoFocus
              type="number"
              min="0.01"
              max={balanceDue.toFixed(2)}
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            {!validAmount && (
              <p className="text-xs text-destructive">
                Enter an amount no greater than the remaining balance.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="counter-reference">Counter receipt or reference</Label>
            <Input
              id="counter-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Enter the receipt or transaction reference"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy || !validAmount || !reference.trim()}>
              {busy ? "Saving…" : "Record cash"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RefundDialog({
  open,
  onOpenChange,
  outstanding,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outstanding: number;
  busy: boolean;
  onSubmit: (amountMinor: number, method: "GCASH" | "MAYA" | "CASH", reference: string) => void;
}) {
  const [amount, setAmount] = React.useState(outstanding.toFixed(2));
  const [method, setMethod] = React.useState<"GCASH" | "MAYA" | "CASH">("GCASH");
  const [reference, setReference] = React.useState("");
  const [attested, setAttested] = React.useState(false);
  const amountMinor = Math.round(Number(amount) * 100);
  const validAmount =
    Number.isFinite(amountMinor) &&
    amountMinor >= 1 &&
    amountMinor <= Math.round(outstanding * 100);
  React.useEffect(() => {
    if (open) {
      setAmount(outstanding.toFixed(2));
      setMethod("GCASH");
      setReference("");
      setAttested(false);
    }
  }, [open, outstanding]);
  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (validAmount && reference.trim() && attested)
              onSubmit(amountMinor, method, reference.trim());
          }}
        >
          <DialogHeader>
            <DialogTitle>Record a completed refund</DialogTitle>
            <DialogDescription>
              This records money you already returned to the customer. OrderSync does not send the
              refund. The amount still owed is ₱{outstanding.toFixed(2)}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Amount refunded (₱)</Label>
              <Input
                id="refund-amount"
                autoFocus
                type="number"
                min="0.01"
                max={outstanding.toFixed(2)}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
              />
              {!validAmount && (
                <p className="text-xs text-destructive">
                  Enter an amount within the refund still owed.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-method">Refund method</Label>
              <select
                id="refund-method"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={method}
                onChange={(event) => setMethod(event.target.value as "GCASH" | "MAYA" | "CASH")}
              >
                <option value="GCASH">GCash</option>
                <option value="MAYA">Maya</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="refund-reference">Outgoing transaction or receipt reference</Label>
            <Input
              id="refund-reference"
              value={reference}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Enter the actual refund reference"
            />
          </div>
          <label className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950">
            <input
              className="mt-1"
              type="checkbox"
              checked={attested}
              onChange={(event) => setAttested(event.target.checked)}
            />
            I confirm this money has already been returned to the customer through {method}. This
            entry does not initiate a transfer.
          </label>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={busy || !validAmount || !reference.trim() || !attested}
            >
              {busy ? "Saving…" : "Record completed refund"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentProofPreview({
  payment,
  businessId,
}: {
  payment: RecordedPayment;
  businessId: string;
}) {
  const image = payment.proofMimeType.startsWith("image/");
  const key = `${businessId}:${payment.id}`;
  const [preview, setPreview] = React.useState<{ key: string; url: string } | null>(null);
  const [failedKey, setFailedKey] = React.useState<string | null>(null);
  const extension =
    payment.proofMimeType === "application/pdf"
      ? "pdf"
      : payment.proofMimeType === "image/png"
        ? "png"
        : payment.proofMimeType === "image/webp"
          ? "webp"
          : "jpg";

  React.useEffect(() => {
    if (!image) return;
    let cancelled = false;
    let url: string | undefined;
    getBusinessPaymentProof(payment.id)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setPreview({ key, url });
      })
      .catch(() => {
        if (!cancelled) setFailedKey(key);
      });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [businessId, image, key, payment.id]);

  return (
    <div className="space-y-2">
      {preview?.key === key && (
        <a
          href={preview.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open payment proof"
        >
          <img
            src={preview.url}
            alt="Customer payment proof"
            className="max-h-72 w-full rounded-md border bg-muted object-contain"
          />
        </a>
      )}
      {image && preview?.key !== key && failedKey !== key && (
        <p className="text-xs text-muted-foreground">Loading private proof…</p>
      )}
      {failedKey === key && (
        <p className="text-xs text-destructive">Preview unavailable. You can download the proof.</p>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() =>
          void openPrivatePaymentFile(
            `/payments/${payment.id}/proof`,
            `payment-proof-${payment.id}.${extension}`,
          ).catch(() => toast.error("The private proof could not be downloaded."))
        }
      >
        Download proof
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
