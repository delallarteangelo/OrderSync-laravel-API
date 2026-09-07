export type BusinessSettings = {
  storeName: string;
  address: string;
  phone: string;
  email: string;
  taxRate: number; // percent
  currencySymbol: string;
  receiptHeader: string;
  receiptFooter: string;
  lowStockDefault: number;
};
