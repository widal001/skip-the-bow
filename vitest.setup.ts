// vitest.setup.ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { vi } from "vitest";

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

// Run migrations
const db = drizzle(client);
await migrate(db, { migrationsFolder: "./migrations" });
