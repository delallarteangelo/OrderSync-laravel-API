import * as React from "react";
import { Download } from "lucide-react";
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
import type { InventoryReportRow } from "@/shared/types/reports";
import { useInventoryReport } from "@/shared/hooks/useApi";
import { exportRowsCsv } from "@/shared/lib/csv";
import { AlertTriangle, Boxes, PackageX } from "lucide-react";

export function InventoryReportPage() {
  const rows: InventoryReportRow[] = useInventoryReport().data ?? [];

  const totalUnits = rows.reduce((a, r) => a + r.stockOnHand, 0);
  const low = rows.filter((r) => r.status === "LOW").length;
  const out = rows.filter((r) => r.status === "OUT").length;

  const exportCsv = () => exportRowsCsv("inventory-report.csv", rows);

  return (
    <>
      <PageHeader
        title="Inventory report"
        description="On-hand snapshot per product."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard label="Total units on hand" value={totalUnits.toLocaleString()} icon={<Boxes className="h-4 w-4" />} />
        <KpiCard label="Low stock SKUs" value={low} icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="Out of stock SKUs" value={out} icon={<PackageX className="h-4 w-4" />} />
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
