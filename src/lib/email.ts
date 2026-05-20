import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "Hackathon <noreply@example.com>";

export const resend = apiKey ? new Resend(apiKey) : null;

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export async function sendEmail({ to, subject, html, text }: SendArgs) {
  if (!resend) {
    console.warn("[email] RESEND_API_KEY not set — logging email instead.", {
      to,
      subject,
    });
    return { ok: true, logged: true } as const;
  }
  const result = await resend.emails.send({ from, to, subject, html, text });
  if (result.error) {
    console.error("[email] send failed", result.error);
    return { ok: false, error: result.error } as const;
  }
  return { ok: true, id: result.data?.id } as const;
}

export function reviewEmail(args: {
  title: string;
  status: "accepted" | "rejected";
  reviewNote?: string | null;
  appUrl: string;
  submissionUrl: string;
}) {
  const { title, status, reviewNote, appUrl, submissionUrl } = args;
  const verb = status === "accepted" ? "accepted" : "rejected";
  const subject = `Your hackathon idea was ${verb}: ${title}`;
  const note = reviewNote
    ? `\n\nReviewer note: ${reviewNote}`
    : "";
  const text = `Your hackathon idea "${title}" was ${verb}.${note}\n\nView it: ${submissionUrl}\n\n${appUrl}`;
  const html = `
    <p>Your hackathon idea <strong>${escapeHtml(title)}</strong> was <strong>${verb}</strong>.</p>
    ${reviewNote ? `<p><em>Reviewer note:</em> ${escapeHtml(reviewNote)}</p>` : ""}
    <p><a href="${submissionUrl}">View your submission</a></p>
  `;
  return { subject, html, text };
}

export function judgeInviteEmail(args: {
  judgeName: string;
  judgeUrl: string;
  appUrl: string;
}) {
  const { judgeName, judgeUrl, appUrl } = args;
  const subject = "Hackathon judging — your private review link";
  const text = `Hi ${judgeName},\n\nYou're invited to review accepted hackathon ideas on 2026-06-02.\nOpen your private review board: ${judgeUrl}\n\n${appUrl}`;
  const html = `
    <p>Hi ${escapeHtml(judgeName)},</p>
    <p>You're invited to review accepted hackathon ideas on <strong>2026-06-02</strong>.</p>
    <p><a href="${judgeUrl}">Open your private review board</a></p>
    <p style="color:#666;font-size:12px">Keep this link private — it's tied to you.</p>
  `;
  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
