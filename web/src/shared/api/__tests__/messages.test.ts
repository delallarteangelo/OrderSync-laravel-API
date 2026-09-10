import { describe, it, expect, beforeEach } from "vitest";
import { loginAsAdmin, logout } from "@/test/utils/login";
import {
  getNotificationPreferences,
  listMessages,
  listNotifications,
  listThreads,
  markAllNotificationsRead,
  markThreadRead,
  pollEvents,
  sendMessage,
  updateNotificationPreferences,
} from "@/shared/api/messages";

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

  it("reads notifications, durable events, and persists preferences", async () => {
    await loginAsAdmin();

    expect((await listNotifications()).unreadCount).toBe(1);
    expect((await pollEvents("0")).items).toHaveLength(1);

    const preferences = await getNotificationPreferences();
    const updated = await updateNotificationPreferences({
      ...preferences,
      messagesEnabled: false,
    });
    expect(updated.messagesEnabled).toBe(false);

    await markAllNotificationsRead();
    expect((await listNotifications()).unreadCount).toBe(0);
  });
});
