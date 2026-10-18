import { describe, expect, it } from "vitest";
import { DEFAULT_HOURS, isWithinHours, startOfTodayIST, type OpeningHours } from "@/lib/hours";

const TZ = "Asia/Kolkata";
// Helper: IST wall time -> Date
const ist = (iso: string) => new Date(`${iso}+05:30`);

describe("isWithinHours", () => {
  const hours: OpeningHours = { ...DEFAULT_HOURS }; // 11:00–23:00 daily

  it("is open inside the window and closed outside", () => {
    expect(isWithinHours(hours, ist("2026-10-19T12:00:00"), TZ)).toBe(true);
    expect(isWithinHours(hours, ist("2026-10-19T10:59:00"), TZ)).toBe(false);
    expect(isWithinHours(hours, ist("2026-10-19T23:00:00"), TZ)).toBe(false);
  });

  it("respects closed days", () => {
    // 2026-10-19 is a Monday
    const closedMon = { ...hours, mon: { ...hours.mon, closed: true } };
    expect(isWithinHours(closedMon, ist("2026-10-19T12:00:00"), TZ)).toBe(false);
  });

  it("handles windows past midnight", () => {
    const late = { ...hours, mon: { open: "18:00", close: "02:00", closed: false } };
    expect(isWithinHours(late, ist("2026-10-19T23:30:00"), TZ)).toBe(true); // Mon night
    expect(isWithinHours(late, ist("2026-10-20T01:30:00"), TZ)).toBe(true); // early Tue, Mon's window
    expect(isWithinHours(late, ist("2026-10-20T02:30:00"), TZ)).toBe(false);
  });
});

describe("startOfTodayIST", () => {
  it("returns IST midnight", () => {
    expect(startOfTodayIST(ist("2026-10-19T00:30:00")).toISOString()).toBe("2026-10-18T18:30:00.000Z");
    expect(startOfTodayIST(ist("2026-10-19T23:59:00")).toISOString()).toBe("2026-10-18T18:30:00.000Z");
  });
});
