import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/errors";
import { useAuthStore } from "@/app/stores/authStore";

const hooks = vi.hoisted(() => ({
  useSettings: vi.fn(),
  useUpdateSettings: vi.fn(),
}));
vi.mock("@/shared/hooks/useApi", () => hooks);

import { BusinessSettingsPage } from "@/features/settings/pages/BusinessSettingsPage";

describe("BusinessSettingsPage", () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        fullName: "Owner",
        role: "BUSINESS_OWNER",
        isActive: true,
        createdAt: "2026-09-13T00:00:00Z",
        business: { id: "business-1", name: "Kevins Eleven", slug: "kevins-eleven" },
        memberships: [],
      },
      accessToken: "test-token",
    });
    hooks.useUpdateSettings.mockReturnValue({ mutate: vi.fn(), isPending: false });
  });

  it("shows a retryable error instead of permanent loading when settings fail", () => {
    hooks.useSettings.mockReturnValue({
      data: undefined,
      isError: true,
      error: new ApiError("Settings are unavailable", { status: 500 }),
      refetch: vi.fn(),
    });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <BusinessSettingsPage />
      </QueryClientProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Settings are unavailable");
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });
});
