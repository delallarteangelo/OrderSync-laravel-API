import { z } from "zod";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  iconUrl: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  productCount: z.number().int().nonnegative().optional(),
});

export const productSchema = z.object({
  id: z.string(),
  sku: z.string(),
  barcode: z.string().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  categoryId: z.string(),
  price: z.number().nonnegative(),
  costPrice: z.number().nonnegative().nullable().optional(),
  stockOnHand: z.number().int().nonnegative(),
  lowStockThreshold: z.number().int().nonnegative(),
  isActive: z.boolean(),
  imageUrl: z.string().nullable().optional(),
  stockVersion: z.number().int().nonnegative().optional(),
  categoryName: z.string().optional(),
});

export type Category = z.infer<typeof categorySchema>;
export type Product = z.infer<typeof productSchema>;
