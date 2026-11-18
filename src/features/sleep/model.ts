import { addDays, localDateKey, localNoon } from "../../lib/dates";

export type Restfulness = 1 | 2 | 3 | 4 | 5;
export const restLabels = ["Exhausted", "Still tired", "Just okay", "Pretty good", "Refreshed"] as const;

export interface SleepStretch {
  id: string;
  night_id: string;
  started_at: string;
  ended_at: string;
  estimated: number;
  note: string;
}
export interface SleepNight {
  id: string;
  night_date: string;
  wake_date: string;
  restfulness: number | null;
  subjective_note: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  stretches: SleepStretch[];
}
export function sleepMinutes(stretches: SleepStretch[]): number {
  return stretches.reduce((sum, x) => sum + Math.round((Date.parse(x.ended_at) - Date.parse(x.started_at)) / 60000), 0);
}
export function awakeMinutes(stretches: SleepStretch[]): number {
  if (!stretches.length) return 0;
  return Math.max(0, Math.round((Date.parse(stretches[stretches.length - 1].ended_at) - Date.parse(stretches[0].started_at)) / 60000) - sleepMinutes(stretches));
}
export function formatDuration(minutes: number): string {
  return Math.floor(minutes / 60) + "h " + String(minutes % 60).padStart(2, "0") + "m";
}
export function clockDate(date: string, hhmm: string): Date {
  localNoon(date); // strict calendar date
  const parts = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!parts) throw new Error("Use a valid time (for example 21:30).");
  const [year, month, day] = date.split("-").map(Number);
  const dt = new Date(year, month - 1, day, Number(parts[1]), Number(parts[2]), 0, 0);
  if (localDateKey(dt) !== date || dt.getHours() !== Number(parts[1]) || dt.getMinutes() !== Number(parts[2]))
    throw new Error("This time does not exist on that date. Check daylight-saving time.");
  return dt;
}
/** Compare sleep stretches by actual elapsed time. Only overnight or chronologically ordered spans are accepted. */
export function newStretchTimes(nightDate: string, startTime: string, endTime: string, previous?: SleepStretch, now = new Date()) {
  let start = clockDate(nightDate, startTime);
  if (previous) {
    const endOfPrevious = Date.parse(previous.ended_at);
    for (let i = 0; start.getTime() < endOfPrevious && i < 3; i++)
      start = clockDate(addDays(localDateKey(start), 1), startTime);
    const gap = start.getTime() - endOfPrevious;
    if (gap < 0 || gap > 24 * 3600000) throw new Error("Add stretches in order, with no more than 24 hours between them.");
  }
  let end = clockDate(localDateKey(start), endTime);
  if (end.getTime() <= start.getTime()) end = clockDate(addDays(localDateKey(start), 1), endTime);
  const minutes = Math.round((end.getTime() - start.getTime()) / 60000);
  if (minutes <= 0 || minutes > 18 * 60) throw new Error("Each sleep stretch must last between one minute and 18 hours.");
  if (end.getTime() > now.getTime() + 10 * 60000) throw new Error("Wake time cannot be in the future.");
  return { started_at: start.toISOString(), ended_at: end.toISOString(), minutes };
}
export function recommendedNightDate(now = new Date()) {
  return now.getHours() < 18 ? addDays(localDateKey(now), -1) : localDateKey(now);
}
export function timeFromIso(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}
