import { describe, it, expect } from "vitest";
import { cn } from "@/shared/lib/cn";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });
  it("drops falsy", () => {
    expect(cn("a", false, null, undefined, "c")).toBe("a c");
  });
});
