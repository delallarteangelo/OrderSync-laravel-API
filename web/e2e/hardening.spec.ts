import { expect, test } from "@playwright/test";

test("release preview exposes security headers and accessible storefront landmarks", async ({
  page,
}) => {
  const response = await page.goto("/shop");

  expect(response).not.toBeNull();
  expect(response!.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(response!.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response!.headers()["x-frame-options"]).toBe("DENY");
  expect(response!.headers()["referrer-policy"]).toBe("strict-origin-when-cross-origin");

  const main = page.locator("main#main-content");
  await expect(main).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "OrderSync stores" })).toBeVisible();

  await main.focus();
  await expect(main).toBeFocused();
});
