import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { useUiStore } from "@/app/stores/uiStore";
import { useLowStock } from "@/shared/hooks/useApi";
import { Alert, AlertDescription, AlertTitle } from "@/shared/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/cn";

export function AppShell() {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const lowStockBanner = useUiStore((s) => s.lowStockBanner);
  const setLowStockBanner = useUiStore((s) => s.setLowStockBanner);
  const lowStock = useLowStock().data ?? [];

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <a
        href="#main-content"
        className="sr-only z-[110] rounded-md bg-background px-4 py-2 font-medium shadow focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to main content
      </a>
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen flex-1 flex-col transition-[margin]",
          sidebarCollapsed ? "ml-16" : "ml-64",
        )}
      >
        <Topbar />
        <div className="flex flex-col gap-2 px-6 pt-4">
          {lowStockBanner && lowStock.length > 0 && (
            <Alert variant="warning" className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle className="mb-0">
                    {lowStock.length} item{lowStock.length === 1 ? "" : "s"} below stock threshold
                  </AlertTitle>
                </div>
                <AlertDescription>Review inventory to restock items running low.</AlertDescription>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => setLowStockBanner(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </Alert>
          )}
        </div>
        <main id="main-content" tabIndex={-1} className="flex-1 px-6 py-6 outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
