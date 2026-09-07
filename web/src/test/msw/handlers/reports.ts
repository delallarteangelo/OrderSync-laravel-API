import { http, HttpResponse } from "msw";
import { db, findUserByToken, tokenFromAuthHeader } from "../db";
import { format, parseISO, subDays, startOfWeek, startOfMonth } from "date-fns";
import type { ReportBucket, SalesReportRow, OrdersReportRow, InventoryReportRow } from "@/shared/types/reports";

function requireUser(request: Request) {
  return findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
}

function bucketKey(iso: string, bucket: ReportBucket): string {
  const d = parseISO(iso);
  if (bucket === "day") return format(d, "yyyy-MM-dd");
  if (bucket === "week") return format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return format(startOfMonth(d), "yyyy-MM");
}

export const reportsHandlers = [
  http.get("/api/v1/dashboard", ({ request }) => {
    const user = requireUser(request);
    if (!user) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const today = format(new Date(), "yyyy-MM-dd");
    const todaySales = db.posSales.filter((s) => s.completedAt.startsWith(today));
    const todayTotal = todaySales.reduce((a, b) => a + b.grandTotal, 0);
    const itemsSoldToday = todaySales.reduce((a, s) => a + s.lines.reduce((b, l) => b + l.quantity, 0), 0);
    const openOrders = db.orders.filter((o) => ["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_PICKUP"].includes(o.status));
    const lowStock = db.products
      .filter((p) => p.isActive && p.stockOnHand <= p.lowStockThreshold)
      .map((p) => ({ productId: p.id, productName: p.name, sku: p.sku, stockOnHand: p.stockOnHand, threshold: p.lowStockThreshold }));
    const sevenDay: SalesReportRow[] = Array.from({ length: 7 }).map((_, i) => {
      const d = subDays(new Date(), 6 - i);
      const key = format(d, "yyyy-MM-dd");
      const rows = db.posSales.filter((s) => s.completedAt.startsWith(key));
      const gross = rows.reduce((a, b) => a + b.subtotal, 0);
      const discount = rows.reduce((a, b) => a + b.discountTotal, 0);
      return {
        bucket: key,
        salesCount: rows.length,
        grossTotal: gross,
        discountTotal: discount,
        netTotal: rows.reduce((a, b) => a + b.grandTotal, 0),
      };
    });
    const recentOrders = [...db.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 6);
    const recentMovements = [...db.movements].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 6);
    const mySales = db.posSales.filter((s) => s.completedAt.startsWith(today) && s.cashierId === user.id);
    return HttpResponse.json({
      today: { total: todayTotal, count: todaySales.length, itemsSold: itemsSoldToday },
      openOrdersCount: openOrders.length,
      lowStock,
      sevenDaySales: sevenDay,
      recentOrders,
      recentMovements,
      pendingOrdersCount: db.orders.filter((o) => o.status === "PENDING").length,
      mySales,
      mySalesTotal: mySales.reduce((a, b) => a + b.grandTotal, 0),
    });
  }),

  http.get("/api/v1/reports/sales", ({ request }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const bucket = (url.searchParams.get("bucket") ?? "day") as ReportBucket;
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    let sales = db.posSales;
    if (from) sales = sales.filter((s) => s.completedAt >= from);
    if (to) sales = sales.filter((s) => s.completedAt <= to);
    const map = new Map<string, SalesReportRow>();
    for (const s of sales) {
      const k = bucketKey(s.completedAt, bucket);
      const cur = map.get(k) ?? { bucket: k, salesCount: 0, grossTotal: 0, discountTotal: 0, netTotal: 0 };
      cur.salesCount += 1;
      cur.grossTotal += s.subtotal;
      cur.discountTotal += s.discountTotal;
      cur.netTotal += s.grandTotal;
      map.set(k, cur);
    }
    const items = [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
    return HttpResponse.json({ items });
  }),

  http.get("/api/v1/reports/orders", ({ request }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const url = new URL(request.url);
    const bucket = (url.searchParams.get("bucket") ?? "day") as ReportBucket;
    const map = new Map<string, OrdersReportRow>();
    for (const o of db.orders) {
      const k = bucketKey(o.placedAt, bucket);
      const cur =
        map.get(k) ??
        ({ bucket: k, pending: 0, confirmed: 0, preparing: 0, readyForPickup: 0, completed: 0, rejected: 0, cancelled: 0, total: 0 } as OrdersReportRow);
      cur.total += 1;
      switch (o.status) {
        case "PENDING":
          cur.pending += 1;
          break;
        case "CONFIRMED":
          cur.confirmed += 1;
          break;
        case "PREPARING":
          cur.preparing += 1;
          break;
        case "READY_FOR_PICKUP":
          cur.readyForPickup += 1;
          break;
        case "COMPLETED":
          cur.completed += 1;
          break;
        case "REJECTED":
          cur.rejected += 1;
          break;
        case "CANCELLED":
          cur.cancelled += 1;
          break;
      }
      map.set(k, cur);
    }
    const items = [...map.values()].sort((a, b) => a.bucket.localeCompare(b.bucket));
    return HttpResponse.json({ items });
  }),

  http.get("/api/v1/reports/inventory", ({ request }) => {
    if (!requireUser(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const items: InventoryReportRow[] = db.products.map((p) => {
      const cat = db.categories.find((c) => c.id === p.categoryId);
      const status = p.stockOnHand === 0 ? "OUT" : p.stockOnHand <= p.lowStockThreshold ? "LOW" : "OK";
      return {
        productId: p.id,
        productName: p.name,
        category: cat?.name ?? "—",
        stockOnHand: p.stockOnHand,
        threshold: p.lowStockThreshold,
        status,
      };
    });
    return HttpResponse.json({ items });
  }),
];
