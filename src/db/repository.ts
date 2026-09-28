import type { Database } from "./database";
import { localDateKey, addDays } from "../lib/dates";
import { requiredText, validUrl } from "../lib/validation";
import { feelings, type Feeling } from "../features/check-in/catalog";
import { toolById } from "../features/tools/catalog";
import type {
  CheckIn,
  History,
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
    if (!toolById(toolId)?.prompts || responses.length !== 3)
      throw new Error("This guided tool is unavailable.");
    const clean = responses.map((text) => requiredText(text, 1000));
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
    if (s.mode === "Online" && !validUrl(s.url))
      throw new Error("Enter a full http:// or https:// meeting link.");
    if (s.mode === "Phone" && !/^[+\d\s().-]{3,40}$/.test(s.phone))
      throw new Error("Enter a valid phone number.");
    if (s.weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6))
      throw new Error("Choose valid weekdays.");
    if (s.weekdays.length && !/^([01]\d|2[0-3]):[0-5]\d$/.test(s.time))
      throw new Error("Enter the time as HH:MM, using 24-hour time.");
    await this.db.runAsync(
      `INSERT INTO supports (id,name,type,mode,weekdays,time,url,location,phone,meeting_id,passcode,notes,favorite,active,reminder_offset,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,type=excluded.type,mode=excluded.mode,weekdays=excluded.weekdays,time=excluded.time,url=excluded.url,location=excluded.location,phone=excluded.phone,meeting_id=excluded.meeting_id,passcode=excluded.passcode,notes=excluded.notes,favorite=excluded.favorite,active=excluded.active,reminder_offset=excluded.reminder_offset,updated_at=excluded.updated_at`,
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
