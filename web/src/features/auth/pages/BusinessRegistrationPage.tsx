import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Store } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerBusiness } from "@/shared/api/registration";
import { isApiError } from "@/shared/api/errors";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";

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
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

type Values = z.infer<typeof schema>;

export function BusinessRegistrationPage() {
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema) });
  const registration = useMutation({
    mutationFn: (values: Values) =>
      registerBusiness({
        businessName: values.businessName,
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        password: values.password,
        timezone: "Asia/Manila",
      }),
    onSuccess: (business) => setSubmittedName(business.name),
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
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Store className="h-6 w-6" />
          </div>
          <CardTitle>{submittedName ? "Application received" : "Register your business"}</CardTitle>
        </CardHeader>
        <CardContent>
          {submittedName ? (
            <div className="space-y-4">
              <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <p className="text-sm">
                  <strong>{submittedName}</strong> is pending Super Admin approval. Your data is
                  preserved, but sign-in remains disabled until approval.
                </p>
              </div>
              <Button asChild className="w-full">
                <Link to="/login">Return to sign in</Link>
              </Button>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit((values) => registration.mutate(values))}
              noValidate
            >
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
                  <div key={field} className="space-y-1.5">
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
              {registration.isError && !isApiError(registration.error) ? (
                <p className="text-sm text-destructive">Unable to submit the application.</p>
              ) : null}
              <Button className="w-full" type="submit" disabled={registration.isPending}>
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
          )}
        </CardContent>
      </Card>
    </main>
  );
}
