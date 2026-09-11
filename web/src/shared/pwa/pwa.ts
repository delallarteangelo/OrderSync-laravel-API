import { flags } from "@/shared/config/env";

export type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function isPublicCatalogPath(pathname: string): boolean {
  return pathname === "/api/v1/storefronts" || pathname.startsWith("/api/v1/storefronts/");
}

export async function registerOrderSyncServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!flags.pwaEnabled || flags.useMsw || import.meta.env.DEV || !("serviceWorker" in navigator)) {
    return null;
  }
  return navigator.serviceWorker.register("/sw.js", { scope: "/" });
}
