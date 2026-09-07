export type Role = "ADMIN" | "CASHIER";

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
};

export type AuthSession = {
  user: User;
  signedInAt: string;
};
