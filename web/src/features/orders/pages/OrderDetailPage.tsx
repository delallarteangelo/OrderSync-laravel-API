import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import type { OrderStatus } from "@/shared/types/orders";
import { PageHeader } from "@/shared/components/PageHeader";
import { StatusChip } from "@/shared/components/StatusChip";
import { Money } from "@/shared/components/Money";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
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

const statusActionLabel: Record<OrderStatus, string> = {
  PENDING: "Mark Pending",
  CONFIRMED: "Confirm",
  REJECTED: "Reject",
  PREPARING: "Start Preparing",
  READY_FOR_PICKUP: "Mark Ready",
  COMPLETED: "Complete",
  CANCELLED: "Cancel",
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const orderQ = useOrder(id);
  const order = orderQ.data;
  const transitionM = useTransitionOrder();
  const user = useAuthStore((s) => s.user)!;

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

  const handleTransition = (next: OrderStatus) => {
    const note =
      next === "REJECTED" ? window.prompt("Reason for rejecting this order:")?.trim() : undefined;
    if (next === "REJECTED" && !note) return;
    transitionM.mutate(
      { id: order.id, next, note },
      {
        onSuccess: () => toast.success(`Order ${order.code} → ${next.replaceAll("_", " ")}`),
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
            <StatusChip status={order.status} />
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
    </>
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
