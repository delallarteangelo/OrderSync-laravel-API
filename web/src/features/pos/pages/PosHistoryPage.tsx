import * as React from "react";
import { Link } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { ArrowLeft, Eye } from "lucide-react";
import type { PosSale } from "@/shared/types/pos";
import { useSales } from "@/shared/hooks/useApi";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { Money } from "@/shared/components/Money";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { fmtDateTime } from "@/shared/lib/dates";
import { ReceiptView } from "../components/ReceiptView";

export function PosHistoryPage() {
  const sales = useSales().data ?? [];
  const [selected, setSelected] = React.useState<PosSale | null>(null);
  const columns: ColumnDef<PosSale>[] = React.useMemo(
    () => [
      {
        accessorKey: "receiptNumber",
        header: "Receipt",
        cell: ({ row }) => <span className="font-medium">{row.original.receiptNumber}</span>,
      },
      { accessorKey: "cashierName", header: "Cashier" },
      {
        accessorKey: "paymentMethod",
        header: "Payment",
        cell: ({ row }) => <Badge variant="secondary">{row.original.paymentMethod}</Badge>,
      },
      {
        accessorKey: "grandTotal",
        header: "Total",
        cell: ({ row }) => <Money value={row.original.grandTotal} className="font-medium" />,
      },
      {
        accessorKey: "completedAt",
        header: "Completed",
        cell: ({ row }) => fmtDateTime(row.original.completedAt),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button size="sm" variant="ghost" onClick={() => setSelected(row.original)}>
            <Eye className="mr-1 h-4 w-4" />
            Receipt
          </Button>
        ),
      },
    ],
    [],
  );

  if (selected) return <ReceiptView sale={selected} onClose={() => setSelected(null)} />;

  return (
    <>
      <PageHeader
        breadcrumbs={
          <Button asChild variant="ghost" size="sm" className="-ml-3 h-7 px-2">
            <Link to="/pos">
              <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              Point of sale
            </Link>
          </Button>
        }
        title="Sales history"
        description="Completed tenant sales and printable receipts."
      />
      <DataTable
        columns={columns}
        data={sales}
        searchKey="receiptNumber"
        searchPlaceholder="Search receipt number…"
      />
    </>
  );
}
