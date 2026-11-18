/** Human records belong to local calendar days, never UTC slices. */
export function localDateKey(date = new Date()): string {
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date");
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function localNoon(key: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) throw new Error("Use YYYY-MM-DD");
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  if (localDateKey(date) !== key) throw new Error("Invalid calendar date");
  return date;
}
export function addDays(key: string, days: number): string {
  const date = localNoon(key);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}
export function dateWindow(today: string, length: 7 | 30): string[] {
  return Array.from({ length }, (_, i) => addDays(today, i - length + 1));
}
export function compareDates(a: string, b: string): number {
  localNoon(a);
  localNoon(b);
  return a < b ? -1 : a > b ? 1 : 0;
}
export function displayDate(key: string): string {
  return localNoon(key).toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
