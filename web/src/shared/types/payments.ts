import type { OrderStatus } from "./orders";

export type WalletMethod = "GCASH" | "MAYA";
export type RecordedPaymentStatus = "SUBMITTED" | "VERIFIED" | "REJECTED";
export type RecordedPaymentContext = "CUSTOMER_ORDER" | "SUBSCRIPTION";

export type PaymentInstruction = {
  id: string;
  method: WalletMethod;
  accountName: string;
  accountNumber: string;
  instructions: string | null;
  qrAvailable: boolean;
  active: boolean;
};

export type PaymentReviewEvent = {
  status: RecordedPaymentStatus;
  at: string;
  actorName: string;
  note: string | null;
};

export type RecordedPayment = {
  id: string;
  context: RecordedPaymentContext;
  business: { id: string; name: string };
  orderId: string | null;
  orderCode: string | null;
  orderStatus: OrderStatus | null;
  billingRecordId: string | null;
  subscriptionRequestId?: string | null;
  payer: { id: string | null; name: string };
  method: WalletMethod;
  referenceNumber: string;
  amount: number;
  verifiedAmount?: number | null;
  currency: "PHP";
  status: RecordedPaymentStatus;
  proofAvailable: boolean;
  proofMimeType: string;
  duplicateReference: boolean;
  duplicateProof: boolean;
  duplicateOfPaymentId: string | null;
  receiptNumber: string | null;
  rejectionReason: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  retainedUntil: string;
  proofDeletedAt: string | null;
  reviewHistory: PaymentReviewEvent[];
};

export type PaymentReceipt = {
  receiptNumber: string;
  verifiedAt: string;
  businessName: string;
  payerName: string;
  context: RecordedPaymentContext;
  orderCode: string | null;
  billingRecordId: string | null;
  method: WalletMethod;
  referenceNumber: string;
  amount: number;
  currency: "PHP";
  providerConfirmed: false;
  verification: "MANUAL";
};
