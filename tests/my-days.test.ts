import { describe, expect, it } from "vitest";
import {
  activitiesForDay,
  activityKey,
  groupByLocalDay,
  toolResponses,
} from "../src/features/my-days/timeline";
import {
  monthCells,
  monthRange,
  monthStart,
  selectionInMonth,
  shiftMonth,
} from "../src/features/my-days/calendar";
import { localDateKey, localNoon } from "../src/lib/dates";
import type { CheckIn, History } from "../src/db/types";
import { feelings } from "../src/features/check-in/catalog";
function history(): History {
  return { checkIns: [], reflections: [], sessions: [], takeaways: [] };
}
function check(id: string, date: string, created_at: string): CheckIn {
  return {
    id,
    local_date: date,
    created_at,
    feelings: [feelings[0]],
    intensity: 3,
    note: "A little context",
    demo: 0,
  };
}
describe("My Days local calendar", () => {
  it("starts a month at local day one", () =>
    expect(monthStart("2026-09-28")).toBe("2026-09-01"));
  it("moves through years without skipping short months", () => {
    expect(shiftMonth("2026-12-31", 1)).toBe("2027-01-01");
    expect(shiftMonth("2026-01-31", 1)).toBe("2026-02-01");
    expect(shiftMonth("2026-01-01", -1)).toBe("2025-12-01");
  });
  it("clamps selection to the target month, including leap years", () => {
    expect(selectionInMonth("2026-01-31", "2026-02-01")).toBe("2026-02-28");
    expect(selectionInMonth("2024-01-31", "2024-02-01")).toBe("2024-02-29");
    expect(selectionInMonth("2026-09-15", "2026-10-01")).toBe("2026-10-15");
  });
  it.each([
    ["2024-02-12", 29],
    ["2026-02-12", 28],
    ["2026-09-28", 30],
    ["2026-08-28", 31],
  ] as const)(
    "builds %s with %s unique actual dates and whole weeks",
    (month, count) => {
      const cells = monthCells(month);
      const dates = cells.filter((cell): cell is string => cell !== null);
      expect(dates).toHaveLength(count);
      expect(new Set(dates).size).toBe(count);
      expect(cells.length % 7).toBe(0);
      expect(cells.indexOf(monthStart(month))).toBe(
        localNoon(monthStart(month)).getDay(),
      );
      expect(dates[0]).toBe(monthRange(month).from);
      expect(dates.at(-1)).toBe(monthRange(month).to);
    },
  );
  it("handles a month beginning on Sunday and a six-row month", () => {
    expect(monthCells("2026-02-01")[0]).toBe("2026-02-01");
    expect(monthCells("2026-08-01")).toHaveLength(42);
  });
  it.each(["2026-03-01", "2026-11-01"])(
    "keeps every calendar day across DST in %s",
    (month) => {
      const dates = monthCells(month).filter((cell): cell is string => !!cell);
      expect(dates.map((key) => localNoon(key).getDate())).toEqual(
        Array.from({ length: dates.length }, (_, i) => i + 1),
      );
      expect(dates.every((key) => localNoon(key).getHours() === 12)).toBe(true);
    },
  );
  it("rejects invalid dates and noninteger month offsets", () => {
    expect(() => monthCells("2026-02-30")).toThrow();
    expect(() => shiftMonth("2026-01-01", 0.5)).toThrow();
  });
});
describe("My Days timeline", () => {
  it("preserves multiple same-day check-ins and all fields, in chronological order", () => {
    const h = history();
    h.checkIns = [
      check("late", "2026-09-28", "2026-09-28T22:00:00Z"),
      check("early", "2026-09-28", "2026-09-28T13:00:00Z"),
    ];
    const entries = activitiesForDay(h, "2026-09-28");
    expect(entries.map((e) => e.record.id)).toEqual(["early", "late"]);
    expect(entries[0].record).toEqual(h.checkIns[1]);
    expect(h.checkIns[0].id).toBe("late");
  });
  it("groups by stored calendar keys near local midnight, never UTC day slices", () => {
    const h = history();
    const before = new Date("2026-09-29T04:59:00Z");
    const after = new Date("2026-09-29T05:01:00Z");
    h.checkIns = [
      check("before", localDateKey(before), before.toISOString()),
      check("after", localDateKey(after), after.toISOString()),
    ];
    expect(activitiesForDay(h, "2026-09-28").map((e) => e.record.id)).toEqual([
      "before",
    ]);
    expect(activitiesForDay(h, "2026-09-29").map((e) => e.record.id)).toEqual([
      "after",
    ]);
  });
  it("keeps recorded date authoritative after travel to another time zone", () => {
    const h = history();
    h.checkIns = [check("travel", "2026-09-27", "2026-09-28T23:30:00Z")];
    expect(groupByLocalDay(h).has("2026-09-27")).toBe(true);
    expect(groupByLocalDay(h).has("2026-09-28")).toBe(false);
  });
  it("interleaves every persisted activity type by timestamp", () => {
    const h = history();
    const base = { local_date: "2026-09-28", demo: 0 };
    h.checkIns = [check("check", "2026-09-28", "2026-09-28T13:00:00Z")];
    h.reflections = [
      {
        ...base,
        id: "reflection",
        created_at: "2026-09-28T14:00:00Z",
        text: "Remember",
      },
    ];
    h.sessions = [
      {
        ...base,
        id: "tool",
        created_at: "2026-09-28T15:00:00Z",
        tool_id: "stop",
        check_in_id: null,
        responses: '["One","Two","Three"]',
      },
    ];
    h.takeaways = [
      {
        ...base,
        id: "takeaway",
        created_at: "2026-09-28T12:00:00Z",
        text: "A thought",
        support_id: null,
      },
    ];
    expect(activitiesForDay(h, "2026-09-28").map((e) => e.kind)).toEqual([
      "takeaway",
      "check-in",
      "reflection",
      "tool",
    ]);
  });
  it("uses absolute timestamps to order repeated wall times at the fall DST transition", () => {
    const h = history();
    h.checkIns = [
      check("second", "2026-11-01", "2026-11-01T01:15:00-06:00"),
      check("first", "2026-11-01", "2026-11-01T01:45:00-05:00"),
    ];
    expect(activitiesForDay(h, "2026-11-01").map((e) => e.record.id)).toEqual([
      "first",
      "second",
    ]);
  });
  it("keeps equal-time records deterministic and keys distinct across modules", () => {
    const h = history();
    h.checkIns = [
      check("b", "2026-09-28", "2026-09-28T13:00:00Z"),
      check("a", "2026-09-28", "2026-09-28T13:00:00Z"),
    ];
    h.reflections = [
      {
        id: "a",
        local_date: "2026-09-28",
        created_at: "2026-09-28T13:00:00Z",
        text: "Remember",
        demo: 0,
      },
    ];
    expect(activitiesForDay(h, "2026-09-28").map(activityKey)).toEqual([
      "check-in:a",
      "check-in:b",
      "reflection:a",
    ]);
  });
  it("returns an empty timeline for empty and unrelated days", () => {
    expect(activitiesForDay(history(), "2026-09-28")).toEqual([]);
    const h = history();
    h.checkIns = [check("other", "2026-09-27", "2026-09-27T13:00:00Z")];
    expect(activitiesForDay(h, "2026-09-28")).toEqual([]);
  });
  it("does not crash a day when a historical tool response cannot be parsed", () => {
    expect(toolResponses("{")).toBeNull();
    expect(toolResponses("[1]")).toBeNull();
    expect(toolResponses('{"text":"hello"}')).toBeNull();
    expect(toolResponses('["Saved response"]')).toEqual(["Saved response"]);
  });
});
