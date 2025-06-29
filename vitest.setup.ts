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

const client = postgres(process.env.TEST_DATABASE_URL!, { max: 1 });
const db = drizzle(client);

beforeAll(async () => {
  await migrate(db, { migrationsFolder: "./migrations" });
});
