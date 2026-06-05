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
    // jose's setExpirationTime takes a Date, epoch seconds, or a relative span
    // like "30d" — an absolute ISO string throws "Invalid time period format".
    .setExpirationTime(new Date("2026-06-18T00:00:00Z"))
    .sign(getSecret());
}

export async function verifyJudgeToken(
  token: string,
): Promise<JudgePayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ["HS256"],
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
