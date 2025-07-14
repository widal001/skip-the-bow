// vitest-global-setup.ts
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

export default async function globalSetup() {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    throw new Error("Missing TEST_DATABASE_URL in env");
  }

  const client = postgres(url, {
    max: 1,
    onnotice: () => {}, // suppress notices
  });

  const db = drizzle(client);

  console.log("Running database migrations...");

  await migrate(db, {
    migrationsFolder: "./migrations", // or wherever yours are
  });

  await client.end();
}
