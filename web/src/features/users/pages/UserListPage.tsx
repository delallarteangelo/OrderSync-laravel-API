import * as React from "react";
import { Link } from "react-router-dom";
import { type ColumnDef } from "@tanstack/react-table";
import { Pencil, KeyRound, UserPlus, Power } from "lucide-react";
import { toast } from "sonner";
import type { Role, User } from "@/shared/types/auth";
import { PageHeader } from "@/shared/components/PageHeader";
import { DataTable } from "@/shared/components/DataTable";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  useDeactivateUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from "@/shared/hooks/useApi";
import { isApiError } from "@/shared/api/errors";
import { useAuthStore } from "@/app/stores/authStore";
import { fmtDate } from "@/shared/lib/dates";

export function UserListPage() {
  const users = useUsers().data ?? [];
  const updateM = useUpdateUser();
  const deactivateM = useDeactivateUser();
  const resetM = useResetUserPassword();
  const me = useAuthStore((s) => s.user);
  const [role, setRole] = React.useState<Role | "ALL">("ALL");
  const [status, setStatus] = React.useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  const filtered = React.useMemo(
    () =>
      users.filter(
        (u) =>
          (role === "ALL" || u.role === role) &&
          (status === "ALL" ||
            (status === "ACTIVE" ? u.isActive : !u.isActive)),
      ),
    [users, role, status],
  );

  const columns: ColumnDef<User>[] = React.useMemo(
    () => [
      {
        accessorKey: "fullName",
        header: "Name",
        cell: ({ row }) => (
          <div>
            <p className="text-sm font-medium">{row.original.fullName}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <Badge variant={row.original.role === "BUSINESS_OWNER" ? "info" : "secondary"}>
            {row.original.role}
          </Badge>
        ),
      },
      {
        accessorKey: "isActive",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.isActive ? "success" : "secondary"}>
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{fmtDate(row.original.createdAt)}</span>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const u = row.original;
          const isSelf = me?.id === u.id;
          return (
            <div className="flex items-center justify-end gap-1">
              <Button asChild size="sm" variant="ghost">
                <Link to={`/users/${u.id}/edit`}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />
                  Edit
                </Link>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  resetM.mutate(u.id, {
                    onSuccess: (d) =>
                      toast.success(`Reset for ${u.email}. Temp password: ${d.tempPassword}`),
                    onError: (e) =>
                      toast.error(isApiError(e) ? e.message : "Failed to reset password"),
                  })
                }
              >
                <KeyRound className="mr-1 h-3.5 w-3.5" />
                Reset PW
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={isSelf}
                onClick={() => {
                  if (u.isActive) {
                    deactivateM.mutate(u.id, {
                      onSuccess: () => toast.success(`${u.fullName} deactivated`),
                      onError: (e) =>
                        toast.error(isApiError(e) ? e.message : "Failed to deactivate"),
                    });
                  } else {
                    updateM.mutate(
                      { id: u.id, payload: { isActive: true } },
                      {
                        onSuccess: () => toast.success(`${u.fullName} reactivated`),
                        onError: (e) =>
                          toast.error(isApiError(e) ? e.message : "Failed to reactivate"),
                      },
                    );
                  }
                }}
              >
                <Power className="mr-1 h-3.5 w-3.5" />
                {u.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          );
        },
      },
    ],
    [me?.id, updateM, deactivateM, resetM],
  );

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage admins and cashiers for Tonette's Minimart."
        actions={
          <Button asChild>
            <Link to="/users/new">
              <UserPlus className="mr-1 h-4 w-4" />
              New user
            </Link>
          </Button>
        }
      />
      <DataTable
        columns={columns}
        data={filtered}
        searchKey="fullName"
        searchPlaceholder="Search name…"
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={role} onValueChange={(v) => setRole(v as Role | "ALL")}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All roles</SelectItem>
                <SelectItem value="BUSINESS_OWNER">Business owner</SelectItem>
                <SelectItem value="STAFF">Staff</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="h-9 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />
    </>
  );
}
