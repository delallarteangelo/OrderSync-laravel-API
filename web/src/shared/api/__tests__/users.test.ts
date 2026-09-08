import { describe, it, expect, beforeEach } from "vitest";
import { loginAs, loginAsAdmin, loginAsCashier, logout } from "@/test/utils/login";
import { deactivateUser, listUsers, resetUserPassword, updateUser } from "@/shared/api/users";
import { isApiError } from "@/shared/api/errors";

beforeEach(() => {
  logout();
});

describe("users api (admin only)", () => {
  it("cashier is forbidden from listing users", async () => {
    await loginAsCashier();
    await expect(listUsers()).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === "FORBIDDEN",
    );
  });

  it("admin cannot demote self", async () => {
    const data = await loginAsAdmin();
    await expect(
      updateUser(data.user.id, { role: "STAFF" }),
    ).rejects.toSatisfy((e: unknown) => isApiError(e) && e.code === "SELF_DEMOTE");
  });

  it("admin cannot deactivate self", async () => {
    const data = await loginAsAdmin();
    await expect(deactivateUser(data.user.id)).rejects.toSatisfy(
      (e: unknown) => isApiError(e) && e.code === "SELF_DEACTIVATE",
    );
  });

  it("admin resets another user's password and that user can sign in with it", async () => {
    await loginAsAdmin();
    const users = await listUsers();
    const target = users.find((u) => u.role === "CASHIER" && u.isActive)!;
    const { tempPassword } = await resetUserPassword(target.id);
    expect(tempPassword).toBeTruthy();

    logout();
    const session = await loginAs(target.email, tempPassword);
    expect(session.user.id).toBe(target.id);
  });
});
