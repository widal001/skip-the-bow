import * as dotenv from "dotenv";
import type { DrizzleDatabase } from "../../db";
import { sql } from "drizzle-orm";

dotenv.config();

// Import the shared database instance from vitest setup
import { db as sharedDb, client as sharedClient } from "../../../vitest.setup";

export async function createTestDb() {
  // Return the shared database instance instead of creating a new one
  return { db: sharedDb, client: sharedClient };
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
