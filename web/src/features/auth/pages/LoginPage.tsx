import * as React from "react";
import { useNavigate, useLocation, Navigate, Link } from "react-router-dom";
import { Download, Loader2, ScanBarcode, ShoppingBag, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "@/app/stores/authStore";
import { login as apiLogin } from "@/shared/api/auth";
import { isApiError } from "@/shared/api/errors";
import { env, flags } from "@/shared/config/env";
import type { BusinessMembership } from "@/shared/types/auth";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Separator } from "@/shared/components/ui/separator";
import { OrderSyncLogo } from "@/shared/components/OrderSyncLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  businessId: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const bootstrapped = useAuthStore((s) => s.bootstrapped);
  const setSession = useAuthStore((s) => s.setSession);
  const [businessChoices, setBusinessChoices] = React.useState<BusinessMembership[]>([]);
  const [customerAppDialogOpen, setCustomerAppDialogOpen] = React.useState(false);
  const requestedFrom = (location.state as { from?: string } | null)?.from;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: flags.useMockAuth ? "tonette@minimart.ph" : "",
      password: flags.useMockAuth ? "password" : "",
      businessId: undefined,
    },
  });

  const loginMutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiLogin({
        email: values.email,
        password: values.password,
        businessId: values.businessId ? Number(values.businessId) : undefined,
      }),
    onSuccess: (res) => {
      setSession({ accessToken: res.accessToken, user: res.user });
      toast.success(`Welcome, ${res.user.fullName}`);
      const target =
        res.user.role === "SUPER_ADMIN"
          ? "/platform"
          : res.user.role === "CUSTOMER"
            ? (requestedFrom ?? `/shop/${res.user.business?.slug ?? ""}`)
            : (requestedFrom ?? "/dashboard");
      navigate(target, { replace: true });
    },
    onError: (err) => {
      if (isApiError(err) && err.code === "CUSTOMER_APP_REQUIRED") {
        setBusinessChoices([]);
        setCustomerAppDialogOpen(true);
        return;
      }
      if (isApiError(err) && err.code === "BUSINESS_SELECTION_REQUIRED") {
        const details = err.details as { businesses?: BusinessMembership[] } | undefined;
        const choices = details?.businesses ?? [];
        setBusinessChoices(choices);
        if (choices[0]) form.setValue("businessId", choices[0].businessId);
        toast.info("Select a business to continue.");
        return;
      }
      if (isApiError(err) && err.fieldErrors) {
        for (const [key, msgs] of Object.entries(err.fieldErrors)) {
          form.setError(key as keyof FormValues, { message: msgs[0] });
        }
        return;
      }
      toast.error(isApiError(err) ? err.message : "Sign-in failed");
    },
  });

  if (bootstrapped && user) {
    const target =
      user.role === "SUPER_ADMIN"
        ? "/platform"
        : user.role === "CUSTOMER"
          ? (requestedFrom ?? `/shop/${user.business?.slug ?? ""}`)
          : (requestedFrom ?? "/dashboard");
    return <Navigate to={target} replace />;
  }

  const quickLogin = (email: string) => {
    form.setValue("email", email);
    form.setValue("password", "password");
    loginMutation.mutate({ email, password: "password" });
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden flex-col justify-between bg-primary p-10 text-primary-foreground lg:flex">
        <div className="flex items-center gap-3">
          <OrderSyncLogo className="h-10 w-10" decorative />
          <div>
            <p className="text-lg font-semibold">OrderSync</p>
            <p className="text-xs opacity-80">Business operations platform</p>
          </div>
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-semibold leading-tight">Run your sari-sari like a pro.</h2>
          <p className="text-sm opacity-90">
            Inventory, point-of-sale, orders, and reports — all in one place, built for Filipino
            neighborhood stores.
          </p>
          <div className="grid grid-cols-2 gap-3 pt-2">
            <Card className="border-white/10 bg-white/10 text-primary-foreground">
              <CardContent className="flex items-center gap-3 p-4">
                <ScanBarcode className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Fast POS</p>
                  <p className="text-xs opacity-80">SKU/barcode scan</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-white/10 bg-white/10 text-primary-foreground">
              <CardContent className="flex items-center gap-3 p-4">
                <ShoppingBag className="h-5 w-5" />
                <div>
                  <p className="text-sm font-medium">Orders</p>
                  <p className="text-xs opacity-80">Pickup workflow</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <p className="text-xs opacity-70">
          © {new Date().getFullYear()} OrderSync. Business Management Platform for Micro and Small
          Businesses.
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="lg:hidden">
            <div className="mb-2 flex items-center gap-2">
              <OrderSyncLogo className="h-9 w-9" decorative />
              <p className="font-semibold">OrderSync</p>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your account to continue.
            </p>
          </div>
          <form
            onSubmit={form.handleSubmit((v) => loginMutation.mutate(v))}
            className="space-y-3"
            noValidate
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@minimart.ph"
                autoComplete="email"
                {...form.register("email")}
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            {businessChoices.length > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="businessId">Business</Label>
                <select
                  id="businessId"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  {...form.register("businessId")}
                >
                  {businessChoices.map((membership) => (
                    <option key={membership.businessId} value={membership.businessId}>
                      {membership.businessName} — {membership.role.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-muted-foreground">
                <input type="checkbox" className="h-3.5 w-3.5" defaultChecked />
                Remember me
              </label>
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => toast.info("Contact your administrator to reset your password.")}
              >
                Forgot password?
              </button>
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              New to OrderSync?{" "}
              <Link className="text-primary hover:underline" to="/register-business">
                Register your business
              </Link>
            </p>
          </form>
          {flags.useMockAuth && (
            <>
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
                  Quick demo access
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  type="button"
                  disabled={loginMutation.isPending}
                  onClick={() => quickLogin("tonette@minimart.ph")}
                >
                  Continue as owner
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={loginMutation.isPending}
                  onClick={() => quickLogin("maria.cashier@minimart.ph")}
                >
                  Continue as cashier
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                Mock authentication is enabled for this development session.
              </p>
            </>
          )}
        </div>
      </div>
      <Dialog open={customerAppDialogOpen} onOpenChange={setCustomerAppDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <Smartphone className="h-6 w-6" />
              </div>
              <OrderSyncLogo className="h-12 w-12" decorative />
            </div>
            <DialogTitle>Customers use the OrderSync mobile app</DialogTitle>
            <DialogDescription className="leading-6">
              The web workspace is for business owners and their staff. Customers can browse stores,
              place orders, upload payment proof, and chat with stores through the OrderSync app.
            </DialogDescription>
          </DialogHeader>
          {!env.VITE_CUSTOMER_APP_DOWNLOAD_URL ? (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              The download link will be available here soon.
            </p>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomerAppDialogOpen(false)}>
              Back to sign in
            </Button>
            {env.VITE_CUSTOMER_APP_DOWNLOAD_URL ? (
              <Button asChild>
                <a href={env.VITE_CUSTOMER_APP_DOWNLOAD_URL} target="_blank" rel="noreferrer">
                  <Download className="h-4 w-4" />
                  Download OrderSync app
                </a>
              </Button>
            ) : (
              <Button disabled>
                <Download className="h-4 w-4" />
                Download OrderSync app
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
