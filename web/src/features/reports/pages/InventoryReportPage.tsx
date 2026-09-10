import * as React from "react";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { KpiCard } from "@/shared/components/KpiCard";
import { DateRangePicker, type DateRange } from "@/shared/components/DateRangePicker";
import type { InventoryReportRow } from "@/shared/types/reports";
import { useInventoryReport } from "@/shared/hooks/useApi";
import { exportRowsCsv } from "@/shared/lib/csv";
import { downloadReportPdf } from "@/shared/lib/pdf";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";
import { useAuthStore } from "@/app/stores/authStore";

export function InventoryReportPage() {
  const businessName = useAuthStore((state) => state.user?.business?.name ?? "OrderSync");
  const [dateRange, setDateRange] = React.useState<DateRange>();
  const range = {
    from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };
  const rows: InventoryReportRow[] = useInventoryReport(range).data ?? [];

  const totalUnits = rows.reduce((a, r) => a + r.stockOnHand, 0);
  const low = rows.filter((r) => r.status === "LOW").length;
  const out = rows.filter((r) => r.status === "OUT").length;
  const retailValue = rows.reduce((total, row) => total + row.retailValue, 0);

  const exportCsv = () => exportRowsCsv("inventory-report.csv", rows);
  const exportPdf = () =>
    downloadReportPdf("inventory-report", {
      title: "Inventory report",
      businessName,
      subtitle: "Current stock with movement totals for the selected range",
      columns: [
        { key: "productName", header: "Product" },
        { key: "stockOnHand", header: "On hand", align: "right", format: "number" },
        { key: "unitsSold", header: "Sold", align: "right", format: "number" },
        { key: "unitsRestocked", header: "Restocked", align: "right", format: "number" },
        { key: "retailValue", header: "Retail value", align: "right", format: "currency" },
      ],
      rows,
    });

  return (
    <>
      <PageHeader
        title="Inventory report"
        description="On-hand snapshot per product."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button onClick={exportPdf}>
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />
      <div className="mb-4">
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total units on hand"
          value={totalUnits.toLocaleString()}
          icon={<Boxes className="h-4 w-4" />}
        />
        <KpiCard label="Low stock SKUs" value={low} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Out of stock SKUs" value={out} icon={<PackageX className="h-4 w-4" />} />
        <KpiCard
          label="Retail stock value"
          value={`₱${retailValue.toLocaleString("en-PH")}`}
          icon={<Boxes className="h-4 w-4" />}
        />
      </div>
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">On hand</TableHead>
                <TableHead className="text-right">Threshold</TableHead>
                <TableHead className="text-right">Sold</TableHead>
                <TableHead className="text-right">Restocked</TableHead>
                <TableHead className="text-right">Retail value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.productId}>
                  <TableCell className="font-medium">{r.productName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.category}</TableCell>
                  <TableCell className="text-right">{r.stockOnHand}</TableCell>
                  <TableCell className="text-right">{r.threshold}</TableCell>
                  <TableCell className="text-right">{r.unitsSold}</TableCell>
                  <TableCell className="text-right">{r.unitsRestocked}</TableCell>
                  <TableCell className="text-right">
                    ₱{r.retailValue.toLocaleString("en-PH")}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        r.status === "OUT"
                          ? "destructive"
                          : r.status === "LOW"
                            ? "warning"
                            : "success"
                      }
                    >
                      {r.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
