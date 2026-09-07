import * as React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { PageHeader } from "@/shared/components/PageHeader";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { useCreateUser, useUpdateUser, useUser } from "@/shared/hooks/useApi";
import { isApiError, type FieldErrors } from "@/shared/api/errors";
import { useAuthStore } from "@/app/stores/authStore";
import type { Role } from "@/shared/types/auth";

const schema = z.object({
  fullName: z.string().min(2, "Required"),
  email: z.string().email("Invalid email"),
  role: z.enum(["ADMIN", "CASHIER"]),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export function UserFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const existingQ = useUser(id);
  const existing = existingQ.data;
  const createM = useCreateUser();
  const updateM = useUpdateUser();
  const me = useAuthStore((s) => s.user);
  const isSelf = !!existing && me?.id === existing.id;

  React.useEffect(() => {
    if (existing) {
      form.reset({
        fullName: existing.fullName,
        email: existing.email,
        role: existing.role,
        isActive: existing.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.id]);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: existing
      ? {
          fullName: existing.fullName,
          email: existing.email,
          role: existing.role,
          isActive: existing.isActive,
        }
      : { fullName: "", email: "", role: "CASHIER" as Role, isActive: true },
  });

  const submit = form.handleSubmit((values) => {
    const opts = {
      onSuccess: () => {
        toast.success(existing ? "User updated" : "User created");
        navigate("/users");
      },
      onError: (e: unknown) => {
        if (isApiError(e) && e.fieldErrors) {
          const fe = e.fieldErrors as FieldErrors;
          for (const k of Object.keys(fe)) {
            form.setError(k as keyof FormValues, { message: fe[k][0] });
          }
        } else {
          toast.error(isApiError(e) ? e.message : "Failed to save user");
        }
      },
    };
    if (existing) updateM.mutate({ id: existing.id, payload: values }, opts);
    else createM.mutate(values, opts);
  });
  const saving = createM.isPending || updateM.isPending;

  return (
    <>
      <PageHeader
        title={existing ? `Edit ${existing.fullName}` : "New user"}
        description={existing ? "Update user details and access." : "Add a new admin or cashier."}
        breadcrumbs={
          <nav className="text-xs text-muted-foreground">
            <a href="/users" className="hover:underline">Users</a>
            <span className="mx-1">/</span>
            <span>{existing?.fullName ?? "New"}</span>
          </nav>
        }
      />
      <Form {...form}>
        <form onSubmit={submit} className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
          <Card>
            <CardContent className="space-y-4 p-6">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="CASHIER">Cashier</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 p-6">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <div>
                        <FormLabel>Active</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Inactive users cannot sign in.
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isSelf}
                        />
                      </FormControl>
                    </div>
                    {isSelf && (
                      <p className="text-xs text-amber-600">
                        You cannot deactivate your own account.
                      </p>
                    )}
                  </FormItem>
                )}
              />
              {!existing && (
                <div className="space-y-1.5">
                  <Label>Temporary password</Label>
                  <Input value="TempPass1234" readOnly />
                  <p className="text-xs text-muted-foreground">
                    User will be required to change this on first sign-in.
                  </p>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => navigate("/users")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : existing ? "Save changes" : "Create user"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </Form>
    </>
  );
}
