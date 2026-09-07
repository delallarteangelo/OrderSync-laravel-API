import { http } from "./axios";
import type {
  InventoryReportRow,
  OrdersReportRow,
  ReportBucket,
  SalesReportRow,
} from "@/shared/types/reports";
import type { Order } from "@/shared/types/orders";
import type { InventoryMovement } from "@/shared/types/inventory";
import type { PosSale } from "@/shared/types/pos";
import type { LowStockItem } from "./inventory";

export type DashboardSnapshot = {
  today: { total: number; count: number; itemsSold: number };
  openOrdersCount: number;
  lowStock: LowStockItem[];
  sevenDaySales: SalesReportRow[];
  recentOrders: Order[];
  recentMovements: InventoryMovement[];
  pendingOrdersCount: number;
  mySales: PosSale[];
  mySalesTotal: number;
};

export async function getDashboard(): Promise<DashboardSnapshot> {
  const { data } = await http.get<DashboardSnapshot>("/dashboard");
  return data;
}

export type ReportRange = { bucket?: ReportBucket; from?: string; to?: string };

export async function getSalesReport(range: ReportRange = {}): Promise<SalesReportRow[]> {
  const { data } = await http.get<{ items: SalesReportRow[] }>("/reports/sales", { params: range });
  return data.items;
}

export async function getOrdersReport(range: ReportRange = {}): Promise<OrdersReportRow[]> {
  const { data } = await http.get<{ items: OrdersReportRow[] }>("/reports/orders", { params: range });
  return data.items;
}

export async function getInventoryReport(): Promise<InventoryReportRow[]> {
  const { data } = await http.get<{ items: InventoryReportRow[] }>("/reports/inventory");
  return data.items;
}
