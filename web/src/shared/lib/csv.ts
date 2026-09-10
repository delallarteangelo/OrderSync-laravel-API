import Papa from "papaparse";

export function escapeSpreadsheetFormula(value: unknown): unknown {
  if (typeof value !== "string") return value;
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

export function exportRowsCsv<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
): void {
  const safeRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, escapeSpreadsheetFormula(value)]),
    ),
  );
  const csv = Papa.unparse(safeRows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
