import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "@/app/providers/AuthProvider";
import { RequireAuth } from "@/app/router/RequireAuth";
import { RequireRole } from "@/app/router/RequireRole";
import { LoadingState } from "@/shared/components/LoadingState";
import { RouteErrorState } from "@/shared/components/RouteErrorState";

const AppShell = React.lazy(() =>
  import("@/app/layout/AppShell").then(({ AppShell }) => ({ default: AppShell })),
);
const PlatformShell = React.lazy(() =>
  import("@/app/layout/PlatformShell").then(({ PlatformShell }) => ({ default: PlatformShell })),
);
const LoginPage = React.lazy(() =>
  import("@/features/auth/pages/LoginPage").then(({ LoginPage }) => ({ default: LoginPage })),
);
const BusinessRegistrationPage = React.lazy(() =>
  import("@/features/auth/pages/BusinessRegistrationPage").then(({ BusinessRegistrationPage }) => ({
    default: BusinessRegistrationPage,
  })),
);
const BusinessApplicationPage = React.lazy(() =>
  import("@/features/auth/pages/BusinessApplicationPage").then(({ BusinessApplicationPage }) => ({
    default: BusinessApplicationPage,
  })),
);
const SubscriptionPage = React.lazy(() =>
  import("@/features/subscription/pages/SubscriptionPage").then(({ SubscriptionPage }) => ({
    default: SubscriptionPage,
  })),
);
const PlatformApplicationsPage = React.lazy(() =>
  import("@/features/platform/pages/PlatformApplicationsPage").then(
    ({ PlatformApplicationsPage }) => ({ default: PlatformApplicationsPage }),
  ),
);
const DashboardPage = React.lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then(({ DashboardPage }) => ({
    default: DashboardPage,
  })),
);
const ProductListPage = React.lazy(() =>
  import("@/features/catalog/pages/ProductListPage").then(({ ProductListPage }) => ({
    default: ProductListPage,
  })),
);
const ProductFormPage = React.lazy(() =>
  import("@/features/catalog/pages/ProductFormPage").then(({ ProductFormPage }) => ({
    default: ProductFormPage,
  })),
);
const CategoryListPage = React.lazy(() =>
  import("@/features/catalog/pages/CategoryListPage").then(({ CategoryListPage }) => ({
    default: CategoryListPage,
  })),
);
const InventoryListPage = React.lazy(() =>
  import("@/features/inventory/pages/InventoryListPage").then(({ InventoryListPage }) => ({
    default: InventoryListPage,
  })),
);
const RestockPage = React.lazy(() =>
  import("@/features/inventory/pages/RestockPage").then(({ RestockPage }) => ({
    default: RestockPage,
  })),
);
const MovementLogPage = React.lazy(() =>
  import("@/features/inventory/pages/MovementLogPage").then(({ MovementLogPage }) => ({
    default: MovementLogPage,
  })),
);
const PosPage = React.lazy(() =>
  import("@/features/pos/pages/PosPage").then(({ PosPage }) => ({ default: PosPage })),
);
const PosHistoryPage = React.lazy(() =>
  import("@/features/pos/pages/PosHistoryPage").then(({ PosHistoryPage }) => ({
    default: PosHistoryPage,
  })),
);
const OrderListPage = React.lazy(() =>
  import("@/features/orders/pages/OrderListPage").then(({ OrderListPage }) => ({
    default: OrderListPage,
  })),
);
const OrderDetailPage = React.lazy(() =>
  import("@/features/orders/pages/OrderDetailPage").then(({ OrderDetailPage }) => ({
    default: OrderDetailPage,
  })),
);
const ChatPage = React.lazy(() =>
  import("@/features/messaging/pages/ChatPage").then(({ ChatPage }) => ({ default: ChatPage })),
);
const SalesReportPage = React.lazy(() =>
  import("@/features/reports/pages/SalesReportPage").then(({ SalesReportPage }) => ({
    default: SalesReportPage,
  })),
);
const OrdersReportPage = React.lazy(() =>
  import("@/features/reports/pages/OrdersReportPage").then(({ OrdersReportPage }) => ({
    default: OrdersReportPage,
  })),
);
const InventoryReportPage = React.lazy(() =>
  import("@/features/reports/pages/InventoryReportPage").then(({ InventoryReportPage }) => ({
    default: InventoryReportPage,
  })),
);
const UserListPage = React.lazy(() =>
  import("@/features/users/pages/UserListPage").then(({ UserListPage }) => ({
    default: UserListPage,
  })),
);
const UserFormPage = React.lazy(() =>
  import("@/features/users/pages/UserFormPage").then(({ UserFormPage }) => ({
    default: UserFormPage,
  })),
);
const BusinessSettingsPage = React.lazy(() =>
  import("@/features/settings/pages/BusinessSettingsPage").then(({ BusinessSettingsPage }) => ({
    default: BusinessSettingsPage,
  })),
);
const NotFoundPage = React.lazy(() =>
  import("@/features/misc/NotFoundPage").then(({ NotFoundPage }) => ({
    default: NotFoundPage,
  })),
);
const ForbiddenPage = React.lazy(() =>
  import("@/features/misc/ForbiddenPage").then(({ ForbiddenPage }) => ({
    default: ForbiddenPage,
  })),
);
const PlatformHomePage = React.lazy(() =>
  import("@/features/platform/pages/PlatformHomePage").then(({ PlatformHomePage }) => ({
    default: PlatformHomePage,
  })),
);
const StorefrontPage = React.lazy(() =>
  import("@/features/storefront/pages/StorefrontPage").then(({ StorefrontPage }) => ({
    default: StorefrontPage,
  })),
);
const PaymentsPage = React.lazy(() =>
  import("@/features/payments/pages/PaymentsPage").then(({ PaymentsPage }) => ({
    default: PaymentsPage,
  })),
);
const AiSupportPage = React.lazy(() =>
  import("@/features/ai-support/pages/AiSupportPage").then(({ AiSupportPage }) => ({
    default: AiSupportPage,
  })),
);

const businessWorkspaceRoles = ["BUSINESS_OWNER", "STAFF", "CASHIER"] as const;
const inventoryManagerRoles = ["BUSINESS_OWNER", "STAFF"] as const;

function Wrap({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <React.Suspense
        fallback={
          <main className="flex min-h-screen items-center justify-center p-6">
            <LoadingState label="Loading OrderSync…" className="w-full max-w-lg" />
          </main>
        }
      >
        {children}
      </React.Suspense>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/shop/:slug?",
    errorElement: <RouteErrorState />,
    element: (
      <Wrap>
        <StorefrontPage />
      </Wrap>
    ),
  },
  {
    path: "/login",
    errorElement: <RouteErrorState />,
    element: (
      <Wrap>
        <LoginPage />
      </Wrap>
    ),
  },
  {
    path: "/platform",
    errorElement: <RouteErrorState />,
    element: (
      <Wrap>
        <RequireAuth>
          <RequireRole allow="SUPER_ADMIN">
            <PlatformShell />
          </RequireRole>
        </RequireAuth>
      </Wrap>
    ),
    children: [
      { index: true, element: <PlatformHomePage section="dashboard" /> },
      { path: "businesses", element: <PlatformHomePage section="businesses" /> },
      { path: "applications", element: <PlatformApplicationsPage /> },
      { path: "payments", element: <PaymentsPage /> },
      { path: "plans", element: <PlatformHomePage section="plans" /> },
      { path: "billing", element: <PlatformHomePage section="billing" /> },
      { path: "users", element: <PlatformHomePage section="users" /> },
    ],
  },
  {
    path: "/register-business",
    errorElement: <RouteErrorState />,
    element: (
      <Wrap>
        <BusinessRegistrationPage />
      </Wrap>
    ),
  },
  {
    path: "/business-application/:id",
    errorElement: <RouteErrorState />,
    element: (
      <Wrap>
        <BusinessApplicationPage />
      </Wrap>
    ),
  },
  {
    path: "/403",
    errorElement: <RouteErrorState />,
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
    errorElement: <RouteErrorState />,
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
    errorElement: <RouteErrorState />,
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
      {
        path: "payments",
        element: (
          <RequireRole allow={[...inventoryManagerRoles]}>
            <PaymentsPage />
          </RequireRole>
        ),
      },

      { path: "inventory", element: <InventoryListPage /> },
      {
        path: "inventory/restock",
        element: (
          <RequireRole allow={[...inventoryManagerRoles]}>
            <RestockPage />
          </RequireRole>
        ),
      },
      { path: "inventory/movements", element: <MovementLogPage /> },
      { path: "pos/history", element: <PosHistoryPage /> },

      { path: "messages", element: <ChatPage /> },
      { path: "messages/:threadId", element: <ChatPage /> },

      {
        path: "catalog",
        element: (
          <RequireRole allow={[...businessWorkspaceRoles]}>
            <ProductListPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/new",
        element: (
          <RequireRole allow={[...inventoryManagerRoles]}>
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "catalog/:id/edit",
        element: (
          <RequireRole allow={[...inventoryManagerRoles]}>
            <ProductFormPage />
          </RequireRole>
        ),
      },
      {
        path: "categories",
        element: (
          <RequireRole allow={[...inventoryManagerRoles]}>
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
        path: "ai-support",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <AiSupportPage />
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
      {
        path: "subscription",
        element: (
          <RequireRole allow="BUSINESS_OWNER">
            <SubscriptionPage />
          </RequireRole>
        ),
      },

      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
