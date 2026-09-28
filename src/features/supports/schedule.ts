import { addDays, localDateKey, localNoon } from "../../lib/dates";
import type { Support } from "../../db/types";
export function nextOccurrence(
  support: Pick<Support, "active" | "weekdays" | "time">,
  now = new Date(),
): Date | null {
  if (!support.active || !/^([01]\d|2[0-3]):[0-5]\d$/.test(support.time))
    return null;
  const [hours, minutes] = support.time.split(":").map(Number);
  for (let i = 0; i <= 7; i++) {
    const day = localNoon(addDays(localDateKey(now), i));
    if (!support.weekdays.includes(day.getDay())) continue;
    day.setHours(hours, minutes, 0, 0);
    if (day >= now) return day;
  }
  return null;
}
export function upcoming(supports: Support[], now = new Date()) {
  return supports
    .map((support) => ({ support, date: nextOccurrence(support, now) }))
    .filter(
      (item): item is { support: Support; date: Date } => item.date !== null,
    )
    .sort(
      (a, b) =>
        a.date.getTime() - b.date.getTime() ||
        a.support.id.localeCompare(b.support.id),
    );
}
