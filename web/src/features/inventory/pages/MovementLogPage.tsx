import * as React from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Download } from "lucide-react";
import type { InventoryMovement, ReasonCode } from "@/shared/types/inventory";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { useMovements, useProducts } from "@/shared/hooks/useApi";
import { fmtDateTime } from "@/shared/lib/dates";
import { exportRowsCsv } from "@/shared/lib/csv";

const reasonColor: Record<
  ReasonCode,
  "secondary" | "info" | "success" | "destructive" | "warning"
> = {
  POS_SALE: "info",
  ORDER_CONFIRMED: "warning",
  ADJUSTMENT: "secondary",
  RESTOCK: "success",
};

export function MovementLogPage() {
  const movementsQ = useMovements();
  const productsQ = useProducts();
  const movements = movementsQ.data ?? [];
  const products = productsQ.data ?? [];
  const [productId, setProductId] = React.useState<string>("ALL");
  const [reason, setReason] = React.useState<ReasonCode | "ALL">("ALL");

  const filtered = React.useMemo(
    () =>
      movements.filter(
        (m) =>
          (productId === "ALL" || m.productId === productId) &&
          (reason === "ALL" || m.reason === reason),
      ),
    [movements, productId, reason],
  );

  const columns: ColumnDef<InventoryMovement>[] = React.useMemo(
    () => [
      {
        accessorKey: "occurredAt",
        header: "When",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {fmtDateTime(row.original.occurredAt)}
          </span>
        ),
      },
      {
        accessorKey: "productName",
        header: "Product",
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.productName}</span>,
      },
      {
        accessorKey: "reason",
        header: "Reason",
        cell: ({ row }) => (
          <Badge variant={reasonColor[row.original.reason]}>
            {row.original.reason.replaceAll("_", " ")}
          </Badge>
        ),
      },
      {
        accessorKey: "delta",
        header: "Delta",
        cell: ({ row }) => (
          <span
            className={
              row.original.delta < 0 ? "font-medium text-rose-600" : "font-medium text-emerald-600"
            }
          >
            {row.original.delta > 0 ? "+" : ""}
            {row.original.delta}
          </span>
        ),
      },
      {
        accessorKey: "actorName",
        header: "By",
        cell: ({ row }) => <span className="text-sm">{row.original.actorName}</span>,
      },
      {
        accessorKey: "note",
        header: "Note",
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{row.original.note ?? "—"}</span>
        ),
      },
    ],
    [],
  );

  const exportCsv = () => {
    exportRowsCsv(
      "inventory-movements.csv",
      filtered.map((m) => ({
        When: m.occurredAt,
        Product: m.productName,
        Reason: m.reason,
        Delta: m.delta,
        By: m.actorName,
        Note: m.note ?? "",
      })),
    );
  };

  return (
    <>
      <PageHeader
        title="Movement log"
        description="Every stock change with reason, actor, and timestamp."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        isLoading={movementsQ.isLoading || productsQ.isLoading}
        isError={movementsQ.isError || productsQ.isError}
        onRetry={() => void Promise.all([movementsQ.refetch(), productsQ.refetch()])}
        loadingLabel="Loading stock movements…"
        emptyTitle="No stock movements found"
        emptyDescription="Stock adjustments and completed transactions will appear here."
        searchKey="productName"
        searchPlaceholder="Search product…"
        pageSize={15}
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="h-9 w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={reason} onValueChange={(v) => setReason(v as ReasonCode | "ALL")}>
              <SelectTrigger className="h-9 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All reasons</SelectItem>
                <SelectItem value="POS_SALE">POS Sale</SelectItem>
                <SelectItem value="ORDER_CONFIRMED">Order Confirmed</SelectItem>
                <SelectItem value="ADJUSTMENT">Adjustment</SelectItem>
                <SelectItem value="RESTOCK">Restock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </>
  );
}
