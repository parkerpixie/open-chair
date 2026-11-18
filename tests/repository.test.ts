/// <reference types="node" />
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, Connection } from "../src/db/database";
import { migrate, schemaV1 } from "../src/db/migrations";
import { Repository, newSupport, newLibraryItem } from "../src/db/repository";
import { feelings } from "../src/features/check-in/catalog";
import { localDateKey, addDays } from "../src/lib/dates";
import { derivePatterns } from "../src/features/patterns/derive";
// Exercise actual SQLite SQL and transactions; only the native bridge is adapted.
function adapter(sql: DatabaseSync): Database {
  const db = {
    execAsync: async (query: string) => {
      sql.exec(query);
    },
    runAsync: async (query: string, ...params: (string | number | null)[]) =>
      sql.prepare(query).run(...params),
    getFirstAsync: async (
      query: string,
      ...params: (string | number | null)[]
    ) => sql.prepare(query).get(...params) ?? null,
    getAllAsync: async (query: string, ...params: (string | number | null)[]) =>
      sql.prepare(query).all(...params),
    transaction: async (action: (tx: Connection) => Promise<void>) => {
      sql.exec("BEGIN");
      try {
        await action(db as unknown as Connection);
        sql.exec("COMMIT");
      } catch (error) {
        sql.exec("ROLLBACK");
        throw error;
      }
    },
  };
  return db as unknown as Database;
}
describe("SQLite repositories", () => {
  let sql: DatabaseSync;
  let db: Database;
  let repository: Repository;
  const today = localDateKey();
  beforeEach(async () => {
    vi.stubGlobal("__DEV__", true);
    sql = new DatabaseSync(":memory:");
    db = adapter(sql);
    await migrate(db);
    repository = new Repository(db);
  });
  afterEach(() => {
    sql.close();
    vi.unstubAllGlobals();
  });
  it("migrates once and preserves existing records on repeated initialization", async () => {
    await repository.saveCheckIn(feelings.slice(0, 2), 3, "A note");
    await migrate(db);
    const h = await repository.history(today, today);
    expect(h.checkIns[0].feelings).toHaveLength(2);
    expect(h.checkIns[0].note).toBe("A note");
    expect(sql.prepare("PRAGMA user_version").get()?.user_version).toBe(3);
  });
  it("rolls back the entire check-in if a child insert fails", async () => {
    sql.exec(
      "CREATE TRIGGER reject_feeling BEFORE INSERT ON check_in_feelings BEGIN SELECT RAISE(ABORT, 'test failure'); END;",
    );
    await expect(
      repository.saveCheckIn(feelings.slice(0, 2), null, ""),
    ).rejects.toThrow();
    expect((await repository.history(today, today)).checkIns).toEqual([]);
  });
  it("deduplicates selections and validates before writes", async () => {
    await repository.saveCheckIn([feelings[0], feelings[0]], null, "");
    expect(
      (await repository.history(today, today)).checkIns[0].feelings,
    ).toHaveLength(1);
    await expect(repository.saveCheckIn([], null, "")).rejects.toThrow();
    await expect(
      repository.saveCheckIn([feelings[0]], 6, ""),
    ).rejects.toThrow();
  });
  it("creates, updates, deactivates, and deletes supports while retaining takeaways", async () => {
    const s = { ...newSupport(), name: "Community class", weekdays: [1, 3] };
    await repository.saveSupport(s);
    expect((await repository.supports())[0].weekdays).toEqual([1, 3]);
    await repository.saveSupport({ ...s, name: "Evening class", active: 0 });
    expect((await repository.supports())[0].active).toBe(0);
    await repository.saveTakeaway(s.id, "A useful thought.");
    await repository.deleteSupport(s.id);
    expect(await repository.supports()).toEqual([]);
    expect(
      (await repository.history(today, today)).takeaways[0].support_id,
    ).toBeNull();
  });
  it("validates online links and weekly times", async () => {
    await expect(
      repository.saveSupport({
        ...newSupport(),
        name: "Support",
        mode: "Online",
        url: "javascript:alert(1)",
      }),
    ).rejects.toThrow();
    await expect(
      repository.saveSupport({
        ...newSupport(),
        name: "Support",
        weekdays: [1],
        time: "99:00",
      }),
    ).rejects.toThrow();
  });
  it("persists and deletes reflections, and links completed tools", async () => {
    const id = await repository.saveCheckIn([feelings[0]], null, "");
    await repository.saveReflection("Something to keep");
    await repository.saveSession("stop", id, ["Pause", "Observe", "Proceed"]);
    const h = await repository.history(today, today);
    expect(h.sessions[0].check_in_id).toBe(id);
    expect(JSON.parse(h.sessions[0].responses)).toEqual([
      "Pause",
      "Observe",
      "Proceed",
    ]);
    await repository.deleteReflection(h.reflections[0].id);
    expect((await repository.history(today, today)).reflections).toEqual([]);
  });
  it("seeds useful observations and clears only marked demo data", async () => {
    await repository.saveReflection("Personal entry");
    await repository.seed();
    const h = await repository.history(addDays(today, -29), today);
    const patterns = derivePatterns(h, today);
    expect(patterns.map((p) => p.kind)).toEqual(
      expect.arrayContaining(["family", "feeling", "theme", "tool"]),
    );
    expect(patterns.some((p) => p.id.includes("-30-"))).toBe(true);
    await repository.seed();
    expect(
      (await repository.history(addDays(today, -29), today)).checkIns,
    ).toHaveLength(18);
    await repository.clear(true);
    const clean = await repository.history(addDays(today, -29), today);
    expect(clean.checkIns).toEqual([]);
    expect(clean.reflections[0].text).toBe("Personal entry");
  });
  it("reads unique activity markers from all four persisted sources within inclusive month bounds", async () => {
    await repository.saveCheckIn(
      [feelings[0]],
      null,
      "First",
      new Date(2026, 8, 1, 9),
    );
    await repository.saveCheckIn(
      [feelings[1]],
      null,
      "Second",
      new Date(2026, 8, 1, 11),
    );
    await repository.saveReflection("Kept", new Date(2026, 8, 2, 12));
    await repository.saveSession(
      "stop",
      null,
      ["One", "Two", "Three"],
      new Date(2026, 8, 3, 12),
    );
    await db.runAsync(
      "INSERT INTO support_takeaways VALUES (?,?,?,?,?,0)",
      "takeaway",
      null,
      "2026-09-30",
      "2026-10-01T04:59:00Z",
      "Saved thought",
    );
    await repository.saveReflection("Before", new Date(2026, 7, 31, 12));
    await repository.saveReflection("After", new Date(2026, 9, 1, 12));
    expect(await repository.activityDates("2026-09-01", "2026-09-30")).toEqual([
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-30",
    ]);
    const day = await repository.history("2026-09-01", "2026-09-01");
    expect(day.checkIns).toHaveLength(2);
    expect(day.checkIns.map((c) => c.note).sort()).toEqual(["First", "Second"]);
    expect(sql.prepare("PRAGMA user_version").get()?.user_version).toBe(3);
  });
  it("does not mark scheduled supports as activity and returns empty history for empty days", async () => {
    await repository.saveSupport({
      ...newSupport(),
      name: "Scheduled support",
      weekdays: [1, 2, 3],
    });
    expect(await repository.activityDates("2026-09-01", "2026-09-30")).toEqual(
      [],
    );
    expect(await repository.history("2026-09-28", "2026-09-28")).toEqual({
      checkIns: [],
      reflections: [],
      sessions: [],
      takeaways: [],
    });
  });
  it("updates markers after deleting the final activity and rejects invalid ranges", async () => {
    await repository.saveReflection("A note", new Date(2026, 8, 28, 23, 59));
    const h = await repository.history("2026-09-28", "2026-09-28");
    expect(await repository.activityDates("2026-09-28", "2026-09-28")).toEqual([
      "2026-09-28",
    ]);
    await repository.deleteReflection(h.reflections[0].id);
    expect(await repository.activityDates("2026-09-28", "2026-09-28")).toEqual(
      [],
    );
    await expect(
      repository.activityDates("2026-09-30", "2026-09-01"),
    ).rejects.toThrow();
    await expect(
      repository.activityDates("2026-02-30", "2026-03-01"),
    ).rejects.toThrow();
  });

  it("saves and edits podcasts with cover art, and keeps the library separate from check-ins", async () => {
    const show = {
      ...newLibraryItem(), title: "A podcast worth keeping", creator: "Host",
      url: "https://open.spotify.com/show/example",
      artwork_url: "https://example.com/cover.jpg", notes: "Try episode three.",
    };
    await repository.saveLibraryItem(show);
    expect(await repository.libraryItems()).toEqual([expect.objectContaining({
      id: show.id, title: show.title, artwork_url: show.artwork_url,
    })]);
    await repository.saveLibraryItem({ ...show, title: "A new title", favorite: 1 });
    expect((await repository.libraryItems())[0].title).toBe("A new title");
    expect(await repository.libraryItems()).toHaveLength(1);
    await repository.saveCheckIn([feelings[0]], null, "My feeling");
    await repository.deleteLibraryItem(show.id);
    expect(await repository.libraryItems()).toEqual([]);
    expect((await repository.history(today, today)).checkIns).toHaveLength(1);
  });

  it("upgrades existing version 1 journals and meeting records without deleting them", async () => {
    const oldSql = new DatabaseSync(":memory:");
    try {
      oldSql.exec(schemaV1 + "PRAGMA user_version = 1;");
      oldSql.prepare("INSERT INTO reflections VALUES (?, ?, ?, ?, ?)").run(
        "old-ref", "2026-11-17", "2026-11-17T12:00:00.000Z", "Don't lose this.", 0
      );
      oldSql.prepare(`INSERT INTO supports
        (id,name,type,mode,weekdays,time,url,location,phone,meeting_id,passcode,notes,favorite,active,reminder_offset,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
        "old-meeting", "Tuesday meeting", "Meeting", "Online", "[2]", "07:30",
        "https://example.com/meeting", "", "", "", "", "", 1, 1, null,
        "2026-11-17T12:00:00.000Z", "2026-11-17T12:00:00.000Z"
      );
      const upgradedDb = adapter(oldSql);
      await migrate(upgradedDb);
      const upgradedRepo = new Repository(upgradedDb);
      expect(oldSql.prepare("PRAGMA user_version").get()?.user_version).toBe(3);
      expect((await upgradedRepo.supports())[0].name).toBe("Tuesday meeting");
      expect((await upgradedRepo.history("2026-11-17", "2026-11-17")).reflections[0].text).toBe("Don't lose this.");
      expect(await upgradedRepo.libraryItems()).toEqual([]);
      await migrate(upgradedDb);
      expect((await upgradedRepo.supports())).toHaveLength(1);
    } finally { oldSql.close(); }
  });

  it("stores podcast Supports with Amazon Music URLs and cover artwork across migrations", async () => {
    const podcast = {
      ...newSupport(), type: "Podcast", name: "The Mel Robbins Podcast",
      platform: "Amazon Music",
      url: "https://music.amazon.com/podcasts/sample-show",
      artwork_url: "https://example.com/mel-robbins-art.jpg",
    };
    await repository.saveSupport(podcast);
    let saved = (await repository.supports()).find(s => s.id === podcast.id);
    expect(saved).toMatchObject({
      type: "Podcast", platform: "Amazon Music", url: podcast.url,
      artwork_url: podcast.artwork_url, weekdays: [],
    });
    await migrate(db);
    saved = (await repository.supports()).find(s => s.id === podcast.id);
    expect(saved?.artwork_url).toBe(podcast.artwork_url);
    await repository.saveSupport({ ...podcast, artwork_url: "https://example.com/new-cover.jpg" });
    expect((await repository.supports())[0].artwork_url).toBe("https://example.com/new-cover.jpg");
    await expect(repository.saveSupport({ ...podcast, url: "javascript:bad" })).rejects.toThrow();
  });
  it("rejects developer utilities in production", async () => {
    vi.stubGlobal("__DEV__", false);
    await expect(repository.seed()).rejects.toThrow();
    await expect(repository.clear()).rejects.toThrow();
  });
});
