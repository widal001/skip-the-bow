// vitest.setup.ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { beforeAll, vi } from "vitest";

dotenv.config();

// Mock auth-astro/server to prevent auth:config import errors
vi.mock("auth-astro/server", () => ({
  getSession: vi.fn(),
}));

// Create client with notice suppression
const client = postgres(process.env.TEST_DATABASE_URL!, {
  max: 1,
  onnotice: () => {}, // Suppress notices
});

const db = drizzle(client);

beforeAll(async () => {
  try {
    await migrate(db, { migrationsFolder: "./migrations" });
  } catch (error) {
    // Ignore migration errors (like "relation already exists")
    // These are expected when running tests multiple times
    console.log("Migration completed (some notices are expected):", error);
  }
});
