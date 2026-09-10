import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const hooks = vi.hoisted(() => ({
  useSalesReport: vi.fn(),
  useAnalyticsOverview: vi.fn(),
}));

vi.mock("@/shared/hooks/useApi", () => hooks);
vi.mock("recharts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("recharts")>();

  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  };
});

import { SalesReportPage } from "@/features/reports/pages/SalesReportPage";

describe("SalesReportPage", () => {
  beforeEach(() => {
    hooks.useSalesReport.mockReturnValue({ data: [] });
    hooks.useAnalyticsOverview.mockReturnValue({
      data: { bestSellingProducts: [], slowMovingProducts: [], customerTrends: [] },
    });
  });

  it("re-queries the report when the aggregation bucket changes", async () => {
    render(<SalesReportPage />);

    await userEvent.click(screen.getByRole("tab", { name: "Week" }));

    expect(hooks.useSalesReport).toHaveBeenLastCalledWith(
      expect.objectContaining({ bucket: "week" }),
    );
  });
});
