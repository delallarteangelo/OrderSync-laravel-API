import { Link } from "react-router-dom";
import {
  Banknote,
  Boxes,
  ScanBarcode,
  ShoppingBag,
  TrendingDown,
  PackageX,
  ArrowRight,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format, parseISO } from "date-fns";

import { PageHeader } from "@/shared/components/PageHeader";
import { KpiCard } from "@/shared/components/KpiCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { StatusChip } from "@/shared/components/StatusChip";
import { Money } from "@/shared/components/Money";
import { Skeleton } from "@/shared/components/ui/skeleton";

import { useRole } from "@/shared/hooks/useRole";
import { useDashboard } from "@/shared/hooks/useApi";
import type { DashboardSnapshot } from "@/shared/api/reports";
import { formatPHP } from "@/shared/lib/money";
import { fmtDateTime } from "@/shared/lib/dates";

export function DashboardPage() {
  const { isAdmin } = useRole();
  const { data, isLoading, isError, refetch } = useDashboard();
  return (
    <>
      <PageHeader
        title={isAdmin ? "Dashboard" : "Today"}
        description={
          isAdmin
            ? "Overview of sales, orders, inventory and activity."
            : "Quick view of your day at the counter."
        }
        actions={
          <Button asChild>
            <Link to="/pos">
              <ScanBarcode className="mr-2 h-4 w-4" />
              Open POS
            </Link>
          </Button>
        }
      />
      {isError ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm">
          Couldn’t load dashboard.{" "}
          <button className="underline" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      ) : isAdmin ? (
        <AdminDashboard loading={isLoading} snap={data} />
      ) : (
        <CashierDashboard loading={isLoading} snap={data} />
      )}
    </>
  );
}

function AdminDashboard({ loading, snap }: { loading: boolean; snap?: DashboardSnapshot }) {
  const todayTotal = snap?.today.total ?? 0;
  const todayCount = snap?.today.count ?? 0;
  const itemsSoldToday = snap?.today.itemsSold ?? 0;
  const openOrdersCount = snap?.openOrdersCount ?? 0;
  const lowStock = snap?.lowStock ?? [];
  const sevenDaySales = snap?.sevenDaySales ?? [];
  const recentOrders = snap?.recentOrders ?? [];
  const recentMovements = snap?.recentMovements ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              label="Sales today"
              value={<Money value={todayTotal} />}
              hint={`${todayCount} transaction${todayCount === 1 ? "" : "s"}`}
              icon={<Banknote className="h-5 w-5" />}
            />
            <KpiCard
              label="Open orders"
              value={openOrdersCount}
              hint="Pending → Ready"
              icon={<ShoppingBag className="h-5 w-5" />}
            />
            <KpiCard
              label="Items sold today"
              value={itemsSoldToday}
              hint="Across all sales"
              icon={<Boxes className="h-5 w-5" />}
            />
            <KpiCard
              label="Low stock"
              value={lowStock.length}
              hint="Items at or below threshold"
              icon={<TrendingDown className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Sales — last 7 days</CardTitle>
              <p className="text-xs text-muted-foreground">Net revenue per day (PHP)</p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reports/sales">
                View report
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="h-64">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sevenDaySales}>
                  <defs>
                    <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(142 71% 35%)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(142 71% 35%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="bucket"
                    tickFormatter={(v) => format(parseISO(v), "MMM d")}
                    fontSize={11}
                  />
                  <YAxis fontSize={11} tickFormatter={(v) => `₱${(v / 1000).toFixed(1)}k`} />
                  <RTooltip
                    formatter={(v: number) => formatPHP(v)}
                    labelFormatter={(v) => format(parseISO(String(v)), "MMM d, yyyy")}
                  />
                  <Area
                    type="monotone"
                    dataKey="netTotal"
                    stroke="hsl(142 71% 35%)"
                    fill="url(#gSales)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Low stock</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/inventory">
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)
            ) : lowStock.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Everything well-stocked.
              </p>
            ) : (
              lowStock.slice(0, 6).map((p) => (
                <div
                  key={p.productId}
                  className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.productName}</p>
                    <p className="text-xs text-muted-foreground">SKU {p.sku}</p>
                  </div>
                  <Badge variant={p.stockOnHand === 0 ? "destructive" : "warning"}>
                    {p.stockOnHand === 0 ? (
                      <>
                        <PackageX className="mr-1 h-3 w-3" />
                        Out
                      </>
                    ) : (
                      <>{p.stockOnHand} left</>
                    )}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/orders">
                View all
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : recentOrders.map((o) => (
                  <Link
                    key={o.id}
                    to={`/orders/${o.id}`}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2 hover:bg-accent/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.code}</p>
                      <p className="truncate text-xs text-muted-foreground">{o.customer.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Money value={o.total} className="text-sm font-medium" />
                      <StatusChip status={o.status} />
                    </div>
                  </Link>
                ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent movements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)
              : recentMovements.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{m.productName}</p>
                      <p className="text-xs text-muted-foreground">
                        {m.reason} · {fmtDateTime(m.occurredAt)}
                      </p>
                    </div>
                    <span
                      className={
                        m.delta < 0 ? "font-medium text-rose-600" : "font-medium text-emerald-600"
                      }
                    >
                      {m.delta > 0 ? "+" : ""}
                      {m.delta}
                    </span>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CashierDashboard({ loading, snap }: { loading: boolean; snap?: DashboardSnapshot }) {
  const mySales = snap?.mySales ?? [];
  const myTotal = snap?.mySalesTotal ?? 0;
  const pending = snap?.pendingOrdersCount ?? 0;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        {loading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <KpiCard
              label="My sales today"
              value={<Money value={myTotal} />}
              hint={`${mySales.length} transaction${mySales.length === 1 ? "" : "s"}`}
              icon={<Banknote className="h-5 w-5" />}
            />
            <KpiCard
              label="Pending orders"
              value={pending}
              hint="Awaiting confirmation"
              icon={<ShoppingBag className="h-5 w-5" />}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>My recent sales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)
          ) : mySales.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No sales yet today. Open POS to start.
            </p>
          ) : (
            mySales.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{s.receiptNumber}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(s.completedAt)}</p>
                </div>
                <Money value={s.grandTotal} className="text-sm font-medium" />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
