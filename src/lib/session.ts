import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

const COOKIE = "hack_session";
const ALG = "HS256";
const MAX_AGE_SEC = 60 * 60 * 24 * 30; // 30 days

export type SessionUser = { email: string; name: string };
export type Session = { user: SessionUser };

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SEC}s`)
    .sign(getSecret());
  const c = await cookies();
  c.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getSession(): Promise<Session | null> {
  const c = await cookies();
  const token = c.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }
    return { user: { email: payload.email, name: payload.name } };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  const c = await cookies();
  c.delete(COOKIE);
}
