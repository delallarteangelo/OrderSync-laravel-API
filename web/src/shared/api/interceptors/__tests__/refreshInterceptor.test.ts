import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "@/test/msw/server";
import { http as axiosClient } from "@/shared/api/axios";
import { login } from "@/shared/api/auth";
import { useAuthStore } from "@/app/stores/authStore";

beforeEach(() => {
  useAuthStore.setState({ accessToken: "stale", user: null, bootstrapped: false });
});

describe("refresh interceptor", () => {
  it("preserves invalid-credentials errors without attempting token refresh", async () => {
    let refreshCalls = 0;
    server.use(
      http.post("/api/v1/auth/login", () =>
        HttpResponse.json(
          {
            code: "INVALID_CREDENTIALS",
            message: "The email or password is incorrect.",
          },
          { status: 401 },
        ),
      ),
      http.post("/api/v1/auth/refresh", () => {
        refreshCalls += 1;
        return HttpResponse.json(
          {
            code: "INVALID_REFRESH_TOKEN",
            message: "The refresh token is missing, expired, or invalid.",
          },
          { status: 401 },
        );
      }),
    );

    await expect(
      login({ email: "owner@example.com", password: "wrong-password" }),
    ).rejects.toMatchObject({
      code: "INVALID_CREDENTIALS",
      message: "The email or password is incorrect.",
    });
    expect(refreshCalls).toBe(0);
  });

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
