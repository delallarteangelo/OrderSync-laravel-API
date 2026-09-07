import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, loginAsCashier, logout } from "@/test/utils/login";
import { getSettings, updateSettings } from "@/shared/api/settings";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("settings api", () => {
  it("any signed-in user can read settings", async () => {
    await loginAsCashier();
    const s = await getSettings();
    expect(s.storeName).toBeTruthy();
  });

  it("cashier cannot update settings", async () => {
    await loginAsCashier();
    await expect(updateSettings({ taxRate: 5 })).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === "FORBIDDEN",
    );
  });

  it("admin updates settings", async () => {
    await loginAsAdmin();
    const next = await updateSettings({ taxRate: 7.5 });
    expect(next.taxRate).toBe(7.5);
  });
});
