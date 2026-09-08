import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, CreditCard, LogOut, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
import { logout as apiLogout } from "@/shared/api/auth";
import {
  approveBusiness,
  assignSubscription,
  cancelSubscription,
  createBillingRecord,
  getPlatformDashboard,
  grantSubscriptionGrace,
  listBillingRecords,
  listPlans,
  listPlatformBusinesses,
  listPlatformUsers,
  markBillingPaid,
  reactivateBusiness,
  renewSubscription,
  setPlatformUserActive,
  suspendBusiness,
  updatePlan,
} from "@/shared/api/platform";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Switch } from "@/shared/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import type { PlatformBusiness, SubscriptionPlan } from "@/shared/types/platform";

const platformKeys = {
  dashboard: ["platform", "dashboard"] as const,
  businesses: ["platform", "businesses"] as const,
  plans: ["platform", "plans"] as const,
  billing: ["platform", "billing"] as const,
  users: ["platform", "users"] as const,
};

function money(amountMinor: number | null) {
  if (amountMinor === null) return "Not configured";
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(
    amountMinor / 100,
  );
}

function shortDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value))
    : "—";
}

function KpiCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-5">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-semibold">{value}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-primary">{icon}</div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ value }: { value: string }) {
  const style =
    value === "ACTIVE" || value === "PAID"
      ? "bg-emerald-100 text-emerald-800"
      : value === "SUSPENDED" || value === "CANCELLED"
        ? "bg-red-100 text-red-800"
        : "bg-amber-100 text-amber-800";
  return <Badge className={style}>{value}</Badge>;
}

function BusinessActions({
  business,
  plans,
}: {
  business: PlatformBusiness;
  plans: SubscriptionPlan[];
}) {
  const queryClient = useQueryClient();
  const [planCode, setPlanCode] = React.useState<string>(
    business.subscription?.plan.code ?? "BASIC",
  );
  const finish = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: ["platform"] });
    toast.success(message);
  };
  const approve = useMutation({
    mutationFn: () => approveBusiness(business.id),
    onSuccess: () => finish("Business approved"),
  });
  const suspend = useMutation({
    mutationFn: () => {
      const reason = window.prompt("Reason for suspension");
      if (!reason) throw new Error("Suspension cancelled");
      return suspendBusiness(business.id, reason);
    },
    onSuccess: () => finish("Business suspended and tenant sessions revoked"),
    onError: (error) => error.message !== "Suspension cancelled" && toast.error(error.message),
  });
  const reactivate = useMutation({
    mutationFn: () => reactivateBusiness(business.id),
    onSuccess: () => finish("Business reactivated"),
  });
  const assign = useMutation({
    mutationFn: () => assignSubscription(business.id, planCode),
    onSuccess: () => finish("Subscription updated"),
  });
  const renew = useMutation({
    mutationFn: () => renewSubscription(business.subscription!.id),
    onSuccess: () => finish("Subscription renewed for one month"),
  });
  const grace = useMutation({
    mutationFn: () =>
      grantSubscriptionGrace(business.subscription!.id, business.subscription!.plan.graceDays),
    onSuccess: () => finish("Grace period granted"),
  });
  const cancel = useMutation({
    mutationFn: () => cancelSubscription(business.subscription!.id),
    onSuccess: () => finish("Subscription cancelled"),
  });
  const busy =
    approve.isPending ||
    suspend.isPending ||
    reactivate.isPending ||
    assign.isPending ||
    renew.isPending ||
    grace.isPending ||
    cancel.isPending;

  return (
    <div className="flex min-w-64 flex-wrap justify-end gap-2">
      {business.status === "PENDING" ? (
        <Button size="sm" disabled={busy} onClick={() => approve.mutate()}>
          Approve
        </Button>
      ) : null}
      {business.status === "ACTIVE" ? (
        <Button size="sm" variant="outline" disabled={busy} onClick={() => suspend.mutate()}>
          Suspend
        </Button>
      ) : null}
      {business.status === "SUSPENDED" ? (
        <Button size="sm" disabled={busy} onClick={() => reactivate.mutate()}>
          Reactivate
        </Button>
      ) : null}
      {business.status === "ACTIVE" ? (
        <>
          <select
            className="h-9 rounded-md border bg-background px-2 text-sm"
            value={planCode}
            onChange={(event) => setPlanCode(event.target.value)}
            aria-label={`Plan for ${business.name}`}
          >
            {plans
              .filter((plan) => plan.isActive)
              .map((plan) => (
                <option key={plan.id} value={plan.code}>
                  {plan.name}
                </option>
              ))}
          </select>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => assign.mutate()}>
            Apply plan
          </Button>
        </>
      ) : null}
      {business.subscription ? (
        <>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => renew.mutate()}>
            Renew
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={busy || business.subscription.effectiveStatus === "CANCELLED"}
            onClick={() => grace.mutate()}
          >
            Grace
          </Button>
          <Button
            size="sm"
            variant="ghost"
            disabled={busy || business.subscription.effectiveStatus === "CANCELLED"}
            onClick={() => cancel.mutate()}
          >
            Cancel
          </Button>
          <BillingDialog business={business} />
        </>
      ) : null}
    </div>
  );
}

function BillingDialog({ business }: { business: PlatformBusiness }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [amount, setAmount] = React.useState("");
  const [dueAt, setDueAt] = React.useState("");
  const create = useMutation({
    mutationFn: () => {
      const periodStart = new Date();
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      return createBillingRecord(business.subscription!.id, {
        amountMinor: Math.round(Number(amount) * 100),
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        dueAt: new Date(`${dueAt}T23:59:59`).toISOString(),
      });
    },
    onSuccess: async () => {
      setOpen(false);
      setAmount("");
      setDueAt("");
      await queryClient.invalidateQueries({ queryKey: ["platform"] });
      toast.success("Internal billing record created");
    },
    onError: (error) => toast.error(error.message),
  });
  const valid = Number(amount) >= 0 && amount !== "" && dueAt !== "";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          Add bill
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New billing record for {business.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor={`amount-${business.id}`}>Amount (PHP)</Label>
            <Input
              id={`amount-${business.id}`}
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`due-${business.id}`}>Due date</Label>
            <Input
              id={`due-${business.id}`}
              type="date"
              value={dueAt}
              onChange={(event) => setDueAt(event.target.value)}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            This is an internal manual record. It does not contact a payment provider.
          </p>
        </div>
        <DialogFooter>
          <Button disabled={!valid || create.isPending} onClick={() => create.mutate()}>
            Create record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PlanEditor({ plan }: { plan: SubscriptionPlan }) {
  const queryClient = useQueryClient();
  const [price, setPrice] = React.useState(
    plan.priceMinor === null ? "" : String(plan.priceMinor / 100),
  );
  const [graceDays, setGraceDays] = React.useState(String(plan.graceDays));
  const [active, setActive] = React.useState(plan.isActive);
  const [entitlements, setEntitlements] = React.useState(plan.entitlements);
  React.useEffect(() => {
    setPrice(plan.priceMinor === null ? "" : String(plan.priceMinor / 100));
    setGraceDays(String(plan.graceDays));
    setActive(plan.isActive);
    setEntitlements(plan.entitlements);
  }, [plan]);
  const save = useMutation({
    mutationFn: () =>
      updatePlan(plan.id, {
        priceMinor: price === "" ? null : Math.round(Number(price) * 100),
        graceDays: Number(graceDays),
        isActive: active,
        entitlements,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform"] });
      toast.success(`${plan.name} plan updated`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span>{plan.name}</span>
          <Badge variant="outline">{plan.code}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`price-${plan.id}`}>Monthly price (PHP)</Label>
            <Input
              id={`price-${plan.id}`}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="Not configured"
            />
          </div>
          <div>
            <Label htmlFor={`grace-${plan.id}`}>Grace days</Label>
            <Input
              id={`grace-${plan.id}`}
              type="number"
              min="0"
              max="90"
              value={graceDays}
              onChange={(event) => setGraceDays(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          {Object.entries(entitlements).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm"
            >
              <span>{key.replaceAll("_", " ")}</span>
              {typeof value === "boolean" ? (
                <Switch
                  checked={value}
                  onCheckedChange={(checked) =>
                    setEntitlements((current) => ({ ...current, [key]: checked }))
                  }
                />
              ) : (
                <Input
                  className="h-8 w-24"
                  type={typeof value === "number" ? "number" : "text"}
                  min={0}
                  value={String(value)}
                  onChange={(event) =>
                    setEntitlements((current) => ({
                      ...current,
                      [key]:
                        typeof value === "number" ? Number(event.target.value) : event.target.value,
                    }))
                  }
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <Label>Available for assignment</Label>
          <Switch checked={active} disabled={plan.code === "BASIC"} onCheckedChange={setActive} />
        </div>
        <Button className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>
          Save plan
        </Button>
      </CardContent>
    </Card>
  );
}

export function PlatformHomePage() {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);
  const dashboard = useQuery({ queryKey: platformKeys.dashboard, queryFn: getPlatformDashboard });
  const businesses = useQuery({
    queryKey: platformKeys.businesses,
    queryFn: listPlatformBusinesses,
  });
  const plans = useQuery({ queryKey: platformKeys.plans, queryFn: listPlans });
  const billing = useQuery({ queryKey: platformKeys.billing, queryFn: listBillingRecords });
  const users = useQuery({ queryKey: platformKeys.users, queryFn: listPlatformUsers });
  const queryClient = useQueryClient();
  const paid = useMutation({
    mutationFn: (id: string) =>
      markBillingPaid(id, window.prompt("Internal receipt/reference (optional)") ?? undefined),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["platform"] });
      toast.success("Billing record marked paid");
    },
    onError: (error) => toast.error(error.message),
  });
  const toggleUser = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      setPlatformUserActive(id, active),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: platformKeys.users });
      toast.success("User status updated");
    },
    onError: (error) => toast.error(error.message),
  });

  const signOut = async () => {
    try {
      await apiLogout();
    } finally {
      clear();
      window.location.assign("/login");
    }
  };

  return (
    <main className="min-h-screen bg-muted/30 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">OrderSync platform</h1>
              <p className="text-sm text-muted-foreground">Signed in as {user?.fullName}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => void signOut()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </header>

        {dashboard.isLoading ? (
          <div className="grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        ) : dashboard.isError ? (
          <Card>
            <CardContent className="p-5 text-sm text-destructive">
              Unable to load platform metrics.
            </CardContent>
          </Card>
        ) : dashboard.data ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <KpiCard
              label="Registered businesses"
              value={dashboard.data.businesses.total}
              icon={<Building2 className="h-5 w-5" />}
            />
            <KpiCard
              label="Pending approvals"
              value={dashboard.data.businesses.pending}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
            <KpiCard
              label="Active subscriptions"
              value={dashboard.data.subscriptions.active}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <KpiCard
              label="Platform users"
              value={dashboard.data.users.total}
              icon={<Users className="h-5 w-5" />}
            />
            <KpiCard
              label="Recorded revenue"
              value={money(dashboard.data.billing.paidAmountMinor)}
              icon={<CreditCard className="h-5 w-5" />}
            />
            <KpiCard
              label="Database health"
              value={dashboard.data.system.database === "ok" ? "Operational" : "Unavailable"}
              icon={<ShieldCheck className="h-5 w-5" />}
            />
          </div>
        ) : null}

        <Tabs defaultValue="businesses">
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="businesses">Businesses</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
          </TabsList>
          <TabsContent value="businesses">
            <Card>
              <CardHeader>
                <CardTitle>Business lifecycle</CardTitle>
              </CardHeader>
              <CardContent>
                {businesses.isLoading ? (
                  <Skeleton className="h-48" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Period ends</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {businesses.data?.data.map((business) => (
                        <TableRow key={business.id}>
                          <TableCell>
                            <div className="font-medium">{business.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {business.owner?.email ?? "No owner"} · {business.userCount} users
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={business.status} />
                            {business.suspensionReason ? (
                              <div className="mt-1 max-w-48 text-xs text-muted-foreground">
                                {business.suspensionReason}
                              </div>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {business.subscription ? (
                              <>
                                <div>{business.subscription.plan.name}</div>
                                <StatusBadge value={business.subscription.effectiveStatus} />
                              </>
                            ) : (
                              "Not assigned"
                            )}
                          </TableCell>
                          <TableCell>
                            {shortDate(business.subscription?.currentPeriodEnd ?? null)}
                          </TableCell>
                          <TableCell>
                            <BusinessActions business={business} plans={plans.data?.plans ?? []} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="plans">
            <div className="grid gap-4 lg:grid-cols-3">
              {plans.isLoading
                ? Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-96" />
                  ))
                : plans.data?.plans.map((plan) => <PlanEditor key={plan.id} plan={plan} />)}
            </div>
          </TabsContent>
          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Internal billing records</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-muted-foreground">
                  These records are entered and verified manually. No external payment provider is
                  connected.
                </p>
                {billing.isLoading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Business</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billing.data?.data.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{record.businessName}</TableCell>
                          <TableCell>{money(record.amountMinor)}</TableCell>
                          <TableCell>{shortDate(record.dueAt)}</TableCell>
                          <TableCell>
                            <StatusBadge value={record.status} />
                          </TableCell>
                          <TableCell>{record.reference ?? "—"}</TableCell>
                          <TableCell>
                            {record.status === "PENDING" || record.status === "OVERDUE" ? (
                              <Button
                                size="sm"
                                disabled={paid.isPending}
                                onClick={() => paid.mutate(record.id)}
                              >
                                Mark paid
                              </Button>
                            ) : null}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Platform users</CardTitle>
              </CardHeader>
              <CardContent>
                {users.isLoading ? (
                  <Skeleton className="h-40" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Access</TableHead>
                        <TableHead>Memberships</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.data?.data.map((platformUser) => (
                        <TableRow key={platformUser.id}>
                          <TableCell>
                            <div className="font-medium">{platformUser.fullName}</div>
                            <div className="text-xs text-muted-foreground">
                              {platformUser.email}
                            </div>
                          </TableCell>
                          <TableCell>{platformUser.platformRole ?? "Tenant user"}</TableCell>
                          <TableCell>
                            {platformUser.memberships
                              .map((membership) => membership.businessName)
                              .join(", ") || "—"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge value={platformUser.isActive ? "ACTIVE" : "INACTIVE"} />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={toggleUser.isPending || platformUser.id === user?.id}
                              onClick={() =>
                                toggleUser.mutate({
                                  id: platformUser.id,
                                  active: !platformUser.isActive,
                                })
                              }
                            >
                              {platformUser.isActive ? "Deactivate" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
