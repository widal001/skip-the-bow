import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "./schema";
import config from "../../drizzle.config";

// Create a SQLite database instance using the same configuration as drizzle.config.ts
const sqlite = new Database(config.dbCredentials.url);

// Create a Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export the schema for use in other files
export { schema };
