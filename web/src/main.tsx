import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router/routes";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/shared/components/ui/tooltip";
import { QueryProvider } from "@/app/providers/QueryProvider";
import { flags } from "@/shared/config/env";
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
        <TooltipProvider delayDuration={150}>
          <RouterProvider router={router} />
          <Toaster richColors closeButton position="top-right" />
        </TooltipProvider>
      </QueryProvider>
    </React.StrictMode>,
  );
});
