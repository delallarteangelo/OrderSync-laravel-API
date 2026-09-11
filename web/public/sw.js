/* global self, caches, fetch, URL */

const VERSION = "ordersync-pwa-v2";
const APP_CACHE = `${VERSION}-app`;
const CATALOG_CACHE = `${VERSION}-catalog`;
const APP_SHELL = [
  "/",
  "/shop",
  "/index.html",
  "/manifest.webmanifest",
  "/favicon.svg",
  "/ordersync-icon.svg",
  "/ordersync-maskable.svg",
  "/robots.txt",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(APP_CACHE).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (key) =>
                key.startsWith("ordersync-pwa-") && ![APP_CACHE, CATALOG_CACHE].includes(key),
            )
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isPublicCatalogRequest(url.pathname)) {
    event.respondWith(networkFirst(request, CATALOG_CACHE));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, APP_CACHE, "/index.html"));
    return;
  }

  if (url.pathname.startsWith("/assets/") || APP_SHELL.includes(url.pathname)) {
    event.respondWith(cacheFirst(request, APP_CACHE));
  }
});

function isPublicCatalogRequest(pathname) {
  return pathname === "/api/v1/storefronts" || pathname.startsWith("/api/v1/storefronts/");
}

async function networkFirst(request, cacheName, fallbackPath) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackPath) {
      const fallback = await cache.match(fallbackPath);
      if (fallback) return fallback;
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}
