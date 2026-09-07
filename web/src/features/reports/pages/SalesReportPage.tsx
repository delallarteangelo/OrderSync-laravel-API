import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, FileText } from "lucide-react";
import { format } from "date-fns";
import type { ReportBucket } from "@/shared/types/reports";
import { PageHeader } from "@/shared/components/PageHeader";
import { BucketSelector } from "@/shared/components/BucketSelector";
import { DateRangePicker } from "@/shared/components/DateRangePicker";
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
import { Money } from "@/shared/components/Money";
import { useSalesReport } from "@/shared/hooks/useApi";
import { exportRowsCsv } from "@/shared/lib/csv";
import { downloadReportPdf } from "@/shared/lib/pdf";

export function SalesReportPage() {
  const [bucket, setBucket] = React.useState<ReportBucket>("day");
  const data = useSalesReport({ bucket }).data ?? [];

  const totalGross = data.reduce((a, r) => a + r.grossTotal, 0);
  const totalDiscount = data.reduce((a, r) => a + r.discountTotal, 0);
  const totalNet = data.reduce((a, r) => a + r.netTotal, 0);
  const totalSales = data.reduce((a, r) => a + r.salesCount, 0);

  const chartData = data.map((r) => ({
    label:
      bucket === "day"
        ? format(new Date(r.bucket), "MMM d")
        : bucket === "week"
        ? r.bucket
        : format(new Date(r.bucket + "-01"), "MMM yyyy"),
    Net: r.netTotal,
  }));

  const exportCsv = () =>
    exportRowsCsv(
      `sales-${bucket}.csv`,
      data.map((r) => ({
        Bucket: r.bucket,
        Sales: r.salesCount,
        Gross: r.grossTotal,
        Discount: r.discountTotal,
        Net: r.netTotal,
      })),
    );

  const exportPdf = () =>
    downloadReportPdf(`sales-${bucket}`, {
      title: "Sales report",
      subtitle: `Bucket: ${bucket}`,
      columns: [
        { key: "bucket", header: "Bucket" },
        { key: "salesCount", header: "Sales", align: "right", format: "number" },
        { key: "grossTotal", header: "Gross", align: "right", format: "currency" },
        { key: "discountTotal", header: "Discount", align: "right", format: "currency" },
        { key: "netTotal", header: "Net", align: "right", format: "currency" },
      ],
      rows: data,
      totals: [
        { label: "Total sales", value: String(totalSales) },
        { label: "Net total", value: `₱${totalNet.toLocaleString("en-PH")}` },
      ],
    });

  return (
    <>
      <PageHeader
        title="Sales report"
        description="Revenue grouped by day, week, or month."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportCsv}>
              <Download className="mr-1 h-4 w-4" />
              CSV
            </Button>
            <Button onClick={exportPdf}>
              <FileText className="mr-1 h-4 w-4" />
              PDF
            </Button>
          </div>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <BucketSelector value={bucket} onChange={setBucket} />
        <DateRangePicker onChange={() => {}} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <Kpi label="Sales" value={totalSales.toLocaleString()} />
        <Kpi label="Gross" value={<Money value={totalGross} />} />
        <Kpi label="Discount" value={<Money value={totalDiscount} />} />
        <Kpi label="Net" value={<Money value={totalNet} />} highlight />
      </div>
      <Card className="mt-4">
        <CardContent className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="Net" fill="hsl(142 71% 35%)" radius={[6, 6, 0, 0]} />
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
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Discount</TableHead>
                <TableHead className="text-right">Net</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.bucket}>
                  <TableCell className="font-medium">{r.bucket}</TableCell>
                  <TableCell className="text-right">{r.salesCount}</TableCell>
                  <TableCell className="text-right"><Money value={r.grossTotal} /></TableCell>
                  <TableCell className="text-right"><Money value={r.discountTotal} /></TableCell>
                  <TableCell className="text-right font-medium"><Money value={r.netTotal} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}

function Kpi({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={`mt-1 text-2xl font-semibold ${
            highlight ? "text-primary" : ""
          }`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
