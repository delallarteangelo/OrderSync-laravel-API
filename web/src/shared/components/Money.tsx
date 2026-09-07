import { formatPHP } from "@/shared/lib/money";

export interface MoneyProps {
  value: number;
  withSymbol?: boolean;
  className?: string;
}

export function Money({ value, withSymbol = true, className }: MoneyProps) {
  return <span className={className}>{formatPHP(value, { withSymbol })}</span>;
}
