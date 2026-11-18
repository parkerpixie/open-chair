import { addDays, localDateKey, localNoon } from "../../lib/dates";
import type { Support } from "../../db/types";

type SchedulableSupport = Pick<Support, "active" | "weekdays" | "time">;

function validTime(time: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
}

export function occurrenceOnDate(
  support: SchedulableSupport,
  dateKey: string,
): Date | null {
  if (!support.active || !validTime(support.time)) return null;
  const day = localNoon(dateKey);
  if (!support.weekdays.includes(day.getDay())) return null;
  const [hours, minutes] = support.time.split(":").map(Number);
  day.setHours(hours, minutes, 0, 0);
  return day;
}

export function scheduledForDate<T extends SchedulableSupport>(
  supports: T[],
  dateKey = localDateKey(),
) {
  return supports
    .map((support) => ({ support, date: occurrenceOnDate(support, dateKey) }))
    .filter((item): item is { support: T; date: Date } => item.date !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function nextOccurrence(
  support: SchedulableSupport,
  now = new Date(),
): Date | null {
  for (let i = 0; i <= 7; i++) {
    const date = occurrenceOnDate(support, addDays(localDateKey(now), i));
    if (date && date >= now) return date;
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
