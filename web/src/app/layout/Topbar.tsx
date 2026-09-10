import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ChevronDown, LogOut, Search, User as UserIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { Label } from "@/shared/components/ui/label";
import { useAuthStore } from "@/app/stores/authStore";
import { relative } from "@/shared/lib/dates";
import { logout as apiLogout, changePassword as apiChangePassword } from "@/shared/api/auth";
import { isApiError } from "@/shared/api/errors";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationPreferences,
  useNotifications,
  useUpdateNotificationPreferences,
} from "@/shared/hooks/useApi";
import type { NotificationPreferences, UserNotification } from "@/shared/types/messaging";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const pwSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z
      .string()
      .min(12, "At least 12 characters")
      .regex(/[A-Za-z]/, "Include a letter")
      .regex(/[0-9]/, "Include a number"),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
type PwForm = z.infer<typeof pwSchema>;

export function Topbar() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);
  const [pwOpen, setPwOpen] = React.useState(false);
  const notifications = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const preferences = useNotificationPreferences();
  const updatePreferences = useUpdateNotificationPreferences();
  const seenNotifications = React.useRef<Set<string> | null>(null);

  React.useEffect(() => {
    if (!notifications.data) return;
    const currentIds = new Set(notifications.data.items.map((item) => item.id));
    if (seenNotifications.current) {
      const fresh = notifications.data.items.find(
        (item) => !item.readAt && !seenNotifications.current!.has(item.id),
      );
      if (fresh) toast.info(fresh.title, { description: fresh.body });
    }
    seenNotifications.current = currentIds;
  }, [notifications.data]);

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSettled: () => {
      clear();
      navigate("/login", { replace: true });
    },
  });

  const pwForm = useForm<PwForm>({
    resolver: zodResolver(pwSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const changePwMutation = useMutation({
    mutationFn: (v: PwForm) =>
      apiChangePassword({ currentPassword: v.currentPassword, newPassword: v.newPassword }),
    onSuccess: () => {
      setPwOpen(false);
      pwForm.reset();
      toast.success("Password updated");
    },
    onError: (err) => {
      if (isApiError(err) && err.fieldErrors) {
        for (const [key, msgs] of Object.entries(err.fieldErrors)) {
          if (key in pwForm.getValues()) {
            pwForm.setError(key as keyof PwForm, { message: msgs[0] });
          }
        }
        return;
      }
      toast.error(isApiError(err) ? err.message : "Could not change password");
    },
  });

  if (!user) return null;

  const openNotification = (notification: UserNotification) => {
    if (!notification.readAt) markRead.mutate(notification.id);
    if (notification.resourceType === "THREAD" && notification.resourceId) {
      navigate(`/messages/${notification.resourceId}`);
    } else if (notification.type === "PAYMENT") {
      navigate("/payments");
    } else if (notification.type === "ORDER") {
      navigate("/orders");
    }
  };

  const togglePreference = (key: keyof NotificationPreferences) => {
    if (!preferences.data) return;
    updatePreferences.mutate({ ...preferences.data, [key]: !preferences.data[key] });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-6 backdrop-blur">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search products, orders, customers…" className="h-9 pl-9" />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {(notifications.data?.unreadCount ?? 0) > 0 && (
                <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-[10px] text-white">
                  {notifications.data!.unreadCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0">
            <div className="border-b px-4 py-3">
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {notifications.data?.unreadCount ?? 0} unread · updates every 5 seconds
              </p>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {(notifications.data?.items ?? []).map((notification) => (
                <button
                  type="button"
                  onClick={() => openNotification(notification)}
                  key={notification.id}
                  className="block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-accent/50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium leading-tight">{notification.title}</p>
                    {!notification.readAt && (
                      <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{notification.body}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {relative(notification.createdAt)}
                  </p>
                </button>
              ))}
              {(notifications.data?.items.length ?? 0) === 0 && (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">
                  No notifications yet.
                </p>
              )}
            </div>
            <div className="space-y-2 border-t p-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">Foreground notifications</span>
                <button type="button" className="text-primary" onClick={() => markAllRead.mutate()}>
                  Mark all read
                </button>
              </div>
              {preferences.data && (
                <div className="flex flex-wrap gap-3 text-muted-foreground">
                  {(
                    [
                      ["messagesEnabled", "Messages"],
                      ["ordersEnabled", "Orders"],
                      ["paymentsEnabled", "Payments"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={preferences.data[key]}
                        disabled={updatePreferences.isPending}
                        onChange={() => togglePreference(key)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initialsOf(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-medium leading-tight">{user.fullName}</p>
                <p className="text-[10px] text-muted-foreground">{user.email}</p>
              </div>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>{user.fullName}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => toast.info("Profile (coming soon)")}>
              <UserIcon className="h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPwOpen(true)}>
              <KeyRound className="h-4 w-4" />
              <span>Change password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <DialogDescription>
              Use at least 12 characters, including a letter and number.
            </DialogDescription>
          </DialogHeader>
          <form
            id="pw-form"
            onSubmit={pwForm.handleSubmit((v) => changePwMutation.mutate(v))}
            className="space-y-3"
            noValidate
          >
            <div className="space-y-1">
              <Label>Current password</Label>
              <Input type="password" {...pwForm.register("currentPassword")} />
              {pwForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">
                  {pwForm.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>New password</Label>
              <Input
                type="password"
                placeholder="At least 12 characters"
                {...pwForm.register("newPassword")}
              />
              {pwForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {pwForm.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Confirm new password</Label>
              <Input type="password" {...pwForm.register("confirmPassword")} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">
                  {pwForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
          </form>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} type="button">
              Cancel
            </Button>
            <Button form="pw-form" type="submit" disabled={changePwMutation.isPending}>
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
