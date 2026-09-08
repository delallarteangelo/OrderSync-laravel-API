import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { http as axiosClient } from "@/shared/api/axios";
import { useAuthStore } from "@/app/stores/authStore";

beforeEach(() => {
  useAuthStore.setState({ accessToken: "stale", user: null, bootstrapped: false });
});

describe("refresh interceptor", () => {
  it("fires exactly one refresh under N parallel 401s", async () => {
    let refreshCalls = 0;
    let firstCall = true;
    server.use(
      http.get("/api/v1/protected", () => {
        if (firstCall) {
          firstCall = false;
          return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
        }
        // After token is refreshed, subsequent attempts succeed.
        return HttpResponse.json({ ok: true });
      }),
      http.post("/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json({
          accessToken: "fresh",
          accessExpiresAt: new Date().toISOString(),
          user: {
            id: "u-1",
            email: "a@b",
            fullName: "A",
            role: "BUSINESS_OWNER",
            isActive: true,
            createdAt: "",
            business: { id: "b-1", name: "Business", slug: "business" },
            memberships: [],
          },
        });
      }),
      http.get("/api/v1/parallel", ({ request }) => {
        const auth = request.headers.get("authorization");
        if (auth === "Bearer stale") return HttpResponse.json({ code: "UNAUTH" }, { status: 401 });
        return HttpResponse.json({ ok: true });
      }),
    );

    const results = await Promise.allSettled([
      axiosClient.get("/parallel"),
      axiosClient.get("/parallel"),
      axiosClient.get("/parallel"),
      axiosClient.get("/parallel"),
      axiosClient.get("/parallel"),
    ]);

    expect(refreshCalls).toBe(1);
    expect(results.every((r) => r.status === "fulfilled")).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe("fresh");
  });
});
