import * as React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanBarcode,
  ShoppingBag,
  Package,
  PackagePlus,
  History,
  MessageSquare,
  Boxes,
  Tags,
  BarChart3,
  Users,
  Settings,
  Store,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useUiStore } from "@/app/stores/uiStore";
import { useRole } from "@/shared/hooks/useRole";
import { Button } from "@/shared/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/shared/components/ui/tooltip";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

type NavGroup = { heading: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    heading: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/pos", label: "POS", icon: ScanBarcode },
      { to: "/orders", label: "Orders", icon: ShoppingBag },
      { to: "/messages", label: "Messages", icon: MessageSquare },
    ],
  },
  {
    heading: "Inventory",
    items: [
      { to: "/inventory", label: "Stock", icon: Package },
      { to: "/inventory/restock", label: "Restock", icon: PackagePlus },
      { to: "/inventory/movements", label: "Movements", icon: History },
    ],
  },
  {
    heading: "Admin",
    items: [
      { to: "/catalog", label: "Catalog", icon: Boxes, adminOnly: true },
      { to: "/categories", label: "Categories", icon: Tags, adminOnly: true },
      { to: "/reports", label: "Reports", icon: BarChart3, adminOnly: true },
      { to: "/users", label: "Users", icon: Users, adminOnly: true },
      { to: "/settings", label: "Settings", icon: Settings, adminOnly: true },
    ],
  },
];

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);
  const { isAdmin } = useRole();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-background transition-[width]",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Store className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold">Tonette's Minimart</p>
            <p className="truncate text-xs text-muted-foreground">POS & Admin</p>
          </div>
        )}
      </div>
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {groups.map((group) => {
          const visible = group.items.filter((i) => (i.adminOnly ? isAdmin : true));
          if (visible.length === 0) return null;
          return (
            <div key={group.heading} className="space-y-1">
              {!collapsed && (
                <p className="px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.heading}
                </p>
              )}
              {visible.map((item) => {
                const link = (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/dashboard"}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                        isActive && "bg-primary/10 text-primary",
                        collapsed && "justify-center",
                      )
                    }
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.label}</span>}
                  </NavLink>
                );
                return collapsed ? (
                  <Tooltip key={item.to}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">{item.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  link
                );
              })}
            </div>
          );
        })}
      </nav>
      <div className="border-t p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className={cn("w-full justify-center text-muted-foreground")}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-1 text-xs">Collapse</span>}
        </Button>
      </div>
    </aside>
  );
}
