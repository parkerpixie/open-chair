/// <reference types="node" />
import { DatabaseSync } from "node:sqlite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Database, Connection } from "../src/db/database";
import { migrate } from "../src/db/migrations";
import { Repository, newSupport } from "../src/db/repository";
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
    expect(sql.prepare("PRAGMA user_version").get()?.user_version).toBe(1);
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
  it("rejects developer utilities in production", async () => {
    vi.stubGlobal("__DEV__", false);
    await expect(repository.seed()).rejects.toThrow();
    await expect(repository.clear()).rejects.toThrow();
  });
});
