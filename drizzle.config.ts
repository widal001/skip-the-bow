import type { Config } from "drizzle-kit";
import * as dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const url = new URL(connectionString);
const isProduction = process.env.NODE_ENV === "production";
const isStaging = process.env.NODE_ENV === "staging";

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    host: url.hostname,
    port: parseInt(url.port || "5432"),
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: isProduction || isStaging,
  },
} satisfies Config;
