import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

function normalizeEmail(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase();
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const N = 16384;
  const r = 8;
  const p = 1;
  const derived = await scryptAsync(password, salt, 64, {
    N,
    r,
    p,
    maxmem: 64 * 1024 * 1024,
  });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

const prisma = new PrismaClient();
const saved = await prisma.appSetting.findUnique({
  where: { key: "superAdminEmail" },
});
const email = normalizeEmail(saved?.value);

if (!email) {
  console.error("No admin login has been saved yet. Sign up at /admin/login.");
  await prisma.$disconnect();
  process.exit(1);
}

const tempPassword = process.argv[2] || `Admin-${randomBytes(4).toString("hex")}!`;

const user = await prisma.user.findUnique({ where: { email } });
if (!user) {
  console.error("No user found for the saved admin email. Sign up at /admin/login.");
  await prisma.$disconnect();
  process.exit(1);
}

const passwordHash = await hashPassword(tempPassword);
await prisma.user.update({
  where: { id: user.id },
  data: { passwordHash },
});
await prisma.$disconnect();

console.log("Password reset for super admin.");
console.log("Email:", email);
console.log("Temp password:", tempPassword);
console.log("Log in at http://localhost:3000/admin/login then change this later if you want.");
