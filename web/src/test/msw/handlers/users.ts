import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";
import type { User } from "@/shared/types/auth";

function requireAdmin(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u && u.role === "BUSINESS_OWNER" ? u : null;
}

export const usersHandlers = [
  http.get("/api/v1/users", ({ request }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    return HttpResponse.json({ items: db.users });
  }),

  http.get("/api/v1/users/:id", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const u = db.users.find((x) => x.id === params.id);
    if (!u) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    return HttpResponse.json(u);
  }),

  http.post("/api/v1/users", async ({ request }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<User> & { password?: string };
    const fieldErrors: Record<string, string[]> = {};
    if (!body.email) fieldErrors.email = ["Email is required"];
    else if (db.users.some((u) => u.email.toLowerCase() === body.email!.toLowerCase())) fieldErrors.email = ["Email already exists"];
    if (!body.fullName) fieldErrors.fullName = ["Full name is required"];
    if (!body.role) fieldErrors.role = ["Role is required"];
    if (Object.keys(fieldErrors).length) {
      return HttpResponse.json({ code: "VALIDATION", message: "Invalid user", fieldErrors }, { status: 422 });
    }
    const user: User = {
      id: randomId("u"),
      email: body.email!,
      fullName: body.fullName!,
      role: body.role!,
      isActive: body.isActive ?? true,
      createdAt: new Date().toISOString(),
      avatarUrl: body.avatarUrl,
      business: requireAdmin(request)?.business ?? null,
      memberships: requireAdmin(request)?.memberships ?? [],
    };
    db.users = [...db.users, user];
    db.passwords[user.email] = body.password ?? "password";
    return HttpResponse.json(user, { status: 201 });
  }),

  http.put("/api/v1/users/:id", async ({ request, params }) => {
    const me = requireAdmin(request);
    if (!me) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<User>;
    const idx = db.users.findIndex((u) => u.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    // Cannot demote self
    if (db.users[idx].id === me.id && body.role && body.role !== "BUSINESS_OWNER") {
      return HttpResponse.json({ code: "SELF_DEMOTE", message: "You cannot change your own role" }, { status: 403 });
    }
    db.users[idx] = { ...db.users[idx], ...body };
    return HttpResponse.json(db.users[idx]);
  }),

  http.post("/api/v1/users/:id/deactivate", ({ request, params }) => {
    const me = requireAdmin(request);
    if (!me) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    if (me.id === params.id) {
      return HttpResponse.json({ code: "SELF_DEACTIVATE", message: "You cannot deactivate your own account" }, { status: 403 });
    }
    const idx = db.users.findIndex((u) => u.id === params.id);
    if (idx === -1) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    db.users[idx] = { ...db.users[idx], isActive: false };
    return HttpResponse.json(db.users[idx]);
  }),

  http.post("/api/v1/users/:id/reset-password", ({ request, params }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const u = db.users.find((x) => x.id === params.id);
    if (!u) return HttpResponse.json({ code: "NOT_FOUND" }, { status: 404 });
    const tempPassword = `temp-${Math.random().toString(36).slice(2, 8)}`;
    db.passwords[u.email] = tempPassword;
    return HttpResponse.json({ tempPassword });
  }),
];
