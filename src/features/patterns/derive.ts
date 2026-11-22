import type { CheckIn, History } from "../../db/types";
import { dateWindow } from "../../lib/dates";
import { toolById } from "../tools/catalog";
export interface Observation {
  id: string;
  kind: "family" | "feeling" | "theme" | "tool";
  text: string;
  detail: string;
}
const stopWords = new Set(
  "a an the and or but if so to of in on at by for from is are was were be been being i me my mine we us our you your yours he she it its they them their this that these those had has have do did does not no yes very more much some any all also can could would should will about after before again grateful gratitude thankful today good thing things time really just with feel felt feeling something got get went day".split(
    " ",
  ),
);
export function themeTokens(text: string): string[] {
  return [
    ...new Set(
      (
        text.toLowerCase().match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu) ??
        []
      ).filter((word) => word.length >= 3 && !stopWords.has(word)),
    ),
  ];
}
export function dominantFamilies(
  checkIns: CheckIn[],
): Map<string, Set<string>> {
  const counts = new Map<string, Map<string, number>>();
  for (const entry of checkIns) {
    const day = counts.get(entry.local_date) ?? new Map<string, number>();
    for (const feeling of entry.feelings)
      day.set(feeling.familyId, (day.get(feeling.familyId) ?? 0) + 1);
    counts.set(entry.local_date, day);
  }
  return new Map(
    [...counts].map(([date, families]) => {
      const max = Math.max(...families.values());
      return [
        date,
        new Set([...families].filter(([, n]) => n === max).map(([id]) => id)),
      ];
    }),
  );
}
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);
const ranking = (a: [string, Set<string>], b: [string, Set<string>]) =>
  b[1].size - a[1].size || compareText(a[0], b[0]);
export function derivePatterns(
  history: Pick<History, "checkIns" | "reflections" | "sessions">,
  today: string,
): Observation[] {
  const output: Observation[] = [];
  const representedFamilies = new Set<string>();
  const representedFeelings = new Set<string>();
  for (const length of [7, 30] as const) {
    const window = new Set(dateWindow(today, length));
    const entries = history.checkIns.filter((c) => window.has(c.local_date));
    const activeDays = new Set(entries.map((c) => c.local_date)).size;
    if (activeDays < (length === 7 ? 4 : 6)) continue;
    const familyDays = new Map<string, Set<string>>();
    const feelingDays = new Map<string, Set<string>>();
    const snapshots = new Map(
      entries.flatMap((c) => c.feelings.map((f) => [f.id, f] as const)),
    );
    for (const [date, dominant] of dominantFamilies(entries))
      for (const family of dominant) {
        const days = familyDays.get(family) ?? new Set<string>();
        days.add(date);
        familyDays.set(family, days);
      }
    for (const entry of entries)
      for (const feeling of entry.feelings) {
        const days = feelingDays.get(feeling.id) ?? new Set<string>();
        days.add(entry.local_date);
        feelingDays.set(feeling.id, days);
      }
    const qualifies = (days: Set<string>) =>
      days.size >= 4 || (length === 7 && days.size === 3 && activeDays >= 5);
    const period = length === 7 ? "this week" : "in the last 30 days";
    const families = [...familyDays]
      .filter(([id, days]) => qualifies(days) && !representedFamilies.has(id))
      .sort(ranking)
      .slice(0, 2);
    for (const [id, days] of families) {
      const words = [...feelingDays]
        .filter(([fid]) => snapshots.get(fid)!.familyId === id)
        .sort(
          (a, b) =>
            b[1].size - a[1].size ||
            compareText(snapshots.get(a[0])!.word, snapshots.get(b[0])!.word),
        )
        .slice(0, 3)
        .map(([fid]) => snapshots.get(fid)!.word);
      const label = [...snapshots.values()].find(
        (f) => f.familyId === id,
      )!.familyLabel;
      representedFamilies.add(id);
      output.push({
        id: `family-${length}-${id}`,
        kind: "family",
        text: `${label} was among your most recorded feeling families on ${days.size} days ${period}.`,
        detail: `Words you used: ${words.join(", ")}. Frequency describes your entries, not intensity.`,
      });
    }
    const exact = [...feelingDays]
      .filter(
        ([id, days]) =>
          qualifies(days) &&
          !representedFeelings.has(id) &&
          !representedFamilies.has(snapshots.get(id)!.familyId),
      )
      .sort(ranking)
      .slice(0, length === 7 ? 2 : 3);
    for (const [id, days] of exact) {
      representedFeelings.add(id);
      output.push({
        id: `feeling-${length}-${id}`,
        kind: "feeling",
        text: `“${snapshots.get(id)!.word}” showed up on ${days.size} days ${period}.`,
        detail: "Several check-ins on one day count as one day here.",
      });
    }
  }
  const month = new Set(dateWindow(today, 30));
  const themes = new Map<string, { count: number; dates: Set<string> }>();
  for (const entry of history.reflections.filter((e) =>
    month.has(e.local_date),
  ))
    for (const token of themeTokens(entry.text)) {
      const theme = themes.get(token) ?? { count: 0, dates: new Set<string>() };
      theme.count++;
      theme.dates.add(entry.local_date);
      themes.set(token, theme);
    }
  const themeOutput: Observation[] = [...themes]
    .filter(([, t]) => t.count >= 3 && t.dates.size >= 2)
    .sort((a, b) => b[1].count - a[1].count || compareText(a[0], b[0]))
    .slice(0, 3)
    .map(([word, t]) => ({
      id: `theme-${word}`,
      kind: "theme",
      text: `“${word}” has come up in things you wanted to keep.`,
      detail: `${t.count} entries across ${t.dates.size} days in the last 30 days.`,
    }));
  const uses = new Map<string, number>();
  for (const session of history.sessions.filter((s) => month.has(s.local_date)))
    uses.set(session.tool_id, (uses.get(session.tool_id) ?? 0) + 1);
  const mostUsed = [...uses]
    .filter(([, count]) => count >= 3)
    .sort((a, b) => b[1] - a[1] || compareText(a[0], b[0]))[0];
  const toolOutput: Observation[] = mostUsed
    ? [
        {
          id: `tool-${mostUsed[0]}`,
          kind: "tool",
          text: `You’ve returned to ${toolById(mostUsed[0])?.title ?? mostUsed[0]} ${mostUsed[1]} times in the last 30 days.`,
          detail: "This records use, not whether a tool helped.",
        },
      ]
    : [];
  // Reserve room for reflection and tool observations rather than letting feelings crowd them out.
  const feelingSlots = 5 - Math.min(1, themeOutput.length) - toolOutput.length;
  return [
    ...output.slice(0, feelingSlots),
    ...themeOutput.slice(
      0,
      Math.max(
        1,
        5 - Math.min(output.length, feelingSlots) - toolOutput.length,
      ),
    ),
    ...toolOutput,
  ].slice(0, 5);
}
