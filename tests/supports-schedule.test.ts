import { describe, expect, it } from "vitest";
import {
  occurrenceOnDate,
  scheduledForDate,
} from "../src/features/supports/schedule";
import { localDateKey } from "../src/lib/dates";

describe("supports scheduled for a specific day", () => {
  it("includes a support for today even after its start time has passed", () => {
    const support = { active: 1, weekdays: [2], time: "07:30" };
    const result = occurrenceOnDate(support, "2026-10-27");

    expect(result).not.toBeNull();
    expect(localDateKey(result!)).toBe("2026-10-27");
    expect(result!.getHours()).toBe(7);
    expect(result!.getMinutes()).toBe(30);
  });

  it("returns all active supports scheduled that day in time order", () => {
    const supports = [
      { id: "evening", active: 1, weekdays: [3], time: "18:00" },
      { id: "morning", active: 1, weekdays: [3], time: "07:30" },
      { id: "other-day", active: 1, weekdays: [4], time: "09:00" },
    ];

    expect(scheduledForDate(supports, "2026-10-28").map((x) => x.support.id)).toEqual([
      "morning",
      "evening",
    ]);
  });

  it("ignores inactive supports and invalid times", () => {
    const supports = [
      { id: "inactive", active: 0, weekdays: [3], time: "07:30" },
      { id: "invalid", active: 1, weekdays: [3], time: "27:00" },
    ];

    expect(scheduledForDate(supports, "2026-10-28")).toEqual([]);
  });
});
