import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ColumnDef, PaginationState, SortingState } from "@tanstack/react-table";
import { Link } from "react-router-dom";
import { BellRing, Building2, CreditCard, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/stores/authStore";
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
import { DataTable } from "@/shared/components/DataTable";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
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
import type {
  BusinessStatus,
  PlanCode,
  PlatformBusiness,
  PlatformUser,
  SubscriptionPlan,
} from "@/shared/types/platform";
import { listPlatformApplications } from "@/shared/api/subscriptionApplications";
import { TextEntryDialog } from "@/shared/components/TextEntryDialog";

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
      : value === "SUSPENDED" || value === "CANCELLED" || value === "REJECTED"
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
  const [suspensionDialogOpen, setSuspensionDialogOpen] = React.useState(false);
  const finish = async (message: string) => {
    await queryClient.invalidateQueries({ queryKey: ["platform"] });
    toast.success(message);
  };
  const approve = useMutation({
    mutationFn: () => approveBusiness(business.id),
    onSuccess: () => finish("Business approved"),
  });
  const suspend = useMutation({
    mutationFn: (reason: string) => suspendBusiness(business.id, reason),
    onSuccess: () => {
      setSuspensionDialogOpen(false);
      return finish("Business suspended and tenant sessions revoked");
    },
    onError: (error) => toast.error(error.message),
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
      {business.status === "PENDING" && !business.subscription ? (
        <Button size="sm" disabled={busy} onClick={() => approve.mutate()}>
          Review approval
        </Button>
      ) : null}
      {business.status === "ACTIVE" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setSuspensionDialogOpen(true)}
        >
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
      <TextEntryDialog
        open={suspensionDialogOpen}
        onOpenChange={setSuspensionDialogOpen}
        title={`Suspend ${business.name}?`}
        description="Tenant access and active sessions will be revoked until the business is reactivated."
        label="Suspension reason"
        placeholder="Explain why access is being suspended"
        confirmLabel="Suspend business"
        destructive
        multiline
        busy={suspend.isPending}
        onSubmit={(reason) => suspend.mutate(reason)}
      />
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

type PlatformSection = "dashboard" | "businesses" | "plans" | "billing" | "users";

const sectionHeadings: Record<PlatformSection, { title: string; description: string }> = {
  dashboard: {
    title: "Platform dashboard",
    description: "Monitor businesses, subscriptions, billing, and platform health.",
  },
  businesses: {
    title: "Businesses",
    description: "Manage business access, subscription status, and lifecycle actions.",
  },
  plans: {
    title: "Subscription plans",
    description: "Configure plan pricing, limits, and included OrderSync features.",
  },
  billing: {
    title: "Billing",
    description: "Review internal billing records and manually recorded settlements.",
  },
  users: {
    title: "Platform users",
    description: "Review account access and activate or deactivate users.",
  },
};

export function PlatformHomePage({ section = "dashboard" }: { section?: PlatformSection }) {
  const [billingPaymentTarget, setBillingPaymentTarget] = React.useState<string | null>(null);
  const [businessSearch, setBusinessSearch] = React.useState("");
  const [businessStatus, setBusinessStatus] = React.useState<BusinessStatus | "ALL">("ALL");
  const [businessPlan, setBusinessPlan] = React.useState<PlanCode | "UNASSIGNED" | "ALL">("ALL");
  const [businessSorting, setBusinessSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [businessPagination, setBusinessPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [userSearch, setUserSearch] = React.useState("");
  const [userStatus, setUserStatus] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [userAccess, setUserAccess] = React.useState<"ALL" | "SUPER_ADMIN" | "TENANT">("ALL");
  const [userRole, setUserRole] = React.useState<
    "ALL" | "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "CUSTOMER"
  >("ALL");
  const [userSorting, setUserSorting] = React.useState<SortingState>([
    { id: "createdAt", desc: true },
  ]);
  const [userPagination, setUserPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const deferredBusinessSearch = React.useDeferredValue(businessSearch.trim());
  const deferredUserSearch = React.useDeferredValue(userSearch.trim());
  const user = useAuthStore((state) => state.user);
  const dashboard = useQuery({
    queryKey: platformKeys.dashboard,
    queryFn: getPlatformDashboard,
    enabled: section === "dashboard",
  });
  const businesses = useQuery({
    queryKey: [
      ...platformKeys.businesses,
      deferredBusinessSearch,
      businessStatus,
      businessPlan,
      businessSorting,
      businessPagination,
    ],
    queryFn: () => {
      const sort = businessSorting[0];
      return listPlatformBusinesses({
        page: businessPagination.pageIndex + 1,
        perPage: businessPagination.pageSize,
        search: deferredBusinessSearch || undefined,
        status: businessStatus === "ALL" ? undefined : businessStatus,
        planCode: businessPlan === "ALL" ? undefined : businessPlan,
        sort:
          (sort?.id as "name" | "status" | "planCode" | "userCount" | "periodEnd" | "createdAt") ??
          "createdAt",
        direction: sort?.desc === false ? "asc" : "desc",
      });
    },
    placeholderData: (previousData) => previousData,
    enabled: section === "businesses",
  });
  const plans = useQuery({
    queryKey: platformKeys.plans,
    queryFn: listPlans,
    enabled: section === "businesses" || section === "plans",
  });
  const billing = useQuery({
    queryKey: platformKeys.billing,
    queryFn: listBillingRecords,
    enabled: section === "billing",
  });
  const users = useQuery({
    queryKey: [
      ...platformKeys.users,
      deferredUserSearch,
      userStatus,
      userAccess,
      userRole,
      userSorting,
      userPagination,
    ],
    queryFn: () => {
      const sort = userSorting[0];
      return listPlatformUsers({
        page: userPagination.pageIndex + 1,
        perPage: userPagination.pageSize,
        search: deferredUserSearch || undefined,
        isActive: userStatus === "ALL" ? undefined : userStatus === "ACTIVE",
        access: userAccess === "ALL" ? undefined : userAccess,
        membershipRole: userRole === "ALL" ? undefined : userRole,
        sort:
          (sort?.id as
            | "fullName"
            | "email"
            | "access"
            | "membershipsCount"
            | "isActive"
            | "createdAt") ?? "createdAt",
        direction: sort?.desc === false ? "asc" : "desc",
      });
    },
    placeholderData: (previousData) => previousData,
    enabled: section === "users",
  });
  const applications = useQuery({
    queryKey: ["platform", "subscription-applications"],
    queryFn: listPlatformApplications,
    refetchInterval: 30_000,
    enabled: section === "dashboard" || section === "businesses",
  });
  const queryClient = useQueryClient();
  const paid = useMutation({
    mutationFn: ({ id, reference }: { id: string; reference?: string }) =>
      markBillingPaid(id, reference || undefined),
    onSuccess: async () => {
      setBillingPaymentTarget(null);
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

  const pendingUpgradeReviews =
    applications.data?.filter(
      (application) => application.kind === "UPGRADE" && application.status === "PENDING_REVIEW",
    ) ?? [];
  const pendingRegistrationReviews =
    applications.data?.filter(
      (application) => application.kind === "INITIAL" && application.status === "PENDING_REVIEW",
    ) ?? [];
  const submittedPaymentProofs =
    applications.data?.filter((application) => application.status === "PAYMENT_SUBMITTED") ?? [];
  const attentionCount =
    pendingUpgradeReviews.length +
    pendingRegistrationReviews.length +
    submittedPaymentProofs.length;
  const activeRequestByBusiness = new Map(
    (applications.data ?? [])
      .filter(
        (application) =>
          application.kind === "UPGRADE" &&
          ["PENDING_REVIEW", "AWAITING_PAYMENT", "PAYMENT_SUBMITTED"].includes(application.status),
      )
      .map((application) => [application.businessId, application]),
  );
  const businessColumns: ColumnDef<PlatformBusiness>[] = [
    {
      accessorKey: "name",
      header: "Business",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">
            {row.original.owner?.fullName ?? "No owner"} · {row.original.owner?.email ?? "No email"}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <div>
          <StatusBadge value={row.original.status} />
          {row.original.suspensionReason ? (
            <div className="mt-1 max-w-48 text-xs text-muted-foreground">
              {row.original.suspensionReason}
            </div>
          ) : null}
        </div>
      ),
    },
    {
      id: "planCode",
      accessorFn: (business) => business.subscription?.plan.code ?? "",
      header: "Subscription",
      cell: ({ row }) => {
        const business = row.original;
        const activeRequest = activeRequestByBusiness.get(business.id);
        return business.subscription ? (
          <div>
            <div>{business.subscription.plan.name}</div>
            <StatusBadge value={business.subscription.effectiveStatus} />
            {activeRequest ? (
              <Link
                className="mt-2 block text-xs font-medium text-amber-700 underline"
                to="/platform/applications"
              >
                Upgrade requested: {activeRequest.fromPlan?.name} → {activeRequest.desiredPlan.name}
                {" · "}
                {activeRequest.status.replaceAll("_", " ")}
              </Link>
            ) : null}
          </div>
        ) : (
          "Not assigned"
        );
      },
    },
    {
      accessorKey: "userCount",
      header: "Users",
    },
    {
      id: "periodEnd",
      accessorFn: (business) => business.subscription?.currentPeriodEnd ?? "",
      header: "Period ends",
      cell: ({ row }) => shortDate(row.original.subscription?.currentPeriodEnd ?? null),
    },
    {
      accessorKey: "createdAt",
      header: "Registered",
      cell: ({ row }) => shortDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => (
        <BusinessActions business={row.original} plans={plans.data?.plans ?? []} />
      ),
    },
  ];
  const userColumns: ColumnDef<PlatformUser>[] = [
    {
      accessorKey: "fullName",
      header: "User",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.fullName}</div>
          <div className="text-xs text-muted-foreground">{row.original.email}</div>
        </div>
      ),
    },
    {
      id: "access",
      accessorFn: (platformUser) => platformUser.platformRole ?? "TENANT",
      header: "Access",
      cell: ({ row }) => row.original.platformRole?.replaceAll("_", " ") ?? "Tenant user",
    },
    {
      id: "membershipsCount",
      accessorFn: (platformUser) => platformUser.memberships.length,
      header: "Memberships",
      cell: ({ row }) => (
        <div className="max-w-80">
          {row.original.memberships.length ? (
            row.original.memberships.map((membership) => (
              <div key={`${membership.businessId}-${membership.role}`} className="text-sm">
                {membership.businessName}{" "}
                <span className="text-xs text-muted-foreground">
                  ({membership.role.replaceAll("_", " ")})
                </span>
              </div>
            ))
          ) : (
            <span className="text-muted-foreground">No memberships</span>
          )}
        </div>
      ),
    },
    {
      id: "isActive",
      accessorFn: (platformUser) => (platformUser.isActive ? 1 : 0),
      header: "Status",
      cell: ({ row }) => <StatusBadge value={row.original.isActive ? "ACTIVE" : "INACTIVE"} />,
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      cell: ({ row }) => shortDate(row.original.createdAt),
    },
    {
      id: "actions",
      header: "Actions",
      enableSorting: false,
      cell: ({ row }) => {
        const platformUser = row.original;
        return (
          <Button
            size="sm"
            variant="outline"
            disabled={toggleUser.isPending || platformUser.id === user?.id}
            onClick={() =>
              toggleUser.mutate({ id: platformUser.id, active: !platformUser.isActive })
            }
          >
            {platformUser.isActive ? "Deactivate" : "Activate"}
          </Button>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">{sectionHeadings[section].title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{sectionHeadings[section].description}</p>
      </header>

      {section === "dashboard" && (
        <>
          {attentionCount > 0 && (
            <Card className="border-amber-300 bg-amber-50">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="flex items-start gap-3">
                  <div className="rounded-full bg-amber-100 p-2 text-amber-800">
                    <BellRing className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-950">
                      {attentionCount} subscription{" "}
                      {attentionCount === 1 ? "item needs" : "items need"} your attention
                    </p>
                    <p className="text-sm text-amber-900">
                      {pendingUpgradeReviews.length} upgrade{" "}
                      {pendingUpgradeReviews.length === 1 ? "request" : "requests"} awaiting first
                      review · {pendingRegistrationReviews.length} new-business{" "}
                      {pendingRegistrationReviews.length === 1 ? "application" : "applications"}{" "}
                      awaiting review · {submittedPaymentProofs.length} payment{" "}
                      {submittedPaymentProofs.length === 1 ? "proof" : "proofs"} awaiting
                      verification
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/platform/applications">Review subscription requests</Link>
                </Button>
              </CardContent>
            </Card>
          )}
          {applications.isError && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              Subscription request alerts could not be loaded. Open Subscription applications to
              retry.
            </p>
          )}

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
                label="Subscriptions in grace"
                value={dashboard.data.subscriptions.grace}
                icon={<CreditCard className="h-5 w-5" />}
              />
              <KpiCard
                label="Expired subscriptions"
                value={dashboard.data.subscriptions.expired}
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
                label="Paid billing records"
                value={dashboard.data.billing.paidRecords}
                icon={<CreditCard className="h-5 w-5" />}
              />
              <KpiCard
                label="Database health"
                value={dashboard.data.system.database === "ok" ? "Operational" : "Unavailable"}
                icon={<ShieldCheck className="h-5 w-5" />}
              />
            </div>
          ) : null}
        </>
      )}

      {section === "businesses" && (
        <Card>
          <CardHeader>
            <CardTitle>Business lifecycle</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={businessColumns}
              data={businesses.data?.data ?? []}
              isLoading={businesses.isLoading}
              isError={businesses.isError}
              onRetry={() => businesses.refetch()}
              loadingLabel="Loading businesses…"
              emptyTitle="No businesses found"
              emptyDescription="Try a different search or filter."
              sorting={businessSorting}
              onSortingChange={(updater) => {
                setBusinessSorting(updater);
                setBusinessPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              manualSorting
              pagination={businessPagination}
              onPaginationChange={setBusinessPagination}
              manualPagination
              pageCount={businesses.data?.meta.lastPage ?? 1}
              totalRows={businesses.data?.meta.total ?? 0}
              toolbar={
                <>
                  <Input
                    aria-label="Search businesses"
                    placeholder="Search business, owner, email, or slug…"
                    value={businessSearch}
                    onChange={(event) => {
                      setBusinessSearch(event.target.value);
                      setBusinessPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                    className="h-9 w-full sm:max-w-sm"
                  />
                  <Select
                    value={businessStatus}
                    onValueChange={(value) => {
                      setBusinessStatus(value as BusinessStatus | "ALL");
                      setBusinessPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger aria-label="Filter by business status" className="h-9 w-44">
                      <SelectValue placeholder="Business status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="SUSPENDED">Suspended</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={businessPlan}
                    onValueChange={(value) => {
                      setBusinessPlan(value as PlanCode | "UNASSIGNED" | "ALL");
                      setBusinessPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger aria-label="Filter by subscription plan" className="h-9 w-44">
                      <SelectValue placeholder="Subscription plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All plans</SelectItem>
                      <SelectItem value="BASIC">Basic</SelectItem>
                      <SelectItem value="STANDARD">Standard</SelectItem>
                      <SelectItem value="PREMIUM">Premium</SelectItem>
                      <SelectItem value="UNASSIGNED">Not assigned</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </CardContent>
        </Card>
      )}

      {section === "plans" && (
        <div className="grid gap-4 lg:grid-cols-3">
          {plans.isLoading
            ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-96" />)
            : plans.data?.plans.map((plan) => <PlanEditor key={plan.id} plan={plan} />)}
        </div>
      )}

      {section === "billing" && (
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
                        {!record.subscriptionRequestId &&
                        (record.status === "PENDING" || record.status === "OVERDUE") ? (
                          <Button
                            size="sm"
                            disabled={paid.isPending}
                            onClick={() => setBillingPaymentTarget(record.id)}
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
      )}

      {section === "users" && (
        <Card>
          <CardHeader>
            <CardTitle>Platform users</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              columns={userColumns}
              data={users.data?.data ?? []}
              isLoading={users.isLoading}
              isError={users.isError}
              onRetry={() => users.refetch()}
              loadingLabel="Loading platform users…"
              emptyTitle="No users found"
              emptyDescription="Try a different search or filter."
              sorting={userSorting}
              onSortingChange={(updater) => {
                setUserSorting(updater);
                setUserPagination((current) => ({ ...current, pageIndex: 0 }));
              }}
              manualSorting
              pagination={userPagination}
              onPaginationChange={setUserPagination}
              manualPagination
              pageCount={users.data?.meta.lastPage ?? 1}
              totalRows={users.data?.meta.total ?? 0}
              toolbar={
                <>
                  <Input
                    aria-label="Search platform users"
                    placeholder="Search name, email, or business…"
                    value={userSearch}
                    onChange={(event) => {
                      setUserSearch(event.target.value);
                      setUserPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                    className="h-9 w-full sm:max-w-sm"
                  />
                  <Select
                    value={userStatus}
                    onValueChange={(value) => {
                      setUserStatus(value as "ALL" | "ACTIVE" | "INACTIVE");
                      setUserPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger aria-label="Filter by user status" className="h-9 w-40">
                      <SelectValue placeholder="User status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={userAccess}
                    onValueChange={(value) => {
                      setUserAccess(value as "ALL" | "SUPER_ADMIN" | "TENANT");
                      setUserPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger aria-label="Filter by platform access" className="h-9 w-44">
                      <SelectValue placeholder="Platform access" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All access</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                      <SelectItem value="TENANT">Tenant user</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={userRole}
                    onValueChange={(value) => {
                      setUserRole(
                        value as "ALL" | "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "CUSTOMER",
                      );
                      setUserPagination((current) => ({ ...current, pageIndex: 0 }));
                    }}
                  >
                    <SelectTrigger aria-label="Filter by membership role" className="h-9 w-48">
                      <SelectValue placeholder="Membership role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All membership roles</SelectItem>
                      <SelectItem value="BUSINESS_OWNER">Business owner</SelectItem>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="CASHIER">Cashier</SelectItem>
                      <SelectItem value="CUSTOMER">Customer</SelectItem>
                    </SelectContent>
                  </Select>
                </>
              }
            />
          </CardContent>
        </Card>
      )}

      <TextEntryDialog
        open={billingPaymentTarget !== null}
        onOpenChange={(open) => !open && setBillingPaymentTarget(null)}
        title="Mark billing record as paid?"
        description="Use this only for an internal billing record already settled outside OrderSync. The reference is optional."
        label="Internal receipt or reference"
        placeholder="Optional receipt or reference"
        required={false}
        confirmLabel="Mark paid"
        busy={paid.isPending}
        onSubmit={(reference) => {
          if (billingPaymentTarget) paid.mutate({ id: billingPaymentTarget, reference });
        }}
      />
    </div>
  );
}
