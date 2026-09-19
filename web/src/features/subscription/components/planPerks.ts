import type { SubscriptionPlan } from "@/shared/types/platform";

const featureLabels = [
  ["catalog_enabled", "Product catalog"],
  ["inventory_enabled", "Inventory and stock tracking"],
  ["pos_enabled", "Point of sale"],
  ["customer_ordering_enabled", "Customer ordering"],
  ["messaging_enabled", "Customer messaging"],
  ["analytics_enabled", "Reports and analytics"],
  ["ai_support_enabled", "AI customer support"],
] as const;

export type PlanPerk = { key: string; label: string; included: boolean };

export function planPerks(plan: SubscriptionPlan): PlanPerk[] {
  const perks: PlanPerk[] = [];
  const maxUsers = plan.entitlements.max_users;
  if (typeof maxUsers === "number" && Number.isFinite(maxUsers)) {
    perks.push({
      key: "max_users",
      label: `Up to ${maxUsers} business ${maxUsers === 1 ? "user" : "users"} (owner included)`,
      included: maxUsers > 0,
    });
  }
  for (const [key, label] of featureLabels) {
    const value = plan.entitlements[key];
    if (typeof value === "boolean") perks.push({ key, label, included: value });
  }

  return perks;
}
