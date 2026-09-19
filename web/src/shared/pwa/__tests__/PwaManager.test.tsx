import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { PwaManager } from "@/shared/pwa/PwaManager";

describe("PwaManager", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("hides the in-page install prompt without disabling browser installation", () => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    render(<PwaManager />);
    fireEvent(window, event);
    expect(event.defaultPrevented).toBe(true);
    expect(screen.queryByRole("button", { name: /install ordersync/i })).not.toBeInTheDocument();
  });

  it("explains exactly what remains available offline", () => {
    render(<PwaManager />);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    fireEvent(window, new Event("offline"));
    expect(screen.getByRole("status")).toHaveTextContent(/cached catalogs and saved drafts/i);
    expect(screen.getByRole("status")).toHaveTextContent(/sending and checkout are paused/i);
  });
});
