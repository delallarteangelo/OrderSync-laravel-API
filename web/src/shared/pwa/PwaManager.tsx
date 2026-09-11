import * as React from "react";
import { Download, RefreshCw, ServerCrash, WifiOff } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useOnlineStatus, useServiceReachability } from "@/shared/hooks/useOnlineStatus";
import { registerOrderSyncServiceWorker, type InstallPromptEvent } from "@/shared/pwa/pwa";

export function PwaManager() {
  const online = useOnlineStatus();
  const service = useServiceReachability(online);
  const [installPrompt, setInstallPrompt] = React.useState<InstallPromptEvent | null>(null);
  const [waitingWorker, setWaitingWorker] = React.useState<ServiceWorker | null>(null);

  React.useEffect(() => {
    const onInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const onInstalled = () => setInstallPrompt(null);
    window.addEventListener("beforeinstallprompt", onInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    void registerOrderSyncServiceWorker().then((registration) => {
      if (!registration) return;
      if (registration.waiting) setWaitingWorker(registration.waiting);
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            setWaitingWorker(worker);
          }
        });
      });
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", onInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const update = () => {
    if (!waitingWorker) return;
    navigator.serviceWorker.addEventListener("controllerchange", () => window.location.reload(), {
      once: true,
    });
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 p-2 sm:items-end">
      {!online && (
        <div
          role="status"
          className="pointer-events-auto flex max-w-md items-center gap-2 rounded-md bg-amber-100 px-4 py-2 text-sm font-medium text-amber-950 shadow"
        >
          <WifiOff className="h-4 w-4" />
          Offline: cached catalogs and saved drafts remain available. Sending and checkout are
          paused.
        </div>
      )}
      {online && service === "unreachable" && (
        <div
          role="alert"
          className="pointer-events-auto flex max-w-md items-center gap-2 rounded-md bg-rose-100 px-4 py-2 text-sm font-medium text-rose-950 shadow"
        >
          <ServerCrash aria-hidden="true" className="h-4 w-4 shrink-0" />
          OrderSync cannot reach the server. Avoid submitting changes until service is restored.
        </div>
      )}
      {installPrompt && (
        <Button
          className="pointer-events-auto bg-green-800 text-white shadow hover:bg-green-900"
          style={{ backgroundColor: "#166534" }}
          size="sm"
          onClick={() => void install()}
        >
          <Download className="mr-2 h-4 w-4" /> Install OrderSync
        </Button>
      )}
      {waitingWorker && (
        <Button
          className="pointer-events-auto bg-green-800 text-white shadow hover:bg-green-900"
          style={{ backgroundColor: "#166534" }}
          size="sm"
          variant="secondary"
          onClick={update}
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Update OrderSync
        </Button>
      )}
    </div>
  );
}
