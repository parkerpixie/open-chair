import type { Database } from "./database";
import { newStretchTimes, type SleepNight, type SleepStretch, type Restfulness } from "../features/sleep/model";
import { localDateKey, addDays, compareDates } from "../lib/dates";
import { requiredText, validUrl } from "../lib/validation";
import { feelings, type Feeling } from "../features/check-in/catalog";
import { toolById } from "../features/tools/catalog";
import { stepsForTool } from "../features/tools/exercises";
import type {
  CheckIn,
  History,
  LibraryItem,
  Reflection,
  Support,
  Takeaway,
  ToolSession,
} from "./types";
const id = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export class Repository {
  constructor(private db: Database) {}
  async saveCheckIn(
    selected: Feeling[],
    intensity: number | null,
    note: string,
    date = new Date(),
    demo = 0,
  ) {
    if (!selected.length) throw new Error("Choose at least one feeling.");
    if (note.length > 500)
      throw new Error("Keep your note within 500 characters.");
    if (
      intensity !== null &&
      (!Number.isInteger(intensity) || intensity < 1 || intensity > 5)
    )
      throw new Error("Choose an intensity from 1 to 5.");
    const unique = [...new Set(selected.map((f) => f.id))].map((fid) => {
      const feeling = feelings.find((f) => f.id === fid);
      if (!feeling) throw new Error("Unknown feeling.");
      return feeling;
    });
    const key = id();
    await this.db.transaction(async (tx) => {
      await tx.runAsync(
        "INSERT INTO check_ins (id,local_date,created_at,intensity,note,demo) VALUES (?,?,?,?,?,?)",
        key,
        localDateKey(date),
        date.toISOString(),
        intensity,
        note.trim(),
        demo,
      );
      for (const [order, f] of unique.entries())
        await tx.runAsync(
          "INSERT INTO check_in_feelings VALUES (?,?,?,?,?,?)",
          key,
          f.id,
          f.word,
          f.familyId,
          f.familyLabel,
          order,
        );
    });
    return key;
  }
  /** Calendar markers read only indexed date columns, never a month of journal text. */
  async activityDates(from: string, to: string): Promise<string[]> {
    if (compareDates(from, to) > 0)
      throw new Error("Date range must be in calendar order.");
    const rows = await this.db.getAllAsync<{ local_date: string }>(
      `SELECT local_date FROM check_ins WHERE local_date BETWEEN ? AND ?
       UNION SELECT local_date FROM reflections WHERE local_date BETWEEN ? AND ?
       UNION SELECT local_date FROM tool_sessions WHERE local_date BETWEEN ? AND ?
       UNION SELECT local_date FROM support_takeaways WHERE local_date BETWEEN ? AND ?
       ORDER BY local_date`,
      from,
      to,
      from,
      to,
      from,
      to,
      from,
      to,
    );
    return rows.map((row) => row.local_date);
  }
  async history(from: string, to: string): Promise<History> {
    const checkIns = await this.db.getAllAsync<Omit<CheckIn, "feelings">>(
      "SELECT * FROM check_ins WHERE local_date BETWEEN ? AND ? ORDER BY created_at DESC",
      from,
      to,
    );
    const rows = await this.db.getAllAsync<Feeling & { check_in_id: string }>(
      "SELECT f.check_in_id, f.feeling_id AS id, f.feeling_word AS word, f.family_id AS familyId, f.family_label AS familyLabel FROM check_in_feelings f JOIN check_ins c ON c.id=f.check_in_id WHERE c.local_date BETWEEN ? AND ? ORDER BY f.selection_order",
      from,
      to,
    );
    const grouped = new Map<string, Feeling[]>();
    for (const row of rows)
      grouped.set(row.check_in_id, [
        ...(grouped.get(row.check_in_id) ?? []),
        row,
      ]);
    return {
      checkIns: checkIns.map((c) => ({
        ...c,
        feelings: grouped.get(c.id) ?? [],
      })),
      reflections: await this.db.getAllAsync<Reflection>(
        "SELECT * FROM reflections WHERE local_date BETWEEN ? AND ? ORDER BY created_at DESC",
        from,
        to,
      ),
      sessions: await this.db.getAllAsync<ToolSession>(
        "SELECT * FROM tool_sessions WHERE local_date BETWEEN ? AND ? ORDER BY created_at DESC",
        from,
        to,
      ),
      takeaways: await this.db.getAllAsync<Takeaway>(
        "SELECT * FROM support_takeaways WHERE local_date BETWEEN ? AND ? ORDER BY created_at DESC",
        from,
        to,
      ),
    };
  }
  async saveReflection(text: string, date = new Date(), demo = 0) {
    await this.db.runAsync(
      "INSERT INTO reflections VALUES (?,?,?,?,?)",
      id(),
      localDateKey(date),
      date.toISOString(),
      requiredText(text, 500),
      demo,
    );
  }
  async deleteReflection(key: string) {
    await this.db.runAsync("DELETE FROM reflections WHERE id=?", key);
  }
  async saveSession(
    toolId: string,
    checkInId: string | null,
    responses: string[],
    date = new Date(),
    demo = 0,
  ) {
    const tool = toolById(toolId);
    if (!tool || responses.length !== stepsForTool(tool).length)
      throw new Error("This guided tool is unavailable.");
    const clean = responses.map((text) => text.trim() ? requiredText(text, 1000) : "");
    if (!clean.some(Boolean)) throw new Error("Write or select something to save.");
    await this.db.runAsync(
      "INSERT INTO tool_sessions VALUES (?,?,?,?,?,?,?)",
      id(),
      toolId,
      checkInId,
      localDateKey(date),
      date.toISOString(),
      JSON.stringify(clean),
      demo,
    );
  }
  async supports(): Promise<Support[]> {
    const rows = await this.db.getAllAsync<
      Omit<Support, "weekdays"> & { weekdays: string }
    >(
      "SELECT * FROM supports ORDER BY active DESC, favorite DESC, name COLLATE NOCASE",
    );
    return rows.map((s) => ({ ...s, weekdays: JSON.parse(s.weekdays) }));
  }
  async saveSupport(s: Support) {
    const name = requiredText(s.name, 100);
    if (s.type === "Podcast" && !validUrl(s.url))
      throw new Error("Add a full https:// link to listen to this podcast.");
    if (s.artwork_url && !validUrl(s.artwork_url))
      throw new Error("Enter a valid https:// artwork URL.");
    if (s.platform.length > 60) throw new Error("Keep the platform under 60 characters.");
    if (s.mode === "Online" && s.type !== "Podcast" && !validUrl(s.url))
      throw new Error("Enter a full http:// or https:// meeting link.");
    if (s.mode === "Phone" && !/^[+\d\s().-]{3,40}$/.test(s.phone))
      throw new Error("Enter a valid phone number.");
    if (s.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
      throw new Error("Choose valid weekdays.");
    if (s.weekdays.length && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))
      throw new Error("Enter the time as HH:MM, using 24-hour time.");
    await this.db.runAsync(
      `INSERT INTO supports (id,name,type,mode,weekdays,time,url,location,phone,meeting_id,passcode,notes,favorite,active,reminder_offset,created_at,updated_at,artwork_url,platform) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,type=excluded.type,mode=excluded.mode,weekdays=excluded.weekdays,time=excluded.time,url=excluded.url,location=excluded.location,phone=excluded.phone,meeting_id=excluded.meeting_id,passcode=excluded.passcode,notes=excluded.notes,favorite=excluded.favorite,active=excluded.active,reminder_offset=excluded.reminder_offset,artwork_url=excluded.artwork_url,platform=excluded.platform,updated_at=excluded.updated_at`,
      s.id,
      name,
      s.type,
      s.mode,
      JSON.stringify([...new Set(s.weekdays)]),
      s.time,
      s.url.trim(),
      s.location.trim(),
      s.phone.trim(),
      s.meeting_id.trim(),
      s.passcode.trim(),
      s.notes.trim(),
      s.favorite,
      s.active,
      s.reminder_offset,
      s.created_at,
      new Date().toISOString(),
      s.artwork_url.trim(),
      s.platform.trim(),
    );
  }
  async deleteSupport(key: string) {
    await this.db.runAsync("DELETE FROM supports WHERE id=?", key);
  }
  async takeaways(key: string) {
    return this.db.getAllAsync<Takeaway>(
      "SELECT * FROM support_takeaways WHERE support_id=? ORDER BY created_at DESC LIMIT 100",
      key,
    );
  }
  async saveTakeaway(supportId: string, text: string) {
    const now = new Date();
    await this.db.runAsync(
      "INSERT INTO support_takeaways VALUES (?,?,?,?,?,0)",
      id(),
      supportId,
      localDateKey(now),
      now.toISOString(),
      requiredText(text, 1000),
    );
  }

  /** Private on-device collection. No external URLs are fetched by the repository. */
  async libraryItems(): Promise<LibraryItem[]> {
    return this.db.getAllAsync<LibraryItem>(
      "SELECT * FROM library_items ORDER BY favorite DESC, updated_at DESC"
    );
  }

  async saveLibraryItem(item: LibraryItem): Promise<void> {
    const title = requiredText(item.title, 180);
    const url = item.url.trim();
    const artwork = item.artwork_url.trim();
    if (url && !validUrl(url)) throw new Error("Enter a full https:// link for this item.");
    if (artwork && !validUrl(artwork)) throw new Error("Enter a full https:// artwork link.");
    if (item.creator.length > 180 || item.summary.length > 1000 || item.notes.length > 2000)
      throw new Error("One of the descriptions is too long.");
    if (!["podcast", "reflection", "article", "video", "other"].includes(item.kind))
      throw new Error("Choose a supported item type.");
    await this.db.runAsync(
      `INSERT INTO library_items
        (id,kind,title,url,creator,summary,artwork_url,notes,favorite,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?)
        ON CONFLICT(id) DO UPDATE SET
        kind=excluded.kind,title=excluded.title,url=excluded.url,creator=excluded.creator,
        summary=excluded.summary,artwork_url=excluded.artwork_url,notes=excluded.notes,
        favorite=excluded.favorite,updated_at=excluded.updated_at`,
      item.id, item.kind, title, url, item.creator.trim(), item.summary.trim(),
      artwork, item.notes.trim(), item.favorite ? 1 : 0,
      item.created_at, new Date().toISOString()
    );
  }

  async deleteLibraryItem(key: string): Promise<void> {
    await this.db.runAsync("DELETE FROM library_items WHERE id=?", key);
  }


  async sleepNights(): Promise<SleepNight[]> {
    const nights = await this.db.getAllAsync<Omit<SleepNight, "stretches">>(
      "SELECT * FROM sleep_nights ORDER BY COALESCE(completed_at, created_at) DESC"
    );
    const stretches = await this.db.getAllAsync<SleepStretch>(
      "SELECT * FROM sleep_stretches ORDER BY started_at"
    );
    return nights.map(n => ({ ...n, stretches: stretches.filter(s => s.night_id === n.id) }));
  }

  async currentSleepNight(): Promise<SleepNight | null> {
    return (await this.sleepNights()).find(n => !n.completed_at) ?? null;
  }

  async startSleepNight(nightDate: string): Promise<void> {
    const open = await this.currentSleepNight();
    if (open) throw new Error("Finish the current night before starting another.");
    // Protect existing completed dates from accidental replacement.
    if ((await this.sleepNights()).some(n => n.night_date === nightDate && n.completed_at))
      throw new Error("This night is already saved. You can review it below.");
    const now = new Date().toISOString();
    await this.db.runAsync(
      "INSERT INTO sleep_nights (id, night_date, created_at, updated_at) VALUES (?,?,?,?)",
      id(), nightDate, now, now
    );
  }

  async addSleepStretch(nightId: string, startTime: string, endTime: string, estimated = false, note = ""): Promise<void> {
    const night = (await this.sleepNights()).find(n => n.id === nightId);
    if (!night || night.completed_at) throw new Error("This sleep night is already finished or unavailable.");
    if (note.length > 160) throw new Error("Keep your sleep note within 160 characters.");
    const latest = night.stretches[night.stretches.length - 1];
    const times = newStretchTimes(night.night_date, startTime, endTime, latest);
    await this.db.transaction(async tx => {
      await tx.runAsync(
        "INSERT INTO sleep_stretches (id, night_id, started_at, ended_at, estimated, note) VALUES (?,?,?,?,?,?)",
        id(), night.id, times.started_at, times.ended_at, estimated ? 1 : 0, note.trim()
      );
      await tx.runAsync("UPDATE sleep_nights SET updated_at=? WHERE id=?", new Date().toISOString(), night.id);
    });
  }

  async undoLastSleepStretch(nightId: string): Promise<void> {
    const night = (await this.sleepNights()).find(n => n.id === nightId);
    if (!night || night.completed_at || !night.stretches.length) throw new Error("No unfinished sleep stretch to undo.");
    await this.db.runAsync("DELETE FROM sleep_stretches WHERE id=?", night.stretches[night.stretches.length - 1].id);
  }

  async discardEmptySleepNight(nightId: string): Promise<void> {
    const night = (await this.sleepNights()).find(n => n.id === nightId);
    if (!night || night.completed_at || night.stretches.length) throw new Error("Only empty unfinished nights can be discarded.");
    await this.db.runAsync("DELETE FROM sleep_nights WHERE id=?", nightId);
  }

  async finishSleepNight(nightId: string, restfulness: Restfulness, note = ""): Promise<void> {
    const night = (await this.sleepNights()).find(n => n.id === nightId);
    if (!night || night.completed_at || !night.stretches.length) throw new Error("Add a sleep stretch before finishing.");
    if (![1,2,3,4,5].includes(restfulness)) throw new Error("Choose how rested you feel.");
    if (note.length > 500) throw new Error("Keep your note within 500 characters.");
    const wakeDate = localDateKey(new Date(night.stretches[night.stretches.length - 1].ended_at));
    const others = await this.sleepNights();
    if (others.some(n => n.id !== night.id && n.completed_at && n.wake_date === wakeDate))
      throw new Error("Another completed sleep record already exists on that wake-up date.");
    const now = new Date().toISOString();
    await this.db.runAsync(
      "UPDATE sleep_nights SET restfulness=?,subjective_note=?,wake_date=?,completed_at=?,updated_at=? WHERE id=? AND completed_at IS NULL",
      restfulness, note.trim(), wakeDate, now, now, night.id
    );
  }

  async clear(demoOnly = false) {
    if (!__DEV__) throw new Error("Development action unavailable.");
    await this.db.transaction(async (tx) => {
      for (const table of [
        "support_takeaways",
        "tool_sessions",
        "reflections",
        "check_ins",
      ])
        await tx.execAsync(
          `DELETE FROM ${table}${demoOnly ? " WHERE demo=1" : ""}`,
        );
      if (!demoOnly) await tx.execAsync("DELETE FROM supports");
    });
  }
  async seed() {
    if (!__DEV__) throw new Error("Development action unavailable.");
    await this.clear(true);
    for (let i = 0; i < 18; i++) {
      const date = new Date(`${addDays(localDateKey(), -i)}T12:00:00`);
      const words =
        i < 7
          ? ["Grounded", "Steady", ...(i < 4 ? ["Worried"] : [])]
          : ["Curious", "Inspired"];
      await this.saveCheckIn(
        feelings.filter((f) => words.includes(f.word)),
        null,
        "Demo · A moment to notice the conditions around today.",
        date,
        1,
      );
      if (i % 3 === 0)
        await this.saveReflection(
          "Demo · A walk in the garden with a friend.",
          date,
          1,
        );
      if (i % 5 === 0)
        await this.saveSession(
          "stop",
          null,
          ["A busy moment.", "Some space to pause.", "One small step."],
          date,
          1,
        );
    }
  }
}
export function newSupport(): Support {
  const now = new Date().toISOString();
  return {
    id: id(),
    name: "",
    type: "Other",
    mode: "Flexible / other",
    artwork_url: "",
    platform: "",
    weekdays: [],
    time: "09:00",
    url: "",
    location: "",
    phone: "",
    meeting_id: "",
    passcode: "",
    notes: "",
    favorite: 0,
    active: 1,
    reminder_offset: null,
    created_at: now,
    updated_at: now,
  };
}

export function newLibraryItem(): LibraryItem {
  const now = new Date().toISOString();
  return {
    id: id(), kind: "podcast", title: "", url: "", creator: "",
    summary: "", artwork_url: "", notes: "", favorite: 0,
    created_at: now, updated_at: now,
  };
}
