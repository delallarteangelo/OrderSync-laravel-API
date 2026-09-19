import { HttpResponse, http } from "msw";
import type { PaymentInstruction, RecordedPayment } from "@/shared/types/payments";
import { db, findUserByToken, randomId, tokenFromAuthHeader } from "../db";

const instructions: PaymentInstruction[] = [
  {
    id: "instruction-gcash",
    method: "GCASH",
    accountName: "Tonette Reyes",
    accountNumber: "09171234567",
    instructions: "Use the order number as the message.",
    qrAvailable: true,
    active: true,
  },
];

const submittedAt = "2026-09-09T08:00:00.000Z";
const payments: RecordedPayment[] = [
  {
    id: "payment-submitted",
    context: "CUSTOMER_ORDER",
    business: { id: "business-tonette", name: "Tonette's Minimart" },
    orderId: "order-pending",
    orderCode: "ORD-100",
    orderStatus: "PENDING",
    billingRecordId: null,
    payer: { id: "u-customer-1", name: "Local Customer" },
    method: "GCASH",
    referenceNumber: "GCASH-101",
    amount: 100,
    currency: "PHP",
    status: "SUBMITTED",
    proofAvailable: true,
    proofMimeType: "image/png",
    duplicateReference: false,
    duplicateProof: false,
    duplicateOfPaymentId: null,
    receiptNumber: null,
    rejectionReason: null,
    submittedAt,
    reviewedAt: null,
    reviewedBy: null,
    retainedUntil: "2027-09-09T08:00:00.000Z",
    proofDeletedAt: null,
    reviewHistory: [
      { status: "SUBMITTED", at: submittedAt, actorName: "Local Customer", note: null },
    ],
  },
];

function user(request: Request) {
  return findUserByToken(tokenFromAuthHeader(request.headers.get("Authorization")));
}

export const paymentsHandlers = [
  http.get("/api/v1/customer/payment-instructions", ({ request }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({
      verification: "MANUAL",
      providerConfirmed: false,
      items: instructions,
    });
  }),
  http.get("/api/v1/payment-instructions", ({ request }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({ items: instructions });
  }),
  http.post("/api/v1/payment-instructions/:method", async ({ request, params }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const form = await request.formData();
    const method = params.method as "GCASH" | "MAYA";
    const updated: PaymentInstruction = {
      id: `instruction-${method.toLowerCase()}`,
      method,
      accountName: String(form.get("accountName")),
      accountNumber: String(form.get("accountNumber")),
      instructions: String(form.get("instructions") ?? "") || null,
      qrAvailable: form.has("qr"),
      active: form.get("active") === "1",
    };
    const index = instructions.findIndex((item) => item.method === method);
    if (index === -1) instructions.push(updated);
    else instructions[index] = updated;
    return HttpResponse.json(updated);
  }),
  http.post("/api/v1/customer/orders/:id/payments", ({ request, params }) => {
    const who = user(request);
    if (!who) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const order = db.orders.find((item) => item.id === params.id);
    if (!order) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const now = new Date().toISOString();
    const payment: RecordedPayment = {
      id: randomId("payment"),
      context: "CUSTOMER_ORDER",
      business: { id: order.business.id, name: order.business.name },
      orderId: order.id,
      orderCode: order.code,
      orderStatus: order.status,
      billingRecordId: null,
      payer: { id: who.id, name: who.fullName },
      method: "GCASH",
      referenceNumber: "GCASH-101",
      amount: order.total,
      currency: "PHP",
      status: "SUBMITTED",
      proofAvailable: true,
      proofMimeType: "image/png",
      duplicateReference: false,
      duplicateProof: false,
      duplicateOfPaymentId: null,
      receiptNumber: null,
      rejectionReason: null,
      submittedAt: now,
      reviewedAt: null,
      reviewedBy: null,
      retainedUntil: new Date(Date.now() + 365 * 86400000).toISOString(),
      proofDeletedAt: null,
      reviewHistory: [{ status: "SUBMITTED", at: now, actorName: who.fullName, note: null }],
    };
    payments.unshift(payment);
    order.payments.unshift(payment);
    return HttpResponse.json(payment, { status: 201 });
  }),
  http.get("/api/v1/payments", ({ request }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({
      items: payments,
      meta: { currentPage: 1, lastPage: 1, total: payments.length },
    });
  }),
  http.get("/api/v1/platform/payments", ({ request }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    return HttpResponse.json({
      items: payments,
      meta: { currentPage: 1, lastPage: 1, total: payments.length },
    });
  }),
  http.post("/api/v1/payments/:id/review", async ({ request, params }) => {
    if (!user(request)) return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    const payment = payments.find((item) => item.id === params.id);
    if (!payment) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const body = (await request.json()) as { decision: "VERIFIED" | "REJECTED"; reason?: string };
    payment.status = body.decision;
    payment.reviewedAt = new Date().toISOString();
    payment.reviewedBy = "Tonette Reyes";
    payment.rejectionReason = body.decision === "REJECTED" ? (body.reason ?? "Rejected") : null;
    payment.receiptNumber = body.decision === "VERIFIED" ? `PAY-${payment.id}` : null;
    return HttpResponse.json(payment);
  }),
];
