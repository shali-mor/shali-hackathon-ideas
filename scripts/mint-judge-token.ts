import "dotenv/config";
import { mintJudgeToken } from "../src/lib/judge-tokens";

async function main() {
  const [, , name, email] = process.argv;
  if (!name || !email) {
    console.error('Usage: npm run mint-judge -- "Judge Name" judge@example.com');
    process.exit(1);
  }
  const token = await mintJudgeToken({ name, email });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${base}/judges?token=${encodeURIComponent(token)}`;
  console.log(`\nJudge: ${name} <${email}>`);
  console.log(`URL:   ${url}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
