export type ReportBucket = "day" | "week" | "month";

export type SalesReportRow = {
  bucket: string; // ISO date or label
  salesCount: number;
  grossTotal: number;
  discountTotal: number;
  netTotal: number;
};

export type OrdersReportRow = {
  bucket: string;
  pending: number;
  confirmed: number;
  preparing: number;
  readyForPickup: number;
  completed: number;
  rejected: number;
  cancelled: number;
  total: number;
};

export type InventoryReportRow = {
  productId: string;
  productName: string;
  category: string;
  stockOnHand: number;
  threshold: number;
  status: "OK" | "LOW" | "OUT";
};

export type LowStockAlert = {
  productId: string;
  productName: string;
  stockOnHand: number;
  threshold: number;
};
