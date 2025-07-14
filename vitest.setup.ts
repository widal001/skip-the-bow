// vitest.setup.ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";
import { vi } from "vitest";
import * as schema from "./src/db/schema";

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

// Create shared database instance
const db = drizzle(client, { schema });

// Run migrations
await migrate(db, { migrationsFolder: "./migrations" });

// Export the shared database instance for tests
export { db, client };
