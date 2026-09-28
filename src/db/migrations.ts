import type { Database } from "./database";
export const schemaV1 = `
CREATE TABLE check_ins (id TEXT PRIMARY KEY NOT NULL, local_date TEXT NOT NULL, created_at TEXT NOT NULL, intensity INTEGER CHECK(intensity BETWEEN 1 AND 5), note TEXT NOT NULL DEFAULT '', demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE check_in_feelings (check_in_id TEXT NOT NULL REFERENCES check_ins(id) ON DELETE CASCADE, feeling_id TEXT NOT NULL, feeling_word TEXT NOT NULL, family_id TEXT NOT NULL, family_label TEXT NOT NULL, selection_order INTEGER NOT NULL, PRIMARY KEY(check_in_id, feeling_id));
CREATE TABLE reflections (id TEXT PRIMARY KEY NOT NULL, local_date TEXT NOT NULL, created_at TEXT NOT NULL, text TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE tool_sessions (id TEXT PRIMARY KEY NOT NULL, tool_id TEXT NOT NULL, check_in_id TEXT REFERENCES check_ins(id) ON DELETE SET NULL, local_date TEXT NOT NULL, created_at TEXT NOT NULL, responses TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE supports (id TEXT PRIMARY KEY NOT NULL, name TEXT NOT NULL, type TEXT NOT NULL, mode TEXT NOT NULL, weekdays TEXT NOT NULL DEFAULT '[]', time TEXT NOT NULL DEFAULT '', url TEXT NOT NULL DEFAULT '', location TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '', meeting_id TEXT NOT NULL DEFAULT '', passcode TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '', favorite INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1, reminder_offset INTEGER, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE support_takeaways (id TEXT PRIMARY KEY NOT NULL, support_id TEXT REFERENCES supports(id) ON DELETE SET NULL, local_date TEXT NOT NULL, created_at TEXT NOT NULL, text TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0);
CREATE INDEX check_ins_date ON check_ins(local_date);
CREATE INDEX reflections_date ON reflections(local_date);
CREATE INDEX tool_sessions_date ON tool_sessions(local_date);
CREATE INDEX tool_sessions_check_in ON tool_sessions(check_in_id);
CREATE INDEX takeaways_date ON support_takeaways(local_date);
CREATE INDEX takeaways_support ON support_takeaways(support_id);
`;
export async function migrate(db: Database) {
  await db.execAsync("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;");
  await db.transaction(async (tx) => {
    const version = await tx.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    if ((version?.user_version ?? 0) > 1)
      throw new Error("This database needs a newer version of Undergrowth.");
    if (!version?.user_version) {
      await tx.execAsync(schemaV1);
      await tx.execAsync("PRAGMA user_version = 1");
    }
  });
}
