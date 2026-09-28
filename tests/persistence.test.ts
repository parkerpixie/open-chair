/// <reference types="node" />
import { DatabaseSync } from "node:sqlite";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SQLiteDatabase } from "expo-sqlite";
vi.mock("expo-sqlite", () => ({ openDatabaseAsync: vi.fn() }));
import { openDatabaseAsync } from "expo-sqlite";
import { openLocalDatabase } from "../src/db/open";
import { migrate } from "../src/db/migrations";
import { Repository, newSupport } from "../src/db/repository";
import { feelings } from "../src/features/check-in/catalog";
import { localDateKey } from "../src/lib/dates";

describe("isolated SQLite connections and disk persistence", () => {
  let directory: string;
  let handles: DatabaseSync[];
  beforeEach(() => {
    vi.stubGlobal("__DEV__", true);
    directory = mkdtempSync(join(tmpdir(), "open-chair-test-"));
    handles = [];
    vi.mocked(openDatabaseAsync).mockImplementation(async () => {
      const sql = new DatabaseSync(join(directory, "test.db"), {
        enableForeignKeyConstraints: false,
      });
      handles.push(sql);
      return {
        execAsync: async (query: string) => {
          sql.exec(query);
        },
        runAsync: async (
          query: string,
          ...params: (string | number | null)[]
        ) => sql.prepare(query).run(...params),
        getFirstAsync: async (
          query: string,
          ...params: (string | number | null)[]
        ) => sql.prepare(query).get(...params) ?? null,
        getAllAsync: async (
          query: string,
          ...params: (string | number | null)[]
        ) => sql.prepare(query).all(...params),
        closeAsync: async () => {
          sql.close();
          handles = handles.filter((handle) => handle !== sql);
        },
      } as unknown as SQLiteDatabase;
    });
  });
  afterEach(() => {
    for (const handle of handles) handle.close();
    rmSync(directory, { recursive: true, force: true });
    vi.unstubAllGlobals();
  });
  it("retains check-ins after every connection is closed and reopened", async () => {
    const db = await openLocalDatabase();
    await migrate(db);
    const repo = new Repository(db);
    await repo.saveCheckIn(feelings.slice(0, 2), 2, "A persisted note");
    await repo.saveReflection("A persisted reflection");
    for (const handle of handles) handle.close();
    handles = [];
    const reopened = await openLocalDatabase();
    await migrate(reopened);
    const history = await new Repository(reopened).history(
      localDateKey(),
      localDateKey(),
    );
    expect(history.checkIns[0].note).toBe("A persisted note");
    expect(history.checkIns[0].feelings).toHaveLength(2);
    expect(history.reflections[0].text).toBe("A persisted reflection");
  });
  it("enables foreign keys on transaction connections before BEGIN", async () => {
    const db = await openLocalDatabase();
    await migrate(db);
    const repo = new Repository(db);
    await repo.saveCheckIn(feelings.slice(0, 2), null, "");
    await db.transaction(async (tx) => {
      expect(await tx.getFirstAsync("PRAGMA foreign_keys")).toEqual({
        foreign_keys: 1,
      });
    });
    await repo.clear();
    expect(await db.getAllAsync("SELECT * FROM check_in_feelings")).toEqual([]);
    await expect(
      db.transaction(async (tx) => {
        await tx.runAsync(
          "INSERT INTO check_in_feelings VALUES ('missing','happy','Happy','bright','Bright',0)",
        );
      }),
    ).rejects.toThrow();
  });
  it("rolls back writes and releases an isolated connection on error", async () => {
    const db = await openLocalDatabase();
    await migrate(db);
    const count = handles.length;
    await expect(
      db.transaction(async (tx) => {
        await tx.runAsync(
          "INSERT INTO reflections VALUES ('test','2026-09-27','stamp','Example',0)",
        );
        throw new Error("abort");
      }),
    ).rejects.toThrow("abort");
    expect(await db.getAllAsync("SELECT * FROM reflections")).toEqual([]);
    expect(handles.length).toBe(count);
    const repo = new Repository(db);
    await repo.saveSupport({ ...newSupport(), name: "After rollback" });
    expect(await repo.supports()).toHaveLength(1);
  });
});
