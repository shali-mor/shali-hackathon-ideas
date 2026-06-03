import "./load-env";
import { neon } from "@neondatabase/serverless";
import { mkdirSync, writeFileSync } from "node:fs";

// Logical JSON snapshot of every data table, written to ./backups (gitignored).
// Uses the same Neon driver the app uses, so it works wherever the app runs.
// Restore by inserting the rows back per table.
async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || url.includes("placeholder")) {
    throw new Error("DATABASE_URL is not set (check .env.local).");
  }
  const sql = neon(url);

  const dump = {
    generatedAt: new Date().toISOString(),
    host: new URL(url).host,
    tables: {
      submissions: await sql`select * from submissions`,
      user: await sql`select * from "user"`,
      account: await sql`select * from account`,
      session: await sql`select * from session`,
      verificationToken: await sql`select * from "verificationToken"`,
    } as Record<string, unknown[]>,
  };

  mkdirSync("backups", { recursive: true });
  const stamp = dump.generatedAt.replace(/[:.]/g, "-");
  const file = `backups/backup-${stamp}.json`;
  writeFileSync(file, JSON.stringify(dump, null, 2));

  const counts = Object.entries(dump.tables)
    .map(([t, rows]) => `${t}=${rows.length}`)
    .join(", ");
  console.log(`Backed up ${dump.host}`);
  console.log(`  tables: ${counts}`);
  console.log(`  → ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
