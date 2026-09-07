import type { BusinessSettings } from "@/shared/types/settings";

export const mockSettings: BusinessSettings = {
  storeName: "Tonette's Minimart",
  address: "123 Mabini Street, Brgy. San Roque, Quezon City",
  phone: "+63 2 8123 4567",
  email: "hello@tonettesminimart.ph",
  taxRate: 12,
  currencySymbol: "₱",
  receiptHeader: "Tonette's Minimart\n123 Mabini St., QC\nVAT Reg TIN 123-456-789",
  receiptFooter: "Thank you for shopping!\nThis serves as your official receipt.",
  lowStockDefault: 12,
};
