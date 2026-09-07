export const PHP = "₱";

export function formatPHP(value: number | string, opts: { withSymbol?: boolean } = {}): string {
  const n = typeof value === "string" ? Number(value) : value;
  const formatted = (Number.isFinite(n) ? n : 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return opts.withSymbol === false ? formatted : `${PHP}${formatted}`;
}

export function toNumber(value: number | string | undefined | null): number {
  if (value === undefined || value === null) return 0;
  const n = typeof value === "string" ? Number(value) : value;
  return Number.isFinite(n) ? n : 0;
}

export function sum(values: Array<number | string>): number {
  return values.reduce<number>((acc, v) => acc + toNumber(v), 0);
}
