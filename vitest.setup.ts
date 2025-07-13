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
  } catch (error: unknown) {
    // Check if this is a duplicate key error (expected when migrations already exist)
    const errorObj = error as { code?: string; message?: string };
    if (
      errorObj?.code === "23505" ||
      errorObj?.message?.includes("duplicate key") ||
      errorObj?.message?.includes("already exists")
    ) {
      console.log(
        "Migration completed (duplicate/conflict errors are expected when migrations already exist):",
        errorObj.message
      );
    } else {
      // Re-throw unexpected errors
      console.error("Unexpected migration error:", error);
      throw error;
    }
  }
});
