import type { PosSale } from "@/shared/types/pos";
import { mockProducts } from "./mockProducts";
import { isoDaysAgo, isoHoursAgo } from "@/shared/lib/dates";

function pick(i: number) {
  return mockProducts[(i * 5 + 3) % mockProducts.length];
}

export const mockPosSales: PosSale[] = Array.from({ length: 12 }).map((_, i) => {
  const p1 = pick(i);
  const p2 = pick(i + 2);
  const p3 = pick(i + 7);
  const lines = [
    { productId: p1.id, sku: p1.sku, name: p1.name, unitPrice: p1.price, quantity: 1 + (i % 3) },
    {
      productId: p2.id,
      sku: p2.sku,
      name: p2.name,
      unitPrice: p2.price,
      quantity: 1 + ((i + 1) % 2),
    },
    ...(i % 2 === 0
      ? [{ productId: p3.id, sku: p3.sku, name: p3.name, unitPrice: p3.price, quantity: 1 }]
      : []),
  ];
  const subtotal = lines.reduce((a, b) => a + b.unitPrice * b.quantity, 0);
  const taxTotal = Math.round(subtotal * 0.12 * 100) / 100;
  const grandTotal = subtotal + taxTotal;
  return {
    id: `pos-${2000 + i}`,
    code: `POS-${20260000 + i}`,
    businessName: "Tonette's Minimart",
    lines,
    subtotal,
    taxTotal,
    taxRate: 12,
    discountTotal: 0,
    grandTotal,
    paymentMethod: i % 3 === 0 ? "CARD" : "CASH",
    tendered: i % 3 === 0 ? undefined : Math.ceil(grandTotal / 100) * 100,
    change: i % 3 === 0 ? undefined : Math.ceil(grandTotal / 100) * 100 - grandTotal,
    cashierId: i % 2 === 0 ? "u-cash-1" : "u-cash-2",
    cashierName: i % 2 === 0 ? "Maria Santos" : "Juan dela Cruz",
    completedAt: i < 4 ? isoHoursAgo(i * 2 + 1) : isoDaysAgo(i),
    receiptNumber: `R-${100000 + i}`,
  };
});
