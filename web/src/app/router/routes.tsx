import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/layout/AppShell";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { RequireAuth } from "@/app/router/RequireAuth";
import { RequireRole } from "@/app/router/RequireRole";

import { LoginPage } from "@/features/auth/pages/LoginPage";
import { BusinessRegistrationPage } from "@/features/auth/pages/BusinessRegistrationPage";
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage";
import { ProductListPage } from "@/features/catalog/pages/ProductListPage";
import { ProductFormPage } from "@/features/catalog/pages/ProductFormPage";
import { CategoryListPage } from "@/features/catalog/pages/CategoryListPage";
import { InventoryListPage } from "@/features/inventory/pages/InventoryListPage";
import { RestockPage } from "@/features/inventory/pages/RestockPage";
import { MovementLogPage } from "@/features/inventory/pages/MovementLogPage";
import { PosPage } from "@/features/pos/pages/PosPage";
import { OrderListPage } from "@/features/orders/pages/OrderListPage";
import { OrderDetailPage } from "@/features/orders/pages/OrderDetailPage";
import { ChatPage } from "@/features/messaging/pages/ChatPage";
import { SalesReportPage } from "@/features/reports/pages/SalesReportPage";
import { OrdersReportPage } from "@/features/reports/pages/OrdersReportPage";
import { InventoryReportPage } from "@/features/reports/pages/InventoryReportPage";
import { UserListPage } from "@/features/users/pages/UserListPage";
import { UserFormPage } from "@/features/users/pages/UserFormPage";
import { BusinessSettingsPage } from "@/features/settings/pages/BusinessSettingsPage";
import { NotFoundPage } from "@/features/misc/NotFoundPage";
import { ForbiddenPage } from "@/features/misc/ForbiddenPage";
import { PlatformHomePage } from "@/features/platform/pages/PlatformHomePage";

const businessWorkspaceRoles = ["BUSINESS_OWNER", "STAFF", "CASHIER"] as const;

function Wrap({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <Wrap>
        <LoginPage />
      </Wrap>
    ),
  },
  {
    path: "/platform",
    element: (
      <Wrap>
        <RequireAuth>
          <RequireRole allow="SUPER_ADMIN">
            <PlatformHomePage />
          </RequireRole>
        </RequireAuth>
      </Wrap>
    ),
  },
  {
    path: "/register-business",
    element: (
      <Wrap>
        <BusinessRegistrationPage />
      </Wrap>
    ),
  },
  {
    path: "/403",
    element: (
      <Wrap>
        <RequireAuth>
          <ForbiddenPage />
        </RequireAuth>
      </Wrap>
    ),
  },
  {
    path: "/pos",
    element: (
      <Wrap>
        <RequireAuth>
          <RequireRole allow={[...businessWorkspaceRoles]}>
            <PosPage />
          </RequireRole>
        </RequireAuth>
      </Wrap>
    ),
  },
  {
    path: "/",
    element: (
      <Wrap>
        <RequireAuth>
          <RequireRole allow={[...businessWorkspaceRoles]}>
            <AppShell />
          </RequireRole>
        </RequireAuth>
      </Wrap>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },

      { path: "orders", element: <OrderListPage /> },
      { path: "orders/:id", element: <OrderDetailPage /> },

      { path: "inventory", element: <InventoryListPage /> },
      { path: "inventory/restock", element: <RestockPage /> },
      { path: "inventory/movements", element: <MovementLogPage /> },

      { path: "messages", element: <ChatPage /> },
      { path: "messages/:threadId", element: <ChatPage /> },

      // Admin-only
      {
        path: "catalog",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <ProductListPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/new",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/:id/edit",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "categories",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <CategoryListPage />
          </RequireRole>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <Navigate to="/reports/sales" replace />
          </RequireRole>
        ),
      },
      {
        path: "reports/sales",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <SalesReportPage />
          </RequireRole>
        ),
      },
      {
        path: "reports/orders",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <OrdersReportPage />
          </RequireRole>
        ),
      },
      {
        path: "reports/inventory",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <InventoryReportPage />
          </RequireRole>
        ),
      },
      {
        path: "users",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <UserListPage />
          </RequireRole>
        ),
      },
      {
        path: "users/new",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <UserFormPage />
          </RequireRole>
        ),
      },
      {
        path: "users/:id/edit",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <UserFormPage />
          </RequireRole>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <BusinessSettingsPage />
          </RequireRole>
        ),
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
