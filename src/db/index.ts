import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

export type DrizzleDatabase = PostgresJsDatabase<typeof schema>;

// Create a PostgreSQL client
const client = postgres(process.env.DATABASE_URL!);

// Create a Drizzle instance
export const db = drizzle(client, { schema });
