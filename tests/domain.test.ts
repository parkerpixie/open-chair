import { describe, expect, it } from "vitest";
import {
  localDateKey,
  localNoon,
  addDays,
  dateWindow,
  compareDates,
} from "../src/lib/dates";
import { feelings, families } from "../src/features/check-in/catalog";
import {
  derivePatterns,
  dominantFamilies,
  themeTokens,
} from "../src/features/patterns/derive";
import { exactMappings, suggestTools } from "../src/features/tools/suggestions";
import { nextOccurrence } from "../src/features/supports/schedule";
import type {
  CheckIn,
  History,
  Reflection,
  ToolSession,
} from "../src/db/types";
const today = "2026-09-27";
const feeling = (word: string) => feelings.find((f) => f.word === word)!;
const check = (day: number, words: string[], suffix = ""): CheckIn => ({
  id: `${day}${suffix}`,
  local_date: addDays(today, -day),
  created_at: localNoon(addDays(today, -day)).toISOString(),
  intensity: null,
  note: "",
  demo: 0,
  feelings: words.map(feeling),
});
const history = (
  checkIns: CheckIn[] = [],
  reflections: Reflection[] = [],
  sessions: ToolSession[] = [],
): History => ({ checkIns, reflections, sessions, takeaways: [] });
const reflection = (
  day: number,
  text: string,
  id = String(day),
): Reflection => ({
  id,
  local_date: addDays(today, -day),
  created_at: "",
  text,
  demo: 0,
});
const session = (day: number, tool_id = "stop"): ToolSession => ({
  id: String(day),
  local_date: addDays(today, -day),
  created_at: "",
  tool_id,
  check_in_id: null,
  responses: "[]",
  demo: 0,
});
const patterns = (entries: CheckIn[]) =>
  derivePatterns(history(entries), today);
describe("local calendar dates", () => {
  it("uses local components instead of UTC slices", () =>
    expect(localDateKey(new Date("2026-03-08T04:30:00Z"))).toBe("2026-03-07"));
  it("builds noon and rejects impossible dates", () => {
    expect(localNoon(today).getHours()).toBe(12);
    expect(() => localNoon("2026-02-30")).toThrow();
    expect(() => localNoon("2026-9-1")).toThrow();
  });
  it("adds and subtracts through month and year boundaries", () => {
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
  });
  it("has inclusive 7 and 30 day windows", () => {
    expect(dateWindow(today, 7)).toHaveLength(7);
    expect(dateWindow(today, 7)[0]).toBe("2026-09-21");
    expect(dateWindow(today, 30)[29]).toBe(today);
    expect(dateWindow(today, 30)[0]).toBe("2026-08-29");
  });
  it.each(["2026-03-08", "2026-11-01"])(
    "preserves calendar steps across DST near %s",
    (day) => {
      expect(addDays(addDays(day, -1), 1)).toBe(day);
      expect(localNoon(addDays(day, 1)).getHours()).toBe(12);
      expect(compareDates(day, addDays(day, 1))).toBe(-1);
    },
  );
});
describe("catalog and suggestions", () => {
  it("contains exactly 96 unique feelings in eight families", () => {
    expect(feelings).toHaveLength(96);
    expect(new Set(feelings.map((f) => f.id)).size).toBe(96);
    expect(families).toHaveLength(8);
  });
  it.each(Object.entries(exactMappings))("%s suggests %s first", (word, tool) =>
    expect(suggestTools([feeling(word)])[0].id).toBe(tool),
  );
  it("does not prescribe coping for bright or calm", () =>
    expect(suggestTools([feeling("Happy"), feeling("Grounded")])).toEqual([]));
  it("limits, deduplicates, and prioritizes body-first exact tools", () => {
    const result = suggestTools(
      ["Worried", "Flooded", "Panicked", "Guilty", "Furious", "Stuck"].map(
        feeling,
      ),
    );
    expect(result).toHaveLength(3);
    expect(result[0].id).toBe("tipp");
    expect(new Set(result.map((t) => t.id)).size).toBe(3);
  });
  it("offers a needs check for neutral feelings", () =>
    expect(suggestTools([feeling("Tired")])[0].id).toBe("halt"));
});
describe("patterns", () => {
  it("same-day repetition counts once and is insufficient", () =>
    expect(
      patterns(
        Array.from({ length: 8 }, (_, i) => check(0, ["Worried"], String(i))),
      ),
    ).toEqual([]));
  it("requires four active weekly days", () =>
    expect(patterns([0, 1, 2].map((d) => check(d, ["Worried"])))).toEqual([]));
  it("finds four-day exact feeling outside dominant families", () => {
    const entries = [0, 1, 2, 3].map((d) =>
      check(d, ["Worried", "Grounded", "Steady"]),
    );
    expect(patterns(entries).some((p) => p.id === "feeling-7-worried")).toBe(
      true,
    );
  });
  it("finds three days only when five days are active", () => {
    const entries = [0, 1, 2, 3, 4].map((d) =>
      check(d, d < 3 ? ["Worried", "Grounded", "Steady"] : ["Tired"]),
    );
    expect(patterns(entries).some((p) => p.id === "feeling-7-worried")).toBe(
      true,
    );
    expect(
      patterns(entries.slice(0, 4)).some((p) => p.id === "feeling-7-worried"),
    ).toBe(false);
  });
  it("calculates dominance across all check-ins per day", () => {
    const result = dominantFamilies([
      check(0, ["Worried"]),
      check(0, ["Grounded", "Steady"], "b"),
    ]);
    expect([...result.get(today)!]).toEqual(["calm"]);
  });
  it("includes all tied families", () =>
    expect(
      [
        ...dominantFamilies([check(0, ["Worried", "Grounded"])]).get(today)!,
      ].sort(),
    ).toEqual(["calm", "fear"]));
  it("allows positive families and suppresses redundant exact observations", () => {
    const result = patterns([0, 1, 2, 3].map((d) => check(d, ["Happy"])));
    expect(result[0].id).toBe("family-7-bright");
    expect(result.some((p) => p.kind === "feeling")).toBe(false);
  });
  it("uses monthly six-active-day and four-occurrence thresholds", () => {
    const entries = [10, 11, 12, 13, 14, 15].map((d) =>
      check(d, d < 14 ? ["Happy"] : ["Tired"]),
    );
    expect(patterns(entries).some((p) => p.id === "family-30-bright")).toBe(
      true,
    );
    expect(patterns(entries.slice(0, 5))).toEqual([]);
  });
  it("excludes outside-window and future entries", () =>
    expect(
      patterns([30, 31, 32, -1, -2, -3].map((d) => check(d, ["Happy"]))),
    ).toEqual([]));
  it("dedupes Unicode tokens and omits stop words", () =>
    expect(
      themeTokens(
        "Grateful today for café café, family-family and your really good thing.",
      ),
    ).toEqual(["café", "family-family"]));
  it("requires three entries across two dates for themes", () => {
    const refs = [
      reflection(0, "garden garden", "a"),
      reflection(0, "garden", "b"),
      reflection(1, "garden", "c"),
    ];
    expect(derivePatterns(history([], refs), today)[0].kind).toBe("theme");
    expect(derivePatterns(history([], refs.slice(0, 2)), today)).toEqual([]);
    expect(
      derivePatterns(
        history(
          [],
          refs.map((r) => ({ ...r, local_date: today })),
        ),
        today,
      ),
    ).toEqual([]);
  });
  it("qualifies repeated tools at three uses and uses stable tie-break", () => {
    expect(
      derivePatterns(history([], [], [session(0), session(1)]), today),
    ).toEqual([]);
    const result = derivePatterns(
      history(
        [],
        [],
        [
          session(0),
          session(1),
          session(2),
          session(3, "halt"),
          session(4, "halt"),
          session(5, "halt"),
        ],
      ),
      today,
    );
    expect(result[0].id).toBe("tool-halt");
  });
  it("caps output at five and has deterministic ordering", () => {
    const h = history(
      Array.from({ length: 20 }, (_, i) =>
        check(i, ["Happy", "Grounded", "Worried", "Ashamed"]),
      ),
      [0, 1, 2].map((d) => reflection(d, "garden friends walking")),
      [0, 1, 2].map((d) => session(d)),
    );
    const result = derivePatterns(h, today);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(
      derivePatterns({ ...h, checkIns: [...h.checkIns].reverse() }, today),
    ).toEqual(result);
  });
});
describe("additional pattern boundaries", () => {
  it("does not mistake repeated entries on one of several active days for recurrence", () => {
    const entries = [0, 1, 2, 3, 4].map((d) => check(d, ["Happy"]));
    entries.push(...[0, 1, 2, 3].map((i) => check(0, ["Worried"], String(i))));
    expect(
      patterns(entries).some(
        (p) => p.id.includes("worried") || p.id.includes("fear"),
      ),
    ).toBe(false);
  });
  it("qualifies monthly exact words on four distinct days outside dominant families", () => {
    const entries = [10, 11, 12, 13, 14, 15].map((d) =>
      check(d, d < 14 ? ["Worried", "Grounded", "Steady"] : ["Happy"]),
    );
    expect(patterns(entries).some((p) => p.id === "feeling-30-worried")).toBe(
      true,
    );
  });
  it.each(families.map((f) => [f.id, f.words[0]]))(
    "applies the same weekly threshold to %s",
    (id, word) => {
      expect(patterns([0, 1, 2, 3].map((d) => check(d, [word])))[0].id).toBe(
        `family-7-${id}`,
      );
    },
  );
  it("ranks representative words by distinct days then alphabetically", () => {
    const result = patterns(
      [0, 1, 2, 3].map((d) =>
        check(d, d < 3 ? ["Steady", "Grounded", "Present"] : ["Steady"]),
      ),
    );
    expect(result[0].detail).toContain("Steady, Grounded, Present");
  });
});
describe("weekly supports", () => {
  it("chooses later today or next week after the time passes", () => {
    const support = { active: 1, weekdays: [0], time: "10:00" };
    expect(nextOccurrence(support, new Date(2026, 8, 27, 9))?.getDate()).toBe(
      27,
    );
    expect(
      localDateKey(nextOccurrence(support, new Date(2026, 8, 27, 11))!),
    ).toBe("2026-10-04");
  });
  it("ignores inactive, unscheduled, and invalid times", () => {
    expect(
      nextOccurrence({ active: 0, weekdays: [0], time: "10:00" }),
    ).toBeNull();
    expect(
      nextOccurrence({ active: 1, weekdays: [], time: "10:00" }),
    ).toBeNull();
    expect(
      nextOccurrence({ active: 1, weekdays: [0], time: "25:00" }),
    ).toBeNull();
  });
  it("crosses DST at local wall-clock time", () => {
    const result = nextOccurrence(
      { active: 1, weekdays: [0], time: "09:00" },
      new Date(2026, 2, 7, 12),
    )!;
    expect(localDateKey(result)).toBe("2026-03-08");
    expect(result.getHours()).toBe(9);
  });
});
