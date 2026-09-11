import { http } from "./axios";
import type { BusinessMembership, User } from "@/shared/types/auth";

export type LoginPayload = { email: string; password: string; businessId?: number };
export type AuthResponse = { accessToken: string; accessExpiresAt: string; user: User };

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/login", payload);
  return data;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

export async function refresh(): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/refresh", null, { _skipRefresh: true });
  return data;
}

export async function me(): Promise<User> {
  const { data } = await http.get<User>("/auth/me");
  return data;
}

export async function listBusinesses(): Promise<BusinessMembership[]> {
  const { data } = await http.get<{ businesses: BusinessMembership[] }>("/auth/businesses");
  return data.businesses;
}

export async function switchBusiness(businessId: number): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/switch-business", { businessId });
  return data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await http.post("/auth/change-password", payload);
}
