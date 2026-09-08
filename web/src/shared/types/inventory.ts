import { z } from "zod";

export const reasonCodeSchema = z.enum(["POS_SALE", "ORDER_CONFIRMED", "ADJUSTMENT", "RESTOCK"]);

export const inventoryMovementSchema = z.object({
  id: z.string(),
  productId: z.string(),
  productName: z.string(),
  delta: z.number().int(),
  quantityBefore: z.number().int().nonnegative().optional(),
  quantityAfter: z.number().int().nonnegative().optional(),
  reason: reasonCodeSchema,
  note: z.string().nullable().optional(),
  supplierRef: z.string().nullable().optional(),
  actorId: z.string().nullable(),
  actorName: z.string(),
  occurredAt: z.string(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string(),
  delta: z
    .number()
    .int()
    .refine((value) => value !== 0),
  reasonCode: z.literal("ADJUSTMENT"),
  note: z.string().min(3).optional(),
});

export const restockEntrySchema = z.object({
  productId: z.string(),
  quantity: z.number().int().positive(),
  supplierRef: z.string().optional(),
  note: z.string().optional(),
});

export type ReasonCode = z.infer<typeof reasonCodeSchema>;
export type InventoryMovement = z.infer<typeof inventoryMovementSchema>;
export type StockAdjustment = z.infer<typeof stockAdjustmentSchema>;
export type RestockEntry = z.infer<typeof restockEntrySchema>;
