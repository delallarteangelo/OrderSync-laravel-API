export type Category = {
  id: string;
  name: string;
  iconUrl?: string;
};

export type Product = {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  costPrice?: number;
  stockOnHand: number;
  lowStockThreshold: number;
  isActive: boolean;
  imageUrl?: string;
};
