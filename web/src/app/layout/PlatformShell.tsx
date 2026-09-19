import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Users,
  WalletCards,
} from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuthStore } from "@/app/stores/authStore";
import { useUiStore } from "@/app/stores/uiStore";
import { logout as apiLogout } from "@/shared/api/auth";
import { listPlatformApplications } from "@/shared/api/subscriptionApplications";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/cn";
import { OrderSyncLogo } from "@/shared/components/OrderSyncLogo";

type PlatformNavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
};

function PlatformSidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);
  const applications = useQuery({
    queryKey: ["platform", "subscription-applications"],
    queryFn: listPlatformApplications,
    refetchInterval: 30_000,
  });
  const pendingRequests =
    applications.data?.filter((item) => item.status === "PENDING_REVIEW").length ?? 0;
  const pendingPayments =
    applications.data?.filter((item) => item.status === "PAYMENT_SUBMITTED").length ?? 0;

  const groups: Array<{ heading: string; items: PlatformNavItem[] }> = [
    {
      heading: "Platform",
      items: [
        { to: "/platform", label: "Dashboard", icon: LayoutDashboard },
        { to: "/platform/businesses", label: "Businesses", icon: Building2 },
      ],
    },
    {
      heading: "Subscriptions",
      items: [
        {
          to: "/platform/applications",
          label: "Applications",
          icon: ClipboardCheck,
          badge: pendingRequests,
        },
        {
          to: "/platform/payments",
          label: "Payment review",
          icon: WalletCards,
          badge: pendingPayments,
        },
        { to: "/platform/plans", label: "Plans", icon: CreditCard },
        { to: "/platform/billing", label: "Billing", icon: ReceiptText },
      ],
    },
    {
      heading: "Administration",
      items: [{ to: "/platform/users", label: "Users", icon: Users }],
    },
  ];

  return (
    <aside
      aria-label="Platform workspace"
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <OrderSyncLogo className="h-9 w-9" decorative />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">OrderSync</p>
            <p className="truncate text-xs text-muted-foreground">Platform Admin</p>
          </div>
        )}
      </div>

      <nav aria-label="Platform navigation" className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {groups.map((group) => (
          <div key={group.heading} className="space-y-1">
            {!collapsed && (
              <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {group.heading}
              </p>
            )}
            {group.items.map((item) => {
              const link = (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/platform"}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActive && "bg-primary/10 text-primary",
                      collapsed && "justify-center",
                    )
                  }
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                  {!!item.badge && (
                    <span
                      className={cn(
                        "rounded-full bg-primary px-1.5 text-[10px] text-primary-foreground",
                        !collapsed && "ml-auto",
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );

              return collapsed ? (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                    {!!item.badge && ` (${item.badge})`}
                  </TooltipContent>
                </Tooltip>
              ) : (
                link
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t p-2">
        <Button
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="w-full justify-center text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-1 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}

function PlatformTopbar() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const [signingOut, setSigningOut] = React.useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await apiLogout();
    } finally {
      clear();
      window.location.assign("/login");
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b bg-background/95 px-6 backdrop-blur">
      <div>
        <p className="text-sm font-semibold">Platform workspace</p>
        <p className="text-xs text-muted-foreground">
          Manage OrderSync businesses and subscriptions
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium leading-tight">{user?.fullName}</p>
          <p className="text-xs text-muted-foreground">Super Admin</p>
        </div>
        <Button variant="outline" size="sm" disabled={signingOut} onClick={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}

export function PlatformShell() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <a
        href="#platform-main-content"
        className="sr-only z-[110] rounded-md bg-background px-4 py-2 font-medium shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <PlatformSidebar />
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-[margin]",
          collapsed ? "ml-16" : "ml-64",
        )}
      >
        <PlatformTopbar />
        <main id="platform-main-content" tabIndex={-1} className="flex-1 px-6 py-6 outline-none">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
