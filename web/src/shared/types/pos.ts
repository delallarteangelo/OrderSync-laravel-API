export type PaymentMethod = "CASH" | "CARD" | "OTHER";

export type CartLine = {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineDiscount?: number;
};

export type PosSale = {
  id: string;
  code: string;
  lines: CartLine[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  tendered?: number;
  change?: number;
  cashierId: string;
  cashierName: string;
  completedAt: string;
  receiptNumber: string;
};
