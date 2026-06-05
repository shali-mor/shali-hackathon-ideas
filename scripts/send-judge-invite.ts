import "./load-env";
import { mintJudgeToken } from "../src/lib/judge-tokens";
import { sendEmail, judgeInviteEmail } from "../src/lib/email";

async function main() {
  const [, , name, email] = process.argv;
  if (!name || !email) {
    console.error(
      'Usage: npm run invite-judge -- "Judge Name" judge@example.com',
    );
    process.exit(1);
  }
  const token = await mintJudgeToken({ name, email });
  const base = process.env.APP_URL ?? "http://localhost:3000";
  const url = `${base}/judges?token=${encodeURIComponent(token)}`;
  const { subject, html, text } = judgeInviteEmail({
    judgeName: name,
    judgeUrl: url,
    appUrl: base,
  });
  const result = await sendEmail({ to: email, subject, html, text });
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
