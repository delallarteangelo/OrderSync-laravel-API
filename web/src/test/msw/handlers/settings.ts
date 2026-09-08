import { http, HttpResponse } from "msw";
import { db, findUserByToken, tokenFromAuthHeader } from "../db";
import type { BusinessSettings } from "@/shared/types/settings";

function requireAdmin(request: Request) {
  const u = findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")));
  return u && u.role === "BUSINESS_OWNER" ? u : null;
}

export const settingsHandlers = [
  http.get("/api/v1/settings", ({ request }) => {
    if (!findUserByToken(tokenFromAuthHeader(request.headers.get("authorization")))) {
      return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
    }
    return HttpResponse.json(db.settings);
  }),

  http.put("/api/v1/settings", async ({ request }) => {
    if (!requireAdmin(request)) return HttpResponse.json({ code: "FORBIDDEN" }, { status: 403 });
    const body = (await request.json()) as Partial<BusinessSettings>;
    db.settings = { ...db.settings, ...body };
    return HttpResponse.json(db.settings);
  }),
];
