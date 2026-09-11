import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PwaManager } from "@/shared/pwa/PwaManager";

describe("PwaManager", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  });

  it("offers the browser install prompt when available", async () => {
    const prompt = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt") as Event & {
      prompt: () => Promise<void>;
      userChoice: Promise<{ outcome: "accepted"; platform: string }>;
    };
    event.prompt = prompt;
    event.userChoice = Promise.resolve({ outcome: "accepted", platform: "web" });

    render(<PwaManager />);
    fireEvent(window, event);
    fireEvent.click(await screen.findByRole("button", { name: /install ordersync/i }));
    await waitFor(() => expect(prompt).toHaveBeenCalledOnce());
  });

  it("explains exactly what remains available offline", () => {
    render(<PwaManager />);
    Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
    fireEvent(window, new Event("offline"));
    expect(screen.getByRole("status")).toHaveTextContent(/cached catalogs and saved drafts/i);
    expect(screen.getByRole("status")).toHaveTextContent(/sending and checkout are paused/i);
  });
});
