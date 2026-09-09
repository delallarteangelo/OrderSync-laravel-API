import { http, HttpResponse } from "msw";
import { db, randomId, findUserByToken, tokenFromAuthHeader } from "../db";

const REFRESH_COOKIE = "ordersync_refresh";

function issueSession(userId: string) {
  const accessToken = randomId("at");
  const refreshToken = randomId("rt");
  db.sessions.set(accessToken, { token: accessToken, userId, issuedAt: Date.now() });
  db.refreshTokens.set(refreshToken, userId);
  return { accessToken, refreshToken };
}

function authResponse(userId: string) {
  const user = db.users.find((u) => u.id === userId)!;
  const { accessToken, refreshToken } = issueSession(userId);
  return HttpResponse.json(
    { accessToken, accessExpiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), user },
    {
      headers: {
        "Set-Cookie": `${REFRESH_COOKIE}=${refreshToken}; Path=/; HttpOnly; SameSite=Strict`,
      },
    },
  );
}

function readCookie(req: Request, name: string): string | null {
  const cookie = req.headers.get("cookie") ?? "";
  for (const part of cookie.split(/;\s*/)) {
    const [k, ...rest] = part.split("=");
    if (k === name) return rest.join("=");
  }
  return null;
}

export const authHandlers = [
  http.post("/api/v1/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = body.email?.toLowerCase().trim();
    const password = body.password ?? "";
    if (!email) {
      return HttpResponse.json(
        {
          code: "VALIDATION",
          message: "Invalid input",
          fieldErrors: { email: ["Email is required"] },
        },
        { status: 422 },
      );
    }
    const user = db.users.find((u) => u.email.toLowerCase() === email);
    if (!user || db.passwords[user.email] !== password) {
      return HttpResponse.json(
        { code: "INVALID_CREDENTIALS", message: "Invalid email or password" },
        { status: 401 },
      );
    }
    if (!user.isActive) {
      return HttpResponse.json(
        { code: "INACTIVE", message: "Account is disabled" },
        { status: 403 },
      );
    }
    if (!["SUPER_ADMIN", "BUSINESS_OWNER", "STAFF", "CASHIER", "CUSTOMER"].includes(user.role)) {
      return HttpResponse.json(
        { code: "FORBIDDEN_ROLE", message: "This account cannot use the web console" },
        { status: 403 },
      );
    }
    return authResponse(user.id);
  }),

  http.post("/api/v1/auth/refresh", ({ request }) => {
    const refresh = readCookie(request, REFRESH_COOKIE);
    if (!refresh)
      return HttpResponse.json(
        { code: "NO_REFRESH", message: "No refresh token" },
        { status: 401 },
      );
    const userId = db.refreshTokens.get(refresh);
    if (!userId)
      return HttpResponse.json(
        { code: "INVALID_REFRESH", message: "Invalid refresh token" },
        { status: 401 },
      );
    db.refreshTokens.delete(refresh);
    return authResponse(userId);
  }),

  http.post("/api/v1/auth/logout", ({ request }) => {
    const token = tokenFromAuthHeader(request.headers.get("authorization"));
    if (token) db.sessions.delete(token);
    const refresh = readCookie(request, REFRESH_COOKIE);
    if (refresh) db.refreshTokens.delete(refresh);
    return new HttpResponse(null, {
      status: 204,
      headers: { "Set-Cookie": `${REFRESH_COOKIE}=; Path=/; HttpOnly; Max-Age=0` },
    });
  }),

  http.get("/api/v1/auth/me", ({ request }) => {
    const user = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
    if (!user)
      return HttpResponse.json({ code: "UNAUTHORIZED", message: "Not signed in" }, { status: 401 });
    return HttpResponse.json(user);
  }),

  http.post("/api/v1/auth/change-password", async ({ request }) => {
    const user = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
    if (!user)
      return HttpResponse.json({ code: "UNAUTHORIZED", message: "Not signed in" }, { status: 401 });
    const body = (await request.json()) as { currentPassword?: string; newPassword?: string };
    if (db.passwords[user.email] !== body.currentPassword) {
      return HttpResponse.json(
        {
          code: "BAD_PASSWORD",
          message: "Current password is incorrect",
          fieldErrors: { currentPassword: ["Incorrect"] },
        },
        { status: 422 },
      );
    }
    if (!body.newPassword || body.newPassword.length < 8) {
      return HttpResponse.json(
        {
          code: "WEAK_PASSWORD",
          message: "Password too short",
          fieldErrors: { newPassword: ["At least 8 characters"] },
        },
        { status: 422 },
      );
    }
    db.passwords[user.email] = body.newPassword;
    return new HttpResponse(null, { status: 204 });
  }),
];

export const healthHandlers = [
  http.get("/api/v1/health", () => HttpResponse.json({ ok: true, ts: new Date().toISOString() })),
];
