export type Role = "SUPER_ADMIN" | "BUSINESS_OWNER" | "STAFF" | "CASHIER" | "CUSTOMER";

export type BusinessSummary = {
  id: string;
  name: string;
  slug: string;
};

export type BusinessMembership = {
  businessId: string;
  businessName: string;
  businessSlug: string;
  role: Exclude<Role, "SUPER_ADMIN">;
};

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  avatarUrl?: string;
  business: BusinessSummary | null;
  memberships: BusinessMembership[];
};

export type AuthSession = {
  user: User;
  signedInAt: string;
};
