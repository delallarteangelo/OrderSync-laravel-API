import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerBusiness } from "@/shared/api/registration";
import { publicSubscriptionPlans } from "@/shared/api/subscriptionApplications";
import { PlanPerkList } from "@/features/subscription/components/PlanPerkList";
import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { OrderSyncLogo } from "@/shared/components/OrderSyncLogo";

const schema = z
  .object({
    businessName: z.string().trim().min(2, "Business name is required").max(255),
    ownerName: z.string().trim().min(2, "Owner name is required").max(255),
    ownerEmail: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(12, "Use at least 12 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string(),
    planCode: z.enum(["BASIC", "STANDARD", "PREMIUM"]),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function BusinessRegistrationPage() {
  const navigate = useNavigate();
  const plans = useQuery({
    queryKey: ["public", "subscription-plans"],
    queryFn: publicSubscriptionPlans,
  });
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { planCode: "BASIC" },
  });
  const selectedPlan = form.watch("planCode");
  const registration = useMutation({
    mutationFn: (values: Values) =>
      registerBusiness({
        businessName: values.businessName,
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        password: values.password,
        planCode: values.planCode,
        timezone: "Asia/Manila",
      }),
    onSuccess: (result) => {
      sessionStorage.setItem(
        `ordersync-application-${result.application.id}`,
        result.applicationToken,
      );
      navigate(`/business-application/${result.application.id}`);
    },
    onError: (error) => {
      if (isApiError(error) && error.fieldErrors) {
        for (const [field, messages] of Object.entries(error.fieldErrors)) {
          const mapped = field === "ownerEmail" || field === "businessName" ? field : null;
          if (mapped) form.setError(mapped, { message: messages[0] });
        }
      }
    },
  });

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-4 md:p-8">
      <Card className="w-full max-w-6xl">
        <CardHeader>
          <OrderSyncLogo className="mb-2 h-11 w-11" />
          <CardTitle>Register your business</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit((values) => registration.mutate(values))}
            noValidate
          >
            <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
              {(
                ["businessName", "ownerName", "ownerEmail", "password", "confirmPassword"] as const
              ).map((field) => {
                const labels = {
                  businessName: "Business name",
                  ownerName: "Owner name",
                  ownerEmail: "Owner email",
                  password: "Password",
                  confirmPassword: "Confirm password",
                };
                const types = {
                  businessName: "text",
                  ownerName: "text",
                  ownerEmail: "email",
                  password: "password",
                  confirmPassword: "password",
                };
                return (
                  <div
                    key={field}
                    className={`space-y-1.5 ${field === "businessName" ? "md:col-span-2" : ""}`}
                  >
                    <Label htmlFor={field}>{labels[field]}</Label>
                    <Input
                      id={field}
                      type={types[field]}
                      autoComplete={
                        field === "ownerEmail"
                          ? "email"
                          : field.toLowerCase().includes("password")
                            ? "new-password"
                            : undefined
                      }
                      {...form.register(field)}
                    />
                    {form.formState.errors[field] ? (
                      <p className="text-xs text-destructive">
                        {form.formState.errors[field]?.message}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="text-lg font-semibold">Choose a monthly plan</h2>
                <p className="text-sm text-muted-foreground">
                  Compare what each plan includes before you apply.
                </p>
              </div>
              {plans.isLoading && <p className="text-sm text-muted-foreground">Loading plans…</p>}
              {plans.isError && (
                <p className="text-sm text-destructive">
                  Plans could not be loaded. Please try again.
                </p>
              )}
              <div className="grid gap-4 lg:grid-cols-3">
                {(plans.data ?? []).map((plan) => (
                  <div
                    key={plan.id}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selectedPlan === plan.code}
                    aria-label={`Choose ${plan.name} plan`}
                    className={`flex h-full flex-col rounded-xl border p-5 text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selectedPlan === plan.code ? "border-primary bg-primary/5 shadow-sm" : "bg-background"}`}
                    onClick={() => form.setValue("planCode", plan.code, { shouldValidate: true })}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        form.setValue("planCode", plan.code, { shouldValidate: true });
                      }
                    }}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-lg font-semibold">{plan.name}</span>
                      {selectedPlan === plan.code && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Selected
                        </span>
                      )}
                    </span>
                    <span className="mt-3 block text-2xl font-bold">
                      {plan.priceMinor === null
                        ? "Price unavailable"
                        : `₱${(plan.priceMinor / 100).toLocaleString("en-PH")}`}
                      <small className="text-xs font-normal"> / month</small>
                    </span>
                    <span className="my-4 block h-px w-full bg-border" aria-hidden="true" />
                    <PlanPerkList plan={plan} />
                  </div>
                ))}
              </div>
              {form.formState.errors.planCode && (
                <p className="text-xs text-destructive">Choose a plan.</p>
              )}
              <p className="text-xs text-muted-foreground">
                Your business is reviewed first. If the chosen plan has a price, payment
                instructions appear after approval; no payment is due before review.
              </p>
            </div>
            {registration.isError && !isApiError(registration.error) ? (
              <p className="text-sm text-destructive">Unable to submit the application.</p>
            ) : null}
            <Button
              className="w-full"
              type="submit"
              disabled={
                registration.isPending || plans.isLoading || plans.isError || !plans.data?.length
              }
            >
              {registration.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Submit for approval"
              )}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already registered?{" "}
              <Link className="text-primary hover:underline" to="/login">
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
