import { SignJWT, jwtVerify } from "jose";

const ISSUER = "shali-hackathon-ideas";
const AUDIENCE = "judges";

function getSecret(): Uint8Array {
  const raw = process.env.JUDGE_TOKEN_SECRET;
  if (!raw) {
    throw new Error("JUDGE_TOKEN_SECRET is not set");
  }
  return new TextEncoder().encode(raw);
}

export type JudgePayload = {
  name: string;
  email: string;
};

export async function mintJudgeToken(payload: JudgePayload): Promise<string> {
  return await new SignJWT({ name: payload.name, email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("2026-06-10T00:00:00Z")
    .sign(getSecret());
}

export async function verifyJudgeToken(
  token: string,
): Promise<JudgePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof payload.name !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return { name: payload.name, email: payload.email };
  } catch {
    return null;
  }
}
