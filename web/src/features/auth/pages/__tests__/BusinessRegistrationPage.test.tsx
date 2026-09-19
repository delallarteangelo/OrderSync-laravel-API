import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SubscriptionPlan } from "@/shared/types/platform";

const api = vi.hoisted(() => ({ publicSubscriptionPlans: vi.fn(), registerBusiness: vi.fn() }));
vi.mock("@/shared/api/subscriptionApplications", () => ({ publicSubscriptionPlans: api.publicSubscriptionPlans }));
vi.mock("@/shared/api/registration", () => ({ registerBusiness: api.registerBusiness }));

import { BusinessRegistrationPage } from "../BusinessRegistrationPage";

function plan(code: SubscriptionPlan["code"], priceMinor: number, maxUsers: number, ordering: boolean, ai: boolean): SubscriptionPlan {
  return {
    id: code, code, name: code[0] + code.slice(1).toLowerCase(),
    priceMinor, currency: "PHP", billingInterval: "MONTHLY", graceDays: 7, isActive: true,
    entitlements: {
      max_users: maxUsers, catalog_enabled: true, inventory_enabled: true, pos_enabled: true,
      customer_ordering_enabled: ordering, messaging_enabled: ordering,
      analytics_enabled: ordering, ai_support_enabled: ai,
    },
  };
}

describe("BusinessRegistrationPage plan comparison", () => {
  beforeEach(() => {
    api.publicSubscriptionPlans.mockReset();
    api.publicSubscriptionPlans.mockResolvedValue([
      plan("BASIC", 0, 2, false, false),
      plan("STANDARD", 19_900, 12, true, false),
      plan("PREMIUM", 39_900, 50, true, true),
    ]);
  });

  it("shows the configured benefits and exclusions for each plan before selection", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><MemoryRouter><BusinessRegistrationPage /></MemoryRouter></QueryClientProvider>);

    const basic = await screen.findByRole("list", { name: "Basic plan features" });
    const standard = screen.getByRole("list", { name: "Standard plan features" });
    const premium = screen.getByRole("list", { name: "Premium plan features" });
    expect(basic).toHaveTextContent("Up to 2 business users (owner included)");
    expect(basic).toHaveTextContent("Customer ordering — not included");
    expect(standard).toHaveTextContent("Up to 12 business users (owner included)");
    expect(standard).toHaveTextContent("Customer ordering");
    expect(standard).toHaveTextContent("AI customer support — not included");
    expect(premium).toHaveTextContent("AI customer support");
    expect(premium).not.toHaveTextContent("AI customer support — not included");

    const standardChoice = screen.getByRole("button", { name: "Choose Standard plan" });
    fireEvent.keyDown(standardChoice, { key: "Enter" });
    expect(standardChoice).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Choose Basic plan" })).toHaveAttribute("aria-pressed", "false");
  });
});
