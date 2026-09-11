import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearMessageDraftsForUser,
  draftStorageKey,
  usePersistentDraft,
} from "@/shared/hooks/usePersistentDraft";

beforeEach(() => localStorage.clear());

describe("persistent customer message drafts", () => {
  it("uses a scoped key and survives a remount until explicitly cleared", () => {
    const scope = "store-a:user-1:thread-1";
    const first = renderHook(() => usePersistentDraft(scope));
    act(() => first.result.current[1]("Please check my order"));
    expect(localStorage.getItem(draftStorageKey(scope))).toBe("Please check my order");
    first.unmount();

    const second = renderHook(() => usePersistentDraft(scope));
    expect(second.result.current[0]).toBe("Please check my order");
    act(() => second.result.current[2]());
    expect(localStorage.getItem(draftStorageKey(scope))).toBeNull();
  });

  it("removes only the signing-out customer's private drafts", () => {
    localStorage.setItem(draftStorageKey("store-a:user-1:thread-1"), "private draft");
    localStorage.setItem(draftStorageKey("store-a:user-2:thread-2"), "other draft");
    localStorage.setItem("unrelated", "keep");

    clearMessageDraftsForUser("user-1");

    expect(localStorage.getItem(draftStorageKey("store-a:user-1:thread-1"))).toBeNull();
    expect(localStorage.getItem(draftStorageKey("store-a:user-2:thread-2"))).toBe("other draft");
    expect(localStorage.getItem("unrelated")).toBe("keep");
  });
});
