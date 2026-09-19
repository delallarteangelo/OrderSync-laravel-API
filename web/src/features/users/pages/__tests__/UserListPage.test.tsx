import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/app/stores/authStore";

const hooks = vi.hoisted(() => ({
  useUsers: vi.fn(),
  useUpdateUser: vi.fn(),
  useDeactivateUser: vi.fn(),
  useResetUserPassword: vi.fn(),
}));

vi.mock("@/shared/hooks/useApi", () => hooks);

import { UserListPage } from "@/features/users/pages/UserListPage";

describe("UserListPage", () => {
  beforeEach(() => {
    hooks.useUsers.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    hooks.useUpdateUser.mockReturnValue({ mutate: vi.fn() });
    hooks.useDeactivateUser.mockReturnValue({ mutate: vi.fn() });
    hooks.useResetUserPassword.mockReturnValue({ mutate: vi.fn() });
    useAuthStore.setState({
      user: {
        id: "user-kevin",
        email: "kevin@example.com",
        fullName: "Kevin Cruz",
        role: "BUSINESS_OWNER",
        isActive: true,
        createdAt: "2026-09-12T00:00:00Z",
        business: {
          id: "business-kevins-eleven",
          name: "Kevins Eleven",
          slug: "kevins-eleven",
        },
        memberships: [],
      },
      accessToken: "test-token",
      bootstrapped: true,
    });
  });

  it("uses the authenticated business name in the page description", () => {
    render(
      <MemoryRouter>
        <UserListPage />
      </MemoryRouter>,
    );

    expect(screen.getByText("Manage admins and cashiers for Kevins Eleven.")).toBeInTheDocument();
    expect(screen.queryByText(/Tonette's Minimart/i)).not.toBeInTheDocument();
  });
});
