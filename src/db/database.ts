import type { SQLiteDatabase, SQLiteBindValue } from "expo-sqlite";
/** Small injectable boundary shared by Expo SQLite and the SQL integration tests. */
export interface Connection {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SQLiteBindValue[]): Promise<unknown>;
  getFirstAsync<T>(
    sql: string,
    ...params: SQLiteBindValue[]
  ): Promise<T | null>;
  getAllAsync<T>(sql: string, ...params: SQLiteBindValue[]): Promise<T[]>;
}
export interface Database extends Connection {
  transaction(work: (connection: Connection) => Promise<void>): Promise<void>;
}
export function connectionMethods(db: SQLiteDatabase): Connection {
  return {
    execAsync: db.execAsync.bind(db),
    runAsync: db.runAsync.bind(db),
    getFirstAsync: db.getFirstAsync.bind(db),
    getAllAsync: db.getAllAsync.bind(db),
  };
}
