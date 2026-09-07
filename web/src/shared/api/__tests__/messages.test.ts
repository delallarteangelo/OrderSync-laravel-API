import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import { listMessages, listThreads, markThreadRead, sendMessage } from "@/shared/api/messages";

beforeEach(() => {
  logout();
});

describe("messaging api", () => {
  it("sends a message and bumps lastMessage on the thread", async () => {
    await loginAsAdmin();
    const threads = await listThreads();
    const tid = threads[0].id;
    const before = await listMessages(tid);
    const msg = await sendMessage(tid, "Hello there");
    expect(msg.body).toBe("Hello there");

    const after = await listMessages(tid);
    expect(after.length).toBe(before.length + 1);

    const threadsAfter = await listThreads();
    const t = threadsAfter.find((x) => x.id === tid)!;
    expect(t.lastMessage).toContain("Hello there");
  });

  it("markThreadRead resets unread count", async () => {
    await loginAsAdmin();
    const threads = await listThreads();
    const tid = threads[0].id;
    await markThreadRead(tid);
    const after = await listThreads();
    expect(after.find((t) => t.id === tid)!.unreadCount).toBe(0);
  });
});
