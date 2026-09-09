import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/app/stores/authStore";
import { listBusinessPayments, listCustomerPaymentInstructions } from "../payments";
import { loginAs } from "@/test/utils/login";

describe("recorded payments api", () => {
  beforeEach(() => useAuthStore.getState().clear());

  it("loads tenant-managed wallet instructions", async () => {
    await loginAs("customer@ordersync.local");
    const instructions = await listCustomerPaymentInstructions();
    expect(instructions[0].method).toBe("GCASH");
    expect(instructions[0].qrAvailable).toBe(true);
  });

  it("lists submitted customer payments for business review", async () => {
    await loginAs("tonette@minimart.ph");
    const payments = await listBusinessPayments();
    expect(payments[0]).toMatchObject({ status: "SUBMITTED", proofAvailable: true });
  });
});
