import type { Product } from "@/shared/types/catalog";

// 32 realistic Filipino minimart items.
export const mockProducts: Product[] = [
  { id: "p-001", sku: "SKU-0001", barcode: "4800016641015", name: "Bear Brand Powdered Milk 300g", categoryId: "cat-dry", price: 145, costPrice: 118, stockOnHand: 24, lowStockThreshold: 12, isActive: true },
  { id: "p-002", sku: "SKU-0002", barcode: "4800016641022", name: "Nestle Fresh Milk 1L", categoryId: "cat-dry", price: 98, costPrice: 78, stockOnHand: 8, lowStockThreshold: 10, isActive: true },
  { id: "p-003", sku: "SKU-0003", barcode: "4800016641039", name: "Alaska Evaporada 370ml", categoryId: "cat-dry", price: 42, costPrice: 32, stockOnHand: 36, lowStockThreshold: 12, isActive: true },
  { id: "p-004", sku: "SKU-0004", barcode: "4800016641046", name: "Lucky Me Pancit Canton Original", categoryId: "cat-snk", price: 16, costPrice: 12, stockOnHand: 120, lowStockThreshold: 36, isActive: true },
  { id: "p-005", sku: "SKU-0005", barcode: "4800016641053", name: "Lucky Me Pancit Canton Chilimansi", categoryId: "cat-snk", price: 16, costPrice: 12, stockOnHand: 90, lowStockThreshold: 36, isActive: true },
  { id: "p-006", sku: "SKU-0006", barcode: "4800016641060", name: "Nissin Cup Noodles Seafood 60g", categoryId: "cat-snk", price: 29, costPrice: 22, stockOnHand: 48, lowStockThreshold: 24, isActive: true },
  { id: "p-007", sku: "SKU-0007", barcode: "4800016641077", name: "Piattos Cheese 85g", categoryId: "cat-snk", price: 35, costPrice: 27, stockOnHand: 4, lowStockThreshold: 12, isActive: true },
  { id: "p-008", sku: "SKU-0008", barcode: "4800016641084", name: "Chippy BBQ 110g", categoryId: "cat-snk", price: 30, costPrice: 23, stockOnHand: 28, lowStockThreshold: 12, isActive: true },
  { id: "p-009", sku: "SKU-0009", barcode: "4800016641091", name: "Coca-Cola 1.5L", categoryId: "cat-bev", price: 75, costPrice: 58, stockOnHand: 18, lowStockThreshold: 12, isActive: true },
  { id: "p-010", sku: "SKU-0010", barcode: "4800016641107", name: "Coca-Cola Mismo 290ml", categoryId: "cat-bev", price: 20, costPrice: 14, stockOnHand: 60, lowStockThreshold: 24, isActive: true },
  { id: "p-011", sku: "SKU-0011", barcode: "4800016641114", name: "Sprite 1.5L", categoryId: "cat-bev", price: 75, costPrice: 58, stockOnHand: 14, lowStockThreshold: 12, isActive: true },
  { id: "p-012", sku: "SKU-0012", barcode: "4800016641121", name: "Royal Tru-Orange 1.5L", categoryId: "cat-bev", price: 75, costPrice: 58, stockOnHand: 9, lowStockThreshold: 12, isActive: true },
  { id: "p-013", sku: "SKU-0013", barcode: "4800016641138", name: "Nature's Spring Water 500ml", categoryId: "cat-bev", price: 18, costPrice: 12, stockOnHand: 84, lowStockThreshold: 24, isActive: true },
  { id: "p-014", sku: "SKU-0014", barcode: "4800016641145", name: "Kopiko Brown 3-in-1 25g", categoryId: "cat-bev", price: 8, costPrice: 6, stockOnHand: 200, lowStockThreshold: 60, isActive: true },
  { id: "p-015", sku: "SKU-0015", barcode: "4800016641152", name: "Nescafe 3-in-1 Original 20g", categoryId: "cat-bev", price: 9, costPrice: 7, stockOnHand: 0, lowStockThreshold: 60, isActive: true },
  { id: "p-016", sku: "SKU-0016", barcode: "4800016641169", name: "Sinandomeng Rice 5kg", categoryId: "cat-rgr", price: 320, costPrice: 280, stockOnHand: 22, lowStockThreshold: 10, isActive: true },
  { id: "p-017", sku: "SKU-0017", barcode: "4800016641176", name: "Jasmine Rice 5kg", categoryId: "cat-rgr", price: 365, costPrice: 320, stockOnHand: 12, lowStockThreshold: 8, isActive: true },
  { id: "p-018", sku: "SKU-0018", barcode: "4800016641183", name: "Mongo Beans 250g", categoryId: "cat-rgr", price: 38, costPrice: 28, stockOnHand: 30, lowStockThreshold: 10, isActive: true },
  { id: "p-019", sku: "SKU-0019", barcode: "4800016641190", name: "Century Tuna Flakes in Oil 155g", categoryId: "cat-can", price: 42, costPrice: 32, stockOnHand: 56, lowStockThreshold: 24, isActive: true },
  { id: "p-020", sku: "SKU-0020", barcode: "4800016641206", name: "Argentina Corned Beef 175g", categoryId: "cat-can", price: 45, costPrice: 34, stockOnHand: 38, lowStockThreshold: 18, isActive: true },
  { id: "p-021", sku: "SKU-0021", barcode: "4800016641213", name: "Mega Sardines in Tomato Sauce 155g", categoryId: "cat-can", price: 28, costPrice: 21, stockOnHand: 72, lowStockThreshold: 24, isActive: true },
  { id: "p-022", sku: "SKU-0022", barcode: "4800016641220", name: "CDO Karne Norte 150g", categoryId: "cat-can", price: 32, costPrice: 24, stockOnHand: 6, lowStockThreshold: 18, isActive: true },
  { id: "p-023", sku: "SKU-0023", barcode: "4800016641237", name: "Surf Powder Detergent 70g", categoryId: "cat-hhd", price: 12, costPrice: 9, stockOnHand: 130, lowStockThreshold: 48, isActive: true },
  { id: "p-024", sku: "SKU-0024", barcode: "4800016641244", name: "Tide Original Powder 1kg", categoryId: "cat-hhd", price: 152, costPrice: 128, stockOnHand: 16, lowStockThreshold: 8, isActive: true },
  { id: "p-025", sku: "SKU-0025", barcode: "4800016641251", name: "Joy Dishwashing Liquid 250ml", categoryId: "cat-hhd", price: 78, costPrice: 62, stockOnHand: 22, lowStockThreshold: 12, isActive: true },
  { id: "p-026", sku: "SKU-0026", barcode: "4800016641268", name: "Domex Bleach 1L", categoryId: "cat-hhd", price: 88, costPrice: 70, stockOnHand: 11, lowStockThreshold: 8, isActive: true },
  { id: "p-027", sku: "SKU-0027", barcode: "4800016641275", name: "Safeguard White Soap 130g", categoryId: "cat-per", price: 42, costPrice: 32, stockOnHand: 64, lowStockThreshold: 24, isActive: true },
  { id: "p-028", sku: "SKU-0028", barcode: "4800016641282", name: "Colgate Toothpaste 75ml", categoryId: "cat-per", price: 89, costPrice: 70, stockOnHand: 18, lowStockThreshold: 10, isActive: true },
  { id: "p-029", sku: "SKU-0029", barcode: "4800016641299", name: "Palmolive Naturals Shampoo 15ml Sachet", categoryId: "cat-per", price: 8, costPrice: 6, stockOnHand: 240, lowStockThreshold: 72, isActive: true },
  { id: "p-030", sku: "SKU-0030", barcode: "4800016641305", name: "Magnolia Ice Cream Quart Cookies & Cream", categoryId: "cat-frz", price: 165, costPrice: 132, stockOnHand: 7, lowStockThreshold: 6, isActive: true },
  { id: "p-031", sku: "SKU-0031", barcode: "4800016641312", name: "Purefoods Tender Juicy Hotdog 1kg", categoryId: "cat-frz", price: 285, costPrice: 240, stockOnHand: 10, lowStockThreshold: 6, isActive: true },
  { id: "p-032", sku: "SKU-0032", barcode: "4800016641329", name: "San Mig Light 330ml Bottle", categoryId: "cat-bev", price: 65, costPrice: 52, stockOnHand: 48, lowStockThreshold: 24, isActive: false },
];

export function findProductByCode(code: string): Product | undefined {
  const c = code.trim().toUpperCase();
  return mockProducts.find(
    (p) => p.sku.toUpperCase() === c || (p.barcode ?? "").toUpperCase() === c,
  );
}
