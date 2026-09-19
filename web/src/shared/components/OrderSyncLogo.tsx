import { cn } from "@/shared/lib/cn";

type OrderSyncLogoProps = {
  className?: string;
  decorative?: boolean;
};

export function OrderSyncLogo({ className, decorative = false }: OrderSyncLogoProps) {
  return (
    <img
      src="/branding/OrderSync-Web-Logo.png"
      alt={decorative ? "" : "OrderSync logo"}
      aria-hidden={decorative || undefined}
      width={1024}
      height={1024}
      className={cn("shrink-0 rounded-lg object-cover", className)}
    />
  );
}
