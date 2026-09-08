import { z } from "zod";

export const paymentMethodSchema = z.enum(["CASH", "GCASH", "MAYA", "CARD", "OTHER"]);

export const cartLineSchema = z.object({
  productId: z.string(),
  sku: z.string(),
  name: z.string(),
  unitPrice: z.number().nonnegative(),
  quantity: z.number().int().positive(),
  lineDiscount: z.number().nonnegative().optional(),
  lineTotal: z.number().nonnegative().optional(),
});

export const posSaleSchema = z.object({
  id: z.string(),
  code: z.string(),
  receiptNumber: z.string(),
  businessName: z.string(),
  lines: z.array(cartLineSchema),
  subtotal: z.number().nonnegative(),
  taxTotal: z.number().nonnegative(),
  taxRate: z.number().nonnegative(),
  discountTotal: z.number().nonnegative(),
  grandTotal: z.number().nonnegative(),
  paymentMethod: paymentMethodSchema,
  paymentReference: z.string().nullable().optional(),
  tendered: z.number().nullable().optional(),
  change: z.number().nullable().optional(),
  cashierId: z.string().nullable(),
  cashierName: z.string(),
  completedAt: z.string(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type CartLine = z.infer<typeof cartLineSchema>;
export type PosSale = z.infer<typeof posSaleSchema>;
