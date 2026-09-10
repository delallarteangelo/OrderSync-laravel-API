import { describe, expect, it } from "vitest";
import { escapeSpreadsheetFormula } from "@/shared/lib/csv";

describe("CSV export safety", () => {
  it.each(["=SUM(A1:A2)", "+cmd", "-1+2", "@IMPORT", "\tformula", "\rformula"])(
    "neutralizes spreadsheet formula input %s",
    (value) => expect(escapeSpreadsheetFormula(value)).toBe(`'${value}`),
  );

  it("leaves ordinary text and numbers unchanged", () => {
    expect(escapeSpreadsheetFormula("Rice")).toBe("Rice");
    expect(escapeSpreadsheetFormula(42)).toBe(42);
  });
});
