/**
 * Adds resilient query params to DATABASE_URL / DIRECT_URL in .env
 * without printing secrets.
 */
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
let text = fs.readFileSync(envPath, "utf8");

function patchUrl(raw) {
  let value = raw.trim();
  const quoted =
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"));
  if (quoted) value = value.slice(1, -1);

  const u = new URL(value);
  if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
  if (!u.searchParams.has("connect_timeout")) {
    u.searchParams.set("connect_timeout", "30");
  }
  // Transaction pooler (6543) needs pgbouncer=true for Prisma
  if (u.port === "6543" && !u.searchParams.has("pgbouncer")) {
    u.searchParams.set("pgbouncer", "true");
  }
  if (u.port === "6543" && !u.searchParams.has("connection_limit")) {
    u.searchParams.set("connection_limit", "1");
  }

  const next = u.toString();
  return quoted ? `"${next}"` : next;
}

const keys = ["DATABASE_URL", "DIRECT_URL"];
const changed = [];

for (const key of keys) {
  const re = new RegExp(`^${key}=(.*)$`, "m");
  const m = text.match(re);
  if (!m) {
    console.log(`skip ${key}: not found`);
    continue;
  }
  const before = m[1];
  const after = patchUrl(before);
  if (before === after) {
    console.log(`ok ${key}: already hardened`);
    continue;
  }
  text = text.replace(re, `${key}=${after}`);
  changed.push(key);
  console.log(`updated ${key}`);
}

if (changed.length) {
  fs.writeFileSync(envPath, text, "utf8");
  console.log("wrote .env");
} else {
  console.log("no .env changes needed");
}
