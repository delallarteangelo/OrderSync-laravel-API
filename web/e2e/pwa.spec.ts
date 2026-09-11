import { expect, test } from "@playwright/test";

test("is installable, mobile-safe, and reloads its shell offline", async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/shop");

  await expect(page).toHaveTitle("OrderSync");
  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute(
    "href",
    "/manifest.webmanifest",
  );
  const manifest = await page.request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect(await manifest.json()).toMatchObject({
    name: "OrderSync",
    start_url: "/shop",
    display: "standalone",
    theme_color: "#15803d",
  });

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "OrderSync stores" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );

  await page.evaluate(async () => {
    const cache = await caches.open("ordersync-pwa-v2-catalog");
    await cache.put(
      "/api/v1/storefronts",
      new Response(JSON.stringify({ items: [{ id: "offline", name: "Cached store" }] }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
  });

  await context.setOffline(true);
  const cachedCatalog = await page.evaluate(async () =>
    (await fetch("/api/v1/storefronts")).json(),
  );
  expect(cachedCatalog.items[0].name).toBe("Cached store");
  await page.reload();
  await expect(page.getByRole("heading", { name: "OrderSync stores" })).toBeVisible();
  await expect(page.getByRole("status").filter({ hasText: "Offline:" })).toContainText("Offline");
});
