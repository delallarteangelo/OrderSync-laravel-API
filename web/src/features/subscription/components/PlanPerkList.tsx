import { Check, Minus } from "lucide-react";
import type { SubscriptionPlan } from "@/shared/types/platform";
import { planPerks } from "./planPerks";

export function PlanPerkList({ plan }: { plan: SubscriptionPlan }) {
  return (
    <ul className="space-y-2.5" aria-label={`${plan.name} plan features`}>
      {planPerks(plan).map((perk) => (
        <li key={perk.key} className={`flex items-start gap-2 text-sm ${perk.included ? "text-foreground" : "text-muted-foreground"}`}>
          {perk.included ? (
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
          ) : (
            <Minus className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          )}
          <span>{perk.label}{!perk.included && " — not included"}</span>
        </li>
      ))}
    </ul>
  );
}
