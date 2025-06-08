import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export function createTestDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL environment variable is not set");
  }

  const client = postgres(process.env.TEST_DATABASE_URL);
  const db = drizzle(client, { schema });

  // Push the schema to the test database
  migrate(db, { migrationsFolder: "migrations" });

  return { db, client };
}
