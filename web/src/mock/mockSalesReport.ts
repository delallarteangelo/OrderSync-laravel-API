import type { SalesReportRow } from "@/shared/types/reports";
import { format, subDays } from "date-fns";

function seededDay(i: number) {
  // Pseudo-random but deterministic per index
  const base = 4200 + ((i * 137) % 1800);
  const discount = ((i * 53) % 280) + 40;
  return { gross: base, discount };
}

export const mockSalesDaily: SalesReportRow[] = Array.from({ length: 30 }).map((_, i) => {
  const d = subDays(new Date(), 29 - i);
  const { gross, discount } = seededDay(i);
  return {
    bucket: format(d, "yyyy-MM-dd"),
    salesCount: 12 + ((i * 7) % 25),
    grossTotal: gross,
    discountTotal: discount,
    netTotal: gross - discount,
  };
});

export const mockSalesWeekly: SalesReportRow[] = [];
for (let w = 0; w < 4; w++) {
  const slice = mockSalesDaily.slice(w * 7, w * 7 + 7);
  if (!slice.length) continue;
  mockSalesWeekly.push({
    bucket: `Week of ${slice[0].bucket}`,
    salesCount: slice.reduce((a, r) => a + r.salesCount, 0),
    grossTotal: slice.reduce((a, r) => a + r.grossTotal, 0),
    discountTotal: slice.reduce((a, r) => a + r.discountTotal, 0),
    netTotal: slice.reduce((a, r) => a + r.netTotal, 0),
  });
}

export const mockSalesMonthly: SalesReportRow[] = [
  {
    bucket: format(new Date(), "yyyy-MM"),
    salesCount: mockSalesDaily.reduce((a, r) => a + r.salesCount, 0),
    grossTotal: mockSalesDaily.reduce((a, r) => a + r.grossTotal, 0),
    discountTotal: mockSalesDaily.reduce((a, r) => a + r.discountTotal, 0),
    netTotal: mockSalesDaily.reduce((a, r) => a + r.netTotal, 0),
  },
];

export const sevenDaySales = mockSalesDaily.slice(-7);
