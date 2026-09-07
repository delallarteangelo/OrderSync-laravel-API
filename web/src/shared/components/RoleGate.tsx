import * as React from "react";
import type { Role } from "@/shared/types/auth";
import { useRole } from "@/shared/hooks/useRole";

export interface RoleGateProps {
  allow: Role | Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allow, children, fallback = null }: RoleGateProps) {
  const { role } = useRole();
  const allowed = role ? (Array.isArray(allow) ? allow.includes(role) : allow === role) : false;
  return <>{allowed ? children : fallback}</>;
}
