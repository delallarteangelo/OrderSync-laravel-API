import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAuthStore } from "@/app/stores/authStore";
import { ApiError } from "@/shared/api/errors";

const api = vi.hoisted(() => ({ login: vi.fn() }));

vi.mock("@/shared/api/auth", () => ({ login: api.login }));

import { LoginPage } from "../LoginPage";

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("LoginPage customer app handoff", () => {
  beforeEach(() => {
    api.login.mockReset();
    useAuthStore.setState({ user: null, accessToken: null, bootstrapped: true });
  });

  it("shows the mobile app dialog without creating a web session for a customer", async () => {
    const user = userEvent.setup();
    api.login.mockRejectedValue(
      new ApiError("Customer accounts must sign in through the OrderSync mobile app.", {
        code: "CUSTOMER_APP_REQUIRED",
        status: 403,
      }),
    );
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "customer@ordersync.local");
    await user.type(screen.getByLabelText("Password"), "password");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(
      await screen.findByRole("heading", { name: "Customers use the OrderSync mobile app" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/browse stores, place orders, upload payment proof/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Download OrderSync app" })).toHaveAttribute(
      "href",
      "https://drive.google.com/drive/folders/17TPLZ_aRmWRUHwwieGjS32HH9BreBA4y?usp=sharing",
    );
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});
