import type {
  CheckIn,
  History,
  Reflection,
  Takeaway,
  ToolSession,
} from "../../db/types";

export type DayActivity =
  | { kind: "check-in"; record: CheckIn }
  | { kind: "reflection"; record: Reflection }
  | { kind: "tool"; record: ToolSession }
  | { kind: "takeaway"; record: Takeaway };

// A daily module adapts its persisted records here. Scheduled resources are not activity.
// Future Health/Sleep/Wins modules can add an adapter and a focused entry renderer.
const dailyModules: ((history: History) => DayActivity[])[] = [
  (h) => h.checkIns.map((record) => ({ kind: "check-in", record })),
  (h) => h.reflections.map((record) => ({ kind: "reflection", record })),
  (h) => h.sessions.map((record) => ({ kind: "tool", record })),
  (h) => h.takeaways.map((record) => ({ kind: "takeaway", record })),
];
export function activityKey(entry: DayActivity): string {
  return `${entry.kind}:${entry.record.id}`;
}
function timestamp(value: string): number {
  const time = Date.parse(value);
  return Number.isFinite(time) ? time : Number.MAX_SAFE_INTEGER;
}
export function groupByLocalDay(history: History): Map<string, DayActivity[]> {
  const days = new Map<string, DayActivity[]>();
  for (const module of dailyModules)
    for (const entry of module(history)) {
      const key = entry.record.local_date; // Authoritative, even if the timestamp is a different UTC day.
      const day = days.get(key) ?? [];
      day.push(entry);
      days.set(key, day);
    }
  for (const entries of days.values())
    entries.sort((a, b) => {
      const order =
        timestamp(a.record.created_at) - timestamp(b.record.created_at);
      if (order) return order;
      const left = activityKey(a),
        right = activityKey(b);
      return left < right ? -1 : left > right ? 1 : 0;
    });
  return days;
}
export function activitiesForDay(history: History, key: string): DayActivity[] {
  return groupByLocalDay(history).get(key) ?? [];
}
export function activityTime(timestamp: string): string {
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : "Time not available";
}
export function toolResponses(value: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
      ? parsed
      : null;
  } catch {
    return null;
  }
}
