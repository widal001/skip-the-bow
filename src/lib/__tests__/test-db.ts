import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "../../db/schema";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

export function createTestDb() {
  const sqlite = new Database(":memory:");
  const db = drizzle(sqlite, { schema });

  // Push the schema to the in-memory database
  migrate(db, { migrationsFolder: "migrations" });

  return { db, sqlite };
}
