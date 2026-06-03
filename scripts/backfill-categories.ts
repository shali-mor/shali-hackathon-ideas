import "./load-env";
import { eq } from "drizzle-orm";
import { db, submissions } from "../src/lib/db";
import { categorize, categoryLabel } from "../src/lib/insights";

// Guess a category for every existing submission from its text. Run once after
// the category column lands. Idempotent: re-running just recomputes the guess.
// Pass --only-other to leave any already-set (non-"other") categories alone.
async function main() {
  const onlyOther = process.argv.includes("--only-other");
  const rows = await db.select().from(submissions);
  console.log(`Found ${rows.length} submission(s).`);

  let updated = 0;
  for (const row of rows) {
    if (onlyOther && row.category !== "other") continue;
    const guess = categorize(row);
    if (guess === row.category) continue;
    await db
      .update(submissions)
      .set({ category: guess })
      .where(eq(submissions.id, row.id));
    updated++;
    console.log(`  • "${row.title}" → ${categoryLabel(guess)} (${guess})`);
  }

  console.log(`\nDone. Updated ${updated} of ${rows.length}.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
