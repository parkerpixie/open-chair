import { addDays, localDateKey, localNoon } from "../../lib/dates";

export function monthStart(key: string): string {
  const date = localNoon(key);
  date.setDate(1);
  return localDateKey(date);
}
export function shiftMonth(key: string, amount: number): string {
  if (!Number.isInteger(amount))
    throw new Error("Month offset must be an integer");
  const date = localNoon(monthStart(key));
  date.setMonth(date.getMonth() + amount);
  return localDateKey(date);
}
export function monthRange(key: string) {
  return { from: monthStart(key), to: addDays(shiftMonth(key, 1), -1) };
}
/** Keep the selected day number when browsing; clamp Jan 31 to Feb's last day. */
export function selectionInMonth(selected: string, month: string): string {
  const { from, to } = monthRange(month);
  const day = Math.min(localNoon(selected).getDate(), localNoon(to).getDate());
  return addDays(from, day - 1);
}
export function monthCells(key: string): (string | null)[] {
  const { from, to } = monthRange(key);
  const offset = localNoon(from).getDay();
  const days = localNoon(to).getDate();
  return Array.from(
    { length: Math.ceil((offset + days) / 7) * 7 },
    (_, index) => {
      const day = index - offset;
      return day >= 0 && day < days ? addDays(from, day) : null;
    },
  );
}
export function dayTitle(key: string): string {
  return localNoon(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
