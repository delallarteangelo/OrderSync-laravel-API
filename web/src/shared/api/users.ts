import { http } from "./axios";
import type { User } from "@/shared/types/auth";

export type CreateUserPayload = Pick<User, "fullName" | "email" | "role" | "isActive"> & {
  password: string;
};

export async function listUsers(): Promise<User[]> {
  const { data } = await http.get<{ items: User[] }>("/users");
  return data.items;
}

export async function getUser(id: string): Promise<User> {
  const { data } = await http.get<User>(`/users/${id}`);
  return data;
}

export async function createUser(payload: CreateUserPayload): Promise<User> {
  const { data } = await http.post<User>("/users", payload);
  return data;
}

export async function updateUser(id: string, payload: Partial<User>): Promise<User> {
  const { data } = await http.put<User>(`/users/${id}`, payload);
  return data;
}

export async function deactivateUser(id: string): Promise<User> {
  const { data } = await http.post<User>(`/users/${id}/deactivate`);
  return data;
}

export async function resetUserPassword(id: string): Promise<{ tempPassword: string }> {
  const { data } = await http.post<{ tempPassword: string }>(`/users/${id}/reset-password`);
  return data;
}
