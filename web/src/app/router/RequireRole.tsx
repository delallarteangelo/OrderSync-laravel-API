import * as React from "react";
import { Navigate } from "react-router-dom";
import type { Role } from "@/shared/types/auth";
import { useAuthStore } from "@/app/stores/authStore";

export function RequireRole({
  allow,
  children,
}: {
  allow: Role | Role[];
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  const allowed = Array.isArray(allow) ? allow.includes(user.role) : allow === user.role;
  if (!allowed) return <Navigate to="/403" replace />;
  return <>{children}</>;
}
