import type { Order, OrderStatus } from "@/shared/types/orders";
import { mockProducts } from "./mockProducts";
import { isoDaysAgo, isoHoursAgo, isoMinutesAgo } from "@/shared/lib/dates";

const customers = [
  { id: "c-1", name: "Aling Nena Sari-Sari Store", email: "nena@example.test" },
  { id: "c-2", name: "Mang Berto's Carinderia", email: "berto@example.test" },
  { id: "c-3", name: "Cely Mini-Store", email: "cely@example.test" },
  { id: "c-4", name: "Tindahan ni Aleng Rosa", email: "rosa@example.test" },
  { id: "c-5", name: "JB Variety Shop", email: "jb@example.test" },
  { id: "c-6", name: "Salud General Store", email: "salud@example.test" },
];

const statusOrder: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

function makeOrder(idx: number, status: OrderStatus): Order {
  const cust = customers[idx % customers.length];
  const pickProducts = [
    mockProducts[(idx * 3) % mockProducts.length],
    mockProducts[(idx * 5 + 1) % mockProducts.length],
    mockProducts[(idx * 7 + 2) % mockProducts.length],
  ];
  const items = pickProducts.map((p, i) => {
    const quantity = 1 + ((idx + i) % 4) * 2;
    return {
      productId: p.id,
      sku: p.sku,
      productName: p.name,
      quantity,
      unitPrice: p.price,
      lineTotal: p.price * quantity,
    };
  });
  const subtotal = items.reduce((a, b) => a + b.lineTotal, 0);
  const placedDays = (idx % 10) + 1;
  const placedAt = isoDaysAgo(placedDays);
  const history = statusOrder.slice(0, statusOrder.indexOf(status) + 1).map((s, i) => ({
    status: s,
    at: isoHoursAgo(placedDays * 24 - i * 6),
    actorName: i === 0 ? cust.name : i === 1 ? "Maria Santos" : "Tonette Reyes",
  }));
  if (status === "REJECTED") {
    history.push({
      status: "REJECTED",
      at: isoHoursAgo(placedDays * 24 - 2),
      actorName: "Tonette Reyes",
      note: "Out of stock",
    } as never);
  }
  if (status === "CANCELLED") {
    history.push({
      status: "CANCELLED",
      at: isoHoursAgo(placedDays * 24 - 3),
      actorName: cust.name,
      note: "Customer cancelled",
    } as never);
  }
  return {
    id: `o-${1000 + idx}`,
    code: `ORD-${(2026000 + idx).toString()}`,
    customer: cust,
    business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
    items,
    subtotal,
    total: subtotal,
    walletPaid: 0,
    counterPaid: 0,
    amountReceived: 0,
    balanceDue: subtotal,
    refundedAmount: 0,
    financialStatus: "UNPAID",
    balanceCollectionMethod: "CASH_AT_PICKUP",
    fulfillmentMethod: "PICKUP",
    status,
    placedAt,
    updatedAt: history[history.length - 1].at,
    statusHistory: history,
    payments: [],
    counterPayments: [],
    refunds: [],
  };
}

export const mockOrders: Order[] = [
  makeOrder(0, "PENDING"),
  makeOrder(1, "PENDING"),
  makeOrder(2, "CONFIRMED"),
  makeOrder(3, "CONFIRMED"),
  makeOrder(4, "PREPARING"),
  makeOrder(5, "PREPARING"),
  makeOrder(6, "READY_FOR_PICKUP"),
  makeOrder(7, "READY_FOR_PICKUP"),
  makeOrder(8, "COMPLETED"),
  makeOrder(9, "COMPLETED"),
  makeOrder(10, "COMPLETED"),
  makeOrder(11, "REJECTED"),
  makeOrder(12, "CANCELLED"),
  { ...makeOrder(13, "PENDING"), placedAt: isoMinutesAgo(8), updatedAt: isoMinutesAgo(8) },
];
