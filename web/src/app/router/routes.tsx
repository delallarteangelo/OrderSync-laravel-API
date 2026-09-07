import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppShell } from "@/app/layout/AppShell";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { RequireAuth } from "@/app/router/RequireAuth";
import { RequireRole } from "@/app/router/RequireRole";

import { LoginPage } from "@/features/auth/pages/LoginPage";
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
    path: "/pos",
    element: (
      <Wrap>
        <RequireAuth>
          <PosPage />
        </RequireAuth>
      </Wrap>
    ),
  },
  {
    path: "/",
    element: (
      <Wrap>
        <RequireAuth>
          <AppShell />
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
          <RequireRole allow="ADMIN">
            <ProductListPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/new",
        element: (
          <RequireRole allow="ADMIN">
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/:id/edit",
        element: (
          <RequireRole allow="ADMIN">
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "categories",
        element: (
          <RequireRole allow="ADMIN">
            <CategoryListPage />
          </RequireRole>
        ),
      },
      {
        path: "reports",
        element: (
          <RequireRole allow="ADMIN">
            <Navigate to="/reports/sales" replace />
          </RequireRole>
        ),
      },
      {
        path: "reports/sales",
        element: (
          <RequireRole allow="ADMIN">
            <SalesReportPage />
          </RequireRole>
        ),
      },
      {
        path: "reports/orders",
        element: (
          <RequireRole allow="ADMIN">
            <OrdersReportPage />
          </RequireRole>
        ),
      },
      {
        path: "reports/inventory",
        element: (
          <RequireRole allow="ADMIN">
            <InventoryReportPage />
          </RequireRole>
        ),
      },
      {
        path: "users",
        element: (
          <RequireRole allow="ADMIN">
            <UserListPage />
          </RequireRole>
        ),
      },
      {
        path: "users/new",
        element: (
          <RequireRole allow="ADMIN">
            <UserFormPage />
          </RequireRole>
        ),
      },
      {
        path: "users/:id/edit",
        element: (
          <RequireRole allow="ADMIN">
            <UserFormPage />
          </RequireRole>
        ),
      },
      {
        path: "settings",
        element: (
          <RequireRole allow="ADMIN">
            <BusinessSettingsPage />
          </RequireRole>
        ),
      },

      { path: "403", element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
