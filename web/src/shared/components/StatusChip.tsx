import type { OrderStatus } from "@/shared/types/orders";
import { Badge } from "@/shared/components/ui/badge";
import { cn } from "@/shared/lib/cn";

const variants: Record<OrderStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-800 border-amber-200" },
  CONFIRMED: { label: "Confirmed", className: "bg-sky-100 text-sky-800 border-sky-200" },
  REJECTED: { label: "Rejected", className: "bg-rose-100 text-rose-800 border-rose-200" },
  PREPARING: { label: "Preparing", className: "bg-violet-100 text-violet-800 border-violet-200" },
  READY_FOR_PICKUP: {
    label: "Ready",
    className: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  COMPLETED: {
    label: "Completed",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  CANCELLED: { label: "Cancelled", className: "bg-slate-200 text-slate-700 border-slate-300" },
};

export function StatusChip({ status, className }: { status: OrderStatus; className?: string }) {
  const v = variants[status];
  return (
    <Badge variant="outline" className={cn(v.className, "border", className)}>
      {v.label}
    </Badge>
  );
}
