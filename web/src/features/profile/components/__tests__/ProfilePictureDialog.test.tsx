import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/app/stores/authStore";
import type { User } from "@/shared/types/auth";
import { ProfilePictureDialog } from "../ProfilePictureDialog";

const apiMocks = vi.hoisted(() => ({ uploadProfilePicture: vi.fn() }));

vi.mock("@/shared/api/auth", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/api/auth")>()),
  uploadProfilePicture: apiMocks.uploadProfilePicture,
}));

const currentUser: User = {
  id: "12",
  email: "mary@example.com",
  fullName: "Mary Aquino",
  role: "CASHIER",
  isActive: true,
  createdAt: "2026-09-17T08:00:00Z",
  business: { id: "1", name: "Kevins Eleven", slug: "kevins-eleven" },
  memberships: [],
};

describe("ProfilePictureDialog", () => {
  beforeEach(() => {
    apiMocks.uploadProfilePicture.mockReset();
    useAuthStore.setState({ user: currentUser, accessToken: "token", bootstrapped: true });
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:profile-preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  it("previews, uploads, and applies the signed-in user's new picture", async () => {
    const updatedUser = { ...currentUser, avatarUrl: "/storage/user-avatars/12/avatar.png" };
    apiMocks.uploadProfilePicture.mockResolvedValue(updatedUser);
    const onOpenChange = vi.fn();
    const user = userEvent.setup();

    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <ProfilePictureDialog open onOpenChange={onOpenChange} />
      </QueryClientProvider>,
    );

    const file = new File(["avatar"], "mary.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Choose profile picture"), file);

    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(screen.getByText("mary.png")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save picture" }));

    await waitFor(() => expect(apiMocks.uploadProfilePicture).toHaveBeenCalledOnce());
    expect(apiMocks.uploadProfilePicture.mock.calls[0]?.[0]).toBe(file);
    expect(useAuthStore.getState().user?.avatarUrl).toBe(updatedUser.avatarUrl);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
