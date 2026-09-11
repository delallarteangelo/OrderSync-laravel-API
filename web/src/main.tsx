import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router/routes";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { ToastProvider } from "@/app/providers/ToastProvider";
import { flags } from "@/shared/config/env";
import { PwaManager } from "@/shared/pwa/PwaManager";
import "@/styles/globals.css";

async function enableMswIfNeeded() {
  if (!flags.useMsw) return;
  const { worker } = await import("@/test/msw/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}

void enableMswIfNeeded().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryProvider>
        <ToastProvider>
          <TooltipProvider delayDuration={150}>
            <RouterProvider router={router} />
            <PwaManager />
          </TooltipProvider>
        </ToastProvider>
      </QueryProvider>
    </React.StrictMode>,
  );
});
