import { createHash, randomBytes, timingSafeEqual } from "crypto";

const SESSION_COOKIE = "jewel_session";
const SIGNUP_COOKIE = "jewel_signup";

export { SESSION_COOKIE, SIGNUP_COOKIE };

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Normalize Indian phone numbers to E.164 (+91...). */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error("Enter a valid 10-digit Indian mobile number.");
}

export function hashIdentity(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function verifyOtpHash(code: string, codeHash: string): boolean {
  const a = Buffer.from(hashOtp(code));
  const b = Buffer.from(codeHash);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret || secret.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set in production (min 16 chars).");
    }
    return "dev-only-auth-secret-change-me";
  }
  return secret;
}

export function signPayload(payload: object): string {
  const secret = getAuthSecret();
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHash("sha256")
    .update(`${body}.${secret}`)
    .digest("base64url");
  return `${body}.${sig}`;
}

export function verifySignedPayload<T extends Record<string, unknown>>(
  token: string,
): T | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const secret = getAuthSecret();
  const expected = createHash("sha256")
    .update(`${body}.${secret}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as T & { exp?: number };
    if (parsed.exp && Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string, email: string): string {
  const exp = Date.now() + 1000 * 60 * 60 * 24 * 30;
  return signPayload({ userId, email, exp });
}

export function createSignupProgressToken(email: string): string {
  const exp = Date.now() + 1000 * 60 * 30;
  return signPayload({ email, emailVerified: true, exp });
}

export function randomId(): string {
  return randomBytes(16).toString("hex");
}
