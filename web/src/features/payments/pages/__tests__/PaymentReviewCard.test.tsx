import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { RecordedPayment } from "@/shared/types/payments";
import { PaymentReviewCard } from "../PaymentsPage";

const payment: RecordedPayment = {
  id: "payment-1",
  context: "CUSTOMER_ORDER",
  business: { id: "business-1", name: "Kevins Eleven" },
  orderId: "order-1",
  orderCode: "ORD-1",
  orderStatus: "PENDING",
  billingRecordId: null,
  payer: { id: "customer-1", name: "Customer" },
  method: "MAYA",
  referenceNumber: "REF-1",
  amount: 130,
  currency: "PHP",
  status: "SUBMITTED",
  proofAvailable: false,
  proofMimeType: "image/png",
  duplicateReference: false,
  duplicateProof: false,
  duplicateOfPaymentId: null,
  receiptNumber: null,
  rejectionReason: null,
  submittedAt: "2026-09-13T00:00:00Z",
  reviewedAt: null,
  reviewedBy: null,
  retainedUntil: "2027-09-13T00:00:00Z",
  proofDeletedAt: null,
  reviewHistory: [],
};

describe("PaymentReviewCard", () => {
  it("lets the owner reject a short proof without closing the pending order", () => {
    const onReview = vi.fn();
    render(
      <PaymentReviewCard payment={payment} platform={false} busy={false} onReview={onReview} />,
    );

    expect(screen.getByRole("button", { name: "Verify manually" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));
    expect(onReview).toHaveBeenCalledWith("REJECTED", false);
  });

  it("requires actual wallet confirmation and allows a smaller received amount", () => {
    const onReview = vi.fn();
    render(
      <PaymentReviewCard
        payment={{ ...payment, orderStatus: "PENDING" }}
        platform={false}
        busy={false}
        onReview={onReview}
      />,
    );

    const verify = screen.getByRole("button", { name: "Verify manually" });
    expect(verify).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("spinbutton", { name: /Actual received amount/ }), { target: { value: "30" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(verify);
    expect(onReview).toHaveBeenCalledWith("VERIFIED", true, 3000);
  });

  it("requires explicit receiving-wallet ledger confirmation for an application bill", () => {
    const onReview = vi.fn();
    render(<PaymentReviewCard payment={{ ...payment, context: "SUBSCRIPTION", orderId: null, orderCode: null, orderStatus: null, billingRecordId: "bill-1", subscriptionRequestId: "application-1" }} platform busy={false} onReview={onReview} />);
    const verify = screen.getByRole("button", { name: "Verify manually" });
    expect(verify).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox"));
    expect(verify).toBeEnabled();
    fireEvent.click(verify);
    expect(onReview).toHaveBeenCalledWith("VERIFIED", true, undefined);
  });
});
