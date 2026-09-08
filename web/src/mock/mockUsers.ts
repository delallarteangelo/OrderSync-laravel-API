import type { User } from "@/shared/types/auth";

export const mockUsers: User[] = [
  {
    id: "u-super-1",
    email: "superadmin@ordersync.local",
    fullName: "OrderSync Super Admin",
    role: "SUPER_ADMIN",
    isActive: true,
    createdAt: "2024-01-01T08:00:00.000Z",
    business: null,
    memberships: [],
  },
  {
    id: "u-admin-1",
    email: "tonette@minimart.ph",
    fullName: "Tonette Reyes",
    role: "BUSINESS_OWNER",
    isActive: true,
    createdAt: "2024-01-12T08:00:00.000Z",
    business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
    memberships: [
      {
        businessId: "business-tonette",
        businessName: "Tonette's Minimart",
        businessSlug: "tonettes-minimart",
        role: "BUSINESS_OWNER",
      },
    ],
  },
  {
    id: "u-cash-1",
    email: "maria.cashier@minimart.ph",
    fullName: "Maria Santos",
    role: "CASHIER",
    isActive: true,
    createdAt: "2024-03-04T08:00:00.000Z",
    business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
    memberships: [
      {
        businessId: "business-tonette",
        businessName: "Tonette's Minimart",
        businessSlug: "tonettes-minimart",
        role: "CASHIER",
      },
    ],
  },
  {
    id: "u-cash-2",
    email: "juan.cashier@minimart.ph",
    fullName: "Juan dela Cruz",
    role: "CASHIER",
    isActive: true,
    createdAt: "2024-06-21T08:00:00.000Z",
    business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
    memberships: [
      {
        businessId: "business-tonette",
        businessName: "Tonette's Minimart",
        businessSlug: "tonettes-minimart",
        role: "CASHIER",
      },
    ],
  },
  {
    id: "u-cash-3",
    email: "leah.cashier@minimart.ph",
    fullName: "Leah Mendoza",
    role: "CASHIER",
    isActive: false,
    createdAt: "2024-09-15T08:00:00.000Z",
    business: { id: "business-tonette", name: "Tonette's Minimart", slug: "tonettes-minimart" },
    memberships: [
      {
        businessId: "business-tonette",
        businessName: "Tonette's Minimart",
        businessSlug: "tonettes-minimart",
        role: "CASHIER",
      },
    ],
  },
];

export const superAdminUser = mockUsers[0];
export const adminUser = mockUsers[1];
export const cashierUser = mockUsers[2];
