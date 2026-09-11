import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useServiceReachability } from "@/shared/hooks/useOnlineStatus";

describe("useServiceReachability", () => {
  it("reports a reachable backend after a successful heartbeat", async () => {
    const { result } = renderHook(() =>
      useServiceReachability(true, { intervalMs: 60_000, timeoutMs: 1_000 }),
    );

    await waitFor(() => expect(result.current).toBe("reachable"));
  });

  it("does not send a heartbeat while the browser is offline", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { result } = renderHook(() => useServiceReachability(false));

    expect(result.current).toBe("unreachable");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
