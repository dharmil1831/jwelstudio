import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "crypto";

const KEYLEN = 64;
const MIN_PASSWORD_LENGTH = 8;
const SCRYPT_OPTS: ScryptOptions = {
  N: 16384,
  r: 8,
  p: 1,
  maxmem: 64 * 1024 * 1024,
};

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey as Buffer);
    });
  });
}

/** Stored format: scrypt$N$r$p$saltHex$hashHex */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const N = SCRYPT_OPTS.N ?? 16384;
  const r = SCRYPT_OPTS.r ?? 8;
  const p = SCRYPT_OPTS.p ?? 1;
  const derived = await scryptAsync(password, salt, KEYLEN, SCRYPT_OPTS);
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const saltHex = parts[4];
  const hashHex = parts[5];
  if (!Number.isFinite(N) || !Number.isFinite(r) || !Number.isFinite(p)) {
    return false;
  }
  if (!saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  const derived = await scryptAsync(password, salt, expected.length, {
    N,
    r,
    p,
    maxmem: SCRYPT_OPTS.maxmem,
  });

  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export { MIN_PASSWORD_LENGTH };
