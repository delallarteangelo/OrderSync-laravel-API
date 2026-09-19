import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/app/stores/authStore";
import { useUiStore } from "@/app/stores/uiStore";
import { PlatformShell } from "../PlatformShell";

const apiMocks = vi.hoisted(() => ({
  listPlatformApplications: vi.fn(),
  logout: vi.fn(),
}));

vi.mock("@/shared/api/subscriptionApplications", () => ({
  listPlatformApplications: apiMocks.listPlatformApplications,
}));

vi.mock("@/shared/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/auth")>()),
  logout: apiMocks.logout,
}));

describe("PlatformShell", () => {
  beforeEach(() => {
    apiMocks.listPlatformApplications.mockResolvedValue([]);
    apiMocks.logout.mockResolvedValue(undefined);
    useUiStore.setState({ sidebarCollapsed: false });
    useAuthStore.setState({
      user: {
        id: "platform-admin",
        email: "admin@ordersync.local",
        fullName: "OrderSync Administrator",
        role: "SUPER_ADMIN",
        isActive: true,
        createdAt: "2026-09-17T00:00:00Z",
        business: null,
        memberships: [],
      },
      accessToken: "platform-token",
      bootstrapped: true,
    });
  });

  it("keeps platform destinations in one workspace sidebar and renders the selected page", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/platform/businesses"]}>
          <Routes>
            <Route path="/platform" element={<PlatformShell />}>
              <Route path="businesses" element={<div>Businesses screen</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("complementary", { name: "Platform workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute("href", "/platform");
    expect(screen.getByRole("link", { name: "Businesses" })).toHaveAttribute(
      "href",
      "/platform/businesses",
    );
    expect(screen.getByRole("link", { name: "Applications" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Payment review" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Plans" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Billing" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("Businesses screen")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
