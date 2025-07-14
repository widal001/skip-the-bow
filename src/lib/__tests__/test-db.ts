import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../db/schema";
import * as dotenv from "dotenv";
import type { DrizzleDatabase } from "../../db";
import { sql } from "drizzle-orm";

dotenv.config();

export async function createTestDb() {
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error("TEST_DATABASE_URL environment variable is not set");
  }

  const client = postgres(process.env.TEST_DATABASE_URL, {
    max: 1,
    onnotice: () => {}, // Suppress notices
  });
  const db = drizzle(client, { schema });

  return { db, client };
}

export async function cleanupTestDb(client: postgres.Sql) {
  await client.end();
}
// Helper to run a test in a transaction
export async function withTransaction<T>(
  db: DrizzleDatabase,
  testFn: (db: DrizzleDatabase) => Promise<T>
): Promise<T> {
  // Start a transaction
  await db.execute(sql`BEGIN`);

  try {
    // Run the test
    const result = await testFn(db);
    // Rollback the transaction
    await db.execute(sql`ROLLBACK`);
    return result;
  } catch (error) {
    // Ensure rollback on error
    await db.execute(sql`ROLLBACK`);
    throw error;
  }
}
