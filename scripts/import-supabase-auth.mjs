import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { PrismaClient } from "@prisma/client";

function loadEnv() {
  const text = readFileSync(new URL("../.env", import.meta.url), "utf8");
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m || process.env[m[1]]) continue;
    process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

loadEnv();

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error("Supabase URL or service key is missing.");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isPlaceholder(email) {
  return email.endsWith("@users.jwelpixel.app");
}

async function main() {
  const adminRow = await prisma.appSetting.findUnique({ where: { key: "superAdminEmail" } });
  const adminEmail = adminRow?.value?.trim().toLowerCase() || null;

  const users = await prisma.user.findMany({
    where: { authUserId: null },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      email: true,
      phone: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
    },
  });

  const pending = users.filter((u) => u.email.toLowerCase() !== adminEmail);
  const skippedAdmin = users.length - pending.length;
  console.log(
    `${apply ? "APPLY" : "DRY RUN"} — ${pending.length} customer accounts to import, ${skippedAdmin} admin skipped.`,
  );

  let created = 0;
  let failed = 0;
  for (const user of pending) {
    const email = user.email.toLowerCase();
    const confirmEmail = Boolean(user.emailVerifiedAt) || isPlaceholder(email);
    const phone = user.phoneVerifiedAt && user.phone ? user.phone : undefined;
    const label = isPlaceholder(email) ? `phone ${phone ?? user.phone ?? "(none)"}` : email;
    if (!apply) {
      console.log(
        `would create ${label} email_confirm=${confirmEmail} phone_confirm=${Boolean(phone)}`,
      );
      continue;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: confirmEmail,
      phone,
      phone_confirm: Boolean(phone),
      user_metadata: { appUserId: user.id },
    });
    if (error || !data.user) {
      failed += 1;
      console.error(`FAILED ${label}: ${error?.message ?? "no user returned"}`);
      continue;
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { authUserId: data.user.id },
    });
    created += 1;
    console.log(`created ${label}`);
  }

  if (apply) console.log(`done created=${created} failed=${failed}`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e instanceof Error ? e.message : e);
  await prisma.$disconnect();
  process.exit(1);
});
