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
import { Download } from "lucide-react";
import { format, subDays } from "date-fns";
import { PageHeader } from "@/shared/components/PageHeader";
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
import { useOrders } from "@/shared/hooks/useApi";
import type { OrderStatus } from "@/shared/types/orders";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
];

const COLORS: Record<OrderStatus, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#0ea5e9",
  PREPARING: "#8b5cf6",
  READY_FOR_PICKUP: "#06b6d4",
  COMPLETED: "#16a34a",
  REJECTED: "#ef4444",
  CANCELLED: "#737373",
};

export function OrdersReportPage() {
  const orders = useOrders().data ?? [];

  const data = React.useMemo(() => {
    return Array.from({ length: 14 }).map((_, i) => {
      const d = subDays(new Date(), 13 - i);
      const dayStr = format(d, "yyyy-MM-dd");
      const dayOrders = orders.filter((o) => o.placedAt.startsWith(dayStr));
      const row: Record<string, number | string> = { label: format(d, "MMM d") };
      let total = 0;
      STATUSES.forEach((s) => {
        const n = dayOrders.filter((o) => o.status === s).length;
        row[s] = n;
        total += n;
      });
      row.total = total;
      return row;
    });
  }, [orders]);

  const exportCsv = () => exportRowsCsv("orders-report.csv", data);

  return (
    <>
      <PageHeader
        title="Orders report"
        description="Order volume by status, last 14 days."
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-1 h-4 w-4" />
            Export CSV
          </Button>
        }
      />
      <Card>
        <CardContent className="p-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                {STATUSES.map((s) => (
                  <Bar key={s} dataKey={s} stackId="a" fill={COLORS[s]} />
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
                <TableHead>Day</TableHead>
                {STATUSES.map((s) => (
                  <TableHead key={s} className="text-right">
                    {s.replaceAll("_", " ")}
                  </TableHead>
                ))}
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((r) => (
                <TableRow key={r.label as string}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  {STATUSES.map((s) => (
                    <TableCell key={s} className="text-right">
                      {r[s] as number}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-medium">{r.total as number}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
