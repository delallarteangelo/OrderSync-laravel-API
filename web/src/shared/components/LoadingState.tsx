import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/cn";

export interface LoadingStateProps {
  label?: string;
  rows?: number;
  className?: string;
}

export function LoadingState({
  label = "Loading content…",
  rows = 3,
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      className={cn("space-y-3 rounded-lg border bg-card p-5", className)}
    >
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton
          key={index}
          className={cn("h-10 w-full", index === rows - 1 && "w-3/4")}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
