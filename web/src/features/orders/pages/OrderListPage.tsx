import * as React from "react";
import { Link } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Eye, Filter } from "lucide-react";
import type { Order, OrderStatus } from "@/shared/types/orders";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { StatusChip } from "@/shared/components/StatusChip";
import { Money } from "@/shared/components/Money";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useOrders } from "@/shared/hooks/useApi";
import { fmtDateTime } from "@/shared/lib/dates";

const ALL_STATUSES: (OrderStatus | "ALL")[] = [
  "ALL",
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

export function OrderListPage() {
  const ordersQ = useOrders();
  const orders = ordersQ.data ?? [];
  const [status, setStatus] = React.useState<OrderStatus | "ALL">("ALL");

  const filtered = React.useMemo(
    () => (status === "ALL" ? orders : orders.filter((o) => o.status === status)),
    [orders, status],
  );

  const columns: ColumnDef<Order>[] = React.useMemo(
    () => [
      {
        accessorKey: "code",
        header: "Order #",
        cell: ({ row }) => (
          <Link
            to={`/orders/${row.original.id}`}
            className="font-medium text-primary hover:underline"
          >
            {row.original.code}
          </Link>
        ),
      },
      {
        accessorFn: (r) => r.customer.name,
        id: "customer",
        header: "Customer",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.customer.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.customer.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "placedAt",
        header: "Placed",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {fmtDateTime(row.original.placedAt)}
          </span>
        ),
      },
      {
        id: "items",
        header: "Items",
        cell: ({ row }) => <span className="text-sm">{row.original.items.length}</span>,
      },
      {
        accessorKey: "total",
        header: "Total",
        cell: ({ row }) => <Money value={row.original.total} className="font-medium" />,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => <StatusChip status={row.original.status} />,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button asChild size="sm" variant="ghost">
            <Link to={`/orders/${row.original.id}`}>
              <Eye className="mr-1 h-4 w-4" />
              View
            </Link>
          </Button>
        ),
      },
    ],
    [],
  );

  return (
    <>
      <PageHeader title="Orders" description="Pickup orders from customers across all statuses." />
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={ordersQ.isLoading}
        isError={ordersQ.isError}
        onRetry={() => void ordersQ.refetch()}
        loadingLabel="Loading orders…"
        emptyTitle="No orders found"
        emptyDescription="New customer pickup orders will appear here."
        searchKey="customer"
        searchPlaceholder="Search customer name…"
        toolbar={
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={status} onValueChange={(v) => setStatus(v as OrderStatus | "ALL")}>
              <SelectTrigger className="h-9 w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALL_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "ALL" ? "All statuses" : s.replaceAll("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        }
      />
    </>
  );
}
