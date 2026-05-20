import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const url =
  process.env.DATABASE_URL ??
  // Builds without env vars get a placeholder. Runtime calls will fail loudly
  // when actually invoked against this placeholder. Vercel/Neon will always set
  // DATABASE_URL in production.
  "postgres://placeholder:placeholder@localhost:5432/placeholder";

const sql = neon(url);
export const db = drizzle(sql, { schema });
export * from "./schema";
