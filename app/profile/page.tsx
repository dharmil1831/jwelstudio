import { MobileStudioNav } from "@/components/mobile-studio-nav";
import { ProfileActions } from "@/components/profile-actions";
import { ProfileDetails } from "@/components/profile-details";
import { PLAN_LABELS } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Profile — Jwelpixel",
};

function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return label.replace(/[^a-z0-9]/gi, "").slice(0, 2).toUpperCase() || "JP";
}

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const details = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true, businessName: true },
  });
  const name = details?.name ?? null;
  const businessName = details?.businessName ?? null;
  const email = user.email.endsWith("@users.jwelpixel.app") ? null : user.email;
  const title = name || businessName || email?.split("@")[0] || user.phone || "Your account";
  const subtitle = [name ? businessName : null, email ?? user.phone]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg px-4 py-6 pb-10 sm:px-6 lg:py-12">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal text-foreground">
          Your profile
        </h1>
        <p className="mt-1 text-sm text-foreground/65">Manage your details and credits.</p>

        <section className="mt-6 rounded-2xl border border-primary/15 bg-secondary p-5 shadow-[0_4px_20px_rgba(76,45,120,0.08)] sm:p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-white">
              {initials(name || businessName || email || "JP")}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-lg font-semibold text-foreground">{title}</p>
              {subtitle ? (
                <p className="truncate text-sm text-foreground/60">{subtitle}</p>
              ) : null}
              <span className="mt-1.5 inline-flex rounded-full bg-primary/12 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {PLAN_LABELS[user.plan]} plan
              </span>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-primary/8 px-4 py-3">
            <div>
              <p className="text-xs text-foreground/55">Credits left</p>
              <p className="text-2xl font-semibold text-foreground">{user.credits}</p>
            </div>
            <Link
              href="/pricing"
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
            >
              Buy credits
            </Link>
          </div>
        </section>

        <ProfileDetails
          name={name}
          businessName={businessName}
          email={email}
          phone={user.phone}
        />

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href="/#studio"
            className="rounded-xl border border-primary bg-primary py-3 text-center text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
          >
            Open studio
          </Link>
          <Link
            href="/gallery"
            className="rounded-xl border border-primary/25 bg-white/70 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent/30"
          >
            Gallery
          </Link>
        </div>

        <ProfileActions />

        <p className="mt-6 text-center text-xs text-foreground/55">
          See our{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Terms
          </Link>
          .
        </p>
      </div>
      <div data-bottom-nav className="fixed inset-x-0 bottom-0 z-50 shadow-[0_-4px_16px_rgba(76,45,120,0.10)] lg:hidden">
        <MobileStudioNav active="profile" />
      </div>
    </div>
  );
}
