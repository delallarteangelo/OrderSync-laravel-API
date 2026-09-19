import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuthStore } from "@/app/stores/authStore";
import type { Order } from "@/shared/types/orders";

const hooks = vi.hoisted(() => ({
  useOrder: vi.fn(),
  useTransitionOrder: vi.fn(),
}));
const payments = vi.hoisted(() => ({
  getBusinessPaymentProof: vi.fn(),
  openPrivatePaymentFile: vi.fn(),
}));

vi.mock("@/shared/hooks/useApi", () => hooks);
vi.mock("@/shared/api/payments", () => payments);

import { OrderDetailPage } from "../OrderDetailPage";

const order: Order = {
  id: "1",
  code: "ORD-1",
  business: { id: "2", name: "Kevins Eleven", slug: "kevins-eleven" },
  customer: { id: "3", name: "Customer", email: "customer@example.com" },
  items: [],
  subtotal: 70,
  total: 70,
  walletPaid: 0,
  counterPaid: 0,
  amountReceived: 0,
  balanceDue: 70,
  refundedAmount: 0,
  financialStatus: "UNPAID",
  balanceCollectionMethod: "CASH_AT_PICKUP",
  fulfillmentMethod: "PICKUP",
  status: "PENDING",
  placedAt: "2026-09-13T00:00:00Z",
  updatedAt: "2026-09-13T00:00:00Z",
  statusHistory: [],
  payments: [
    {
      id: "9",
      context: "CUSTOMER_ORDER",
      business: { id: "2", name: "Kevins Eleven" },
      orderId: "1",
      orderCode: "ORD-1",
      orderStatus: "PENDING",
      billingRecordId: null,
      payer: { id: "3", name: "Customer" },
      method: "GCASH",
      referenceNumber: "GCASH-123",
      amount: 70,
      currency: "PHP",
      status: "SUBMITTED",
      proofAvailable: true,
      proofMimeType: "image/jpeg",
      duplicateReference: false,
      duplicateProof: false,
      duplicateOfPaymentId: null,
      receiptNumber: null,
      rejectionReason: null,
      submittedAt: "2026-09-13T00:01:00Z",
      reviewedAt: null,
      reviewedBy: null,
      retainedUntil: "2027-09-13T00:01:00Z",
      proofDeletedAt: null,
      reviewHistory: [],
    },
  ],
  counterPayments: [],
  refunds: [],
};

describe("OrderDetailPage payment proof", () => {
  beforeEach(() => {
    hooks.useOrder.mockReturnValue({
      data: order,
      isLoading: false,
      refetch: vi.fn(),
    });
    hooks.useTransitionOrder.mockReturnValue({ mutate: vi.fn(), isPending: false });
    payments.getBusinessPaymentProof.mockResolvedValue(new Blob(["image"], { type: "image/jpeg" }));
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:private-proof"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
    useAuthStore.setState({
      user: {
        id: "owner-1",
        email: "owner@example.com",
        fullName: "Owner",
        role: "BUSINESS_OWNER",
        isActive: true,
        createdAt: "2026-09-13T00:00:00Z",
        business: order.business,
        memberships: [],
      },
      accessToken: "test-token",
      bootstrapped: true,
    });
  });

  it("shows an uploaded proof and its review status in the owner order view", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}><MemoryRouter initialEntries={["/orders/1"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter></QueryClientProvider>,
    );

    expect(screen.getByText("Reference: GCASH-123")).toBeInTheDocument();
    expect(screen.getByText("SUBMITTED")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Review payment" })).toHaveAttribute(
      "href",
      "/payments",
    );
    expect(await screen.findByAltText("Customer payment proof")).toHaveAttribute(
      "src",
      "blob:private-proof",
    );
    expect(payments.getBusinessPaymentProof).toHaveBeenCalledWith("9");
  });
});
