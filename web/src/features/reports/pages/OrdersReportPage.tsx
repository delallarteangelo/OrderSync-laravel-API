import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import { PageHeader } from "@/shared/components/PageHeader";
import { BucketSelector } from "@/shared/components/BucketSelector";
import { DateRangePicker, type DateRange } from "@/shared/components/DateRangePicker";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { exportRowsCsv } from "@/shared/lib/csv";
import { downloadReportPdf } from "@/shared/lib/pdf";
import { useOrdersReport } from "@/shared/hooks/useApi";
import type { OrdersReportRow, ReportBucket } from "@/shared/types/reports";
import { useAuthStore } from "@/app/stores/authStore";

const STATUS_FIELDS: Array<{ key: keyof OrdersReportRow; label: string; color: string }> = [
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "confirmed", label: "Confirmed", color: "#0ea5e9" },
  { key: "preparing", label: "Preparing", color: "#8b5cf6" },
  { key: "readyForPickup", label: "Ready", color: "#06b6d4" },
  { key: "completed", label: "Completed", color: "#16a34a" },
  { key: "rejected", label: "Rejected", color: "#ef4444" },
  { key: "cancelled", label: "Cancelled", color: "#737373" },
];

export function OrdersReportPage() {
  const businessName = useAuthStore((state) => state.user?.business?.name ?? "OrderSync");
  const [bucket, setBucket] = React.useState<ReportBucket>("day");
  const [dateRange, setDateRange] = React.useState<DateRange>();
  const range = {
    bucket,
    from: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    to: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
  };
  const data = useOrdersReport(range).data ?? [];
  const exportRows = data.map((row) => ({
    Bucket: row.bucket,
    Pending: row.pending,
    Confirmed: row.confirmed,
    Preparing: row.preparing,
    Ready: row.readyForPickup,
    Completed: row.completed,
    Rejected: row.rejected,
    Cancelled: row.cancelled,
    Total: row.total,
  }));

  const exportPdf = () =>
    downloadReportPdf(`orders-${bucket}`, {
      title: "Orders report",
      businessName,
      subtitle: `Bucket: ${bucket}`,
      columns: [
        { key: "Bucket", header: "Bucket" },
        { key: "Pending", header: "Pending", align: "right", format: "number" },
        { key: "Completed", header: "Completed", align: "right", format: "number" },
        { key: "Rejected", header: "Rejected", align: "right", format: "number" },
        { key: "Cancelled", header: "Cancelled", align: "right", format: "number" },
        { key: "Total", header: "Total", align: "right", format: "number" },
      ],
      rows: exportRows,
    });

  return (
    <>
      <PageHeader
        title="Orders report"
        description="Server-calculated order volume by status and business timezone."
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportRowsCsv(`orders-${bucket}.csv`, exportRows)}
            >
              <Download className="mr-1 h-4 w-4" /> CSV
            </Button>
            <Button onClick={exportPdf}>
              <FileText className="mr-1 h-4 w-4" /> PDF
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BucketSelector value={bucket} onChange={setBucket} />
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="bucket" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {STATUS_FIELDS.map((status) => (
                  <Bar
                    key={status.key}
                    name={status.label}
                    dataKey={status.key}
                    stackId="a"
                    fill={status.color}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bucket</TableHead>
                {STATUS_FIELDS.map((status) => (
                  <TableHead key={status.key} className="text-right">
                    {status.label}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.bucket}>
                  <TableCell className="font-medium">{row.bucket}</TableCell>
                  {STATUS_FIELDS.map((status) => (
                    <TableCell key={status.key} className="text-right">
                      {row[status.key]}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{row.total}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
