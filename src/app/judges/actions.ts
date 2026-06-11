"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db, judgeScores, finalScores } from "@/lib/db";
import { verifyJudgeToken, type JudgePayload } from "@/lib/judge-tokens";
import { CRITERIA, SCORE_MIN, SCORE_MAX } from "@/lib/judging";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export type ScoreState = { ok: boolean; error?: string } | null;

// The two scoring rounds live in separate tables and revalidate separate
// pages. The score form posts a `round` field; anything other than "final"
// (including absent) means the semi-final round, for backward compatibility.
function roundTarget(formData: FormData) {
  const round = String(formData.get("round") ?? "semi");
  return round === "final"
    ? { table: finalScores, path: "/judges/finals" }
    : { table: judgeScores, path: "/judges" };
}

// Judges authenticate via their signed link token; admins can also act as
// judges using their normal signed-in session (no token needed).
async function authJudge(formData: FormData): Promise<JudgePayload | null> {
  const token = String(formData.get("token") ?? "");
  if (token) {
    const judge = await verifyJudgeToken(token);
    if (judge) return judge;
  }
  const session = await getSession();
  if (session?.user?.email && isAdmin(session.user.email)) {
    return {
      name: session.user.name ?? session.user.email,
      email: session.user.email,
    };
  }
  return null;
}

export async function saveScore(
  _prev: ScoreState,
  formData: FormData,
): Promise<ScoreState> {
  const judge = await authJudge(formData);
  if (!judge) return { ok: false, error: "Sign in as an admin or use your judge link." };

  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) return { ok: false, error: "Missing idea." };

  const values: Record<string, number> = {};
  for (const c of CRITERIA) {
    const n = Number(formData.get(c.key));
    if (!Number.isInteger(n) || n < SCORE_MIN || n > SCORE_MAX) {
      return { ok: false, error: `${c.label} must be ${SCORE_MIN}–${SCORE_MAX}.` };
    }
    values[c.key] = n;
  }

  const { table, path } = roundTarget(formData);

  await db
    .insert(table)
    .values({
      submissionId,
      judgeEmail: judge.email.toLowerCase(),
      judgeName: judge.name,
      impact: values.impact,
      demo: values.demo,
      pitch: values.pitch,
      adoptability: values.adoptability,
    })
    .onConflictDoUpdate({
      target: [table.judgeEmail, table.submissionId],
      set: {
        impact: values.impact,
        demo: values.demo,
        pitch: values.pitch,
        adoptability: values.adoptability,
        judgeName: judge.name,
        updatedAt: new Date(),
      },
    });

  revalidatePath(path);
  return { ok: true };
}

export async function clearScore(
  _prev: ScoreState,
  formData: FormData,
): Promise<ScoreState> {
  const judge = await authJudge(formData);
  if (!judge) return { ok: false, error: "Sign in as an admin or use your judge link." };

  const submissionId = String(formData.get("submissionId") ?? "");
  if (!submissionId) return { ok: false, error: "Missing idea." };

  const { table, path } = roundTarget(formData);

  await db
    .delete(table)
    .where(
      and(
        eq(table.judgeEmail, judge.email.toLowerCase()),
        eq(table.submissionId, submissionId),
      ),
    );

  revalidatePath(path);
  return { ok: true };
}
