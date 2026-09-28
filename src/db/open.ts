import { openDatabaseAsync } from "expo-sqlite";
import { connectionMethods, type Database } from "./database";
const databaseName = "undergrowth.db";
const connectionPragmas =
  "PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;";
export async function openLocalDatabase(): Promise<Database> {
  const db = await openDatabaseAsync(databaseName);
  await db.execAsync(connectionPragmas);
  return {
    ...connectionMethods(db),
    async transaction(work) {
      // Expo's exclusive helper creates a new connection without inheriting
      // foreign_keys. Configure our isolated connection BEFORE opening a transaction.
      const tx = await openDatabaseAsync(databaseName, {
        useNewConnection: true,
      });
      let began = false;
      try {
        await tx.execAsync(connectionPragmas);
        await tx.execAsync("BEGIN IMMEDIATE");
        began = true;
        await work(connectionMethods(tx));
        await tx.execAsync("COMMIT");
        began = false;
      } catch (error) {
        if (began) await tx.execAsync("ROLLBACK");
        throw error;
      } finally {
        await tx.closeAsync();
      }
    },
  };
}
