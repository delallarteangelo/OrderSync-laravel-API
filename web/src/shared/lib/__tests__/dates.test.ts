import { describe, expect, it } from "vitest";
import { fmtDate, fmtDateTime, fmtTime } from "../dates";

describe("Philippine date formatting", () => {
  const utcInstant = "2026-09-17T08:05:00+00:00";

  it("renders API UTC timestamps in Asia/Manila", () => {
    expect(fmtTime(utcInstant)).toBe("4:05 PM");
    expect(fmtDateTime(utcInstant)).toContain("Sep 17, 2026");
    expect(fmtDateTime(utcInstant)).toContain("4:05 PM");
  });

  it("uses the Philippine calendar date across a UTC day boundary", () => {
    expect(fmtDate("2026-09-17T18:00:00+00:00")).toBe("Sep 18, 2026");
  });
});
