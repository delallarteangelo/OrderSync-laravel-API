import * as React from "react";
import { cn } from "@/shared/lib/cn";
import { Card, CardContent } from "@/shared/components/ui/card";

export interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  hint?: React.ReactNode;
  trend?: { value: number; positive?: boolean };
  className?: string;
}

export function KpiCard({ label, value, icon, hint, trend, className }: KpiCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          {trend && (
            <p className={cn("text-xs font-medium", trend.positive ? "text-emerald-600" : "text-rose-600")}>
              {trend.positive ? "▲" : "▼"} {Math.abs(trend.value).toFixed(1)}%
            </p>
          )}
        </div>
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            {icon}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
