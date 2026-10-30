import { PricingPacks } from "@/components/pricing-packs";
import {
  PLAN_FEATURE_BULLETS,
  PLAN_LABELS,
  type PaidPlanId,
} from "@/lib/entitlements";
import { getCreditPacks } from "@/lib/credit-packs";
import { isDodoConfigured } from "@/lib/dodo";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";

export const metadata = {
  title: "Pricing — Jwelpixel",
  description:
    "Credit packs for jewelry model shots and videos. New accounts start with 5 free generations.",
  alternates: { canonical: "/pricing" },
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const sp = await searchParams;
  const paid = sp.paid === "1";
  const packs = getCreditPacks();
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Back to studio
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-4xl font-normal text-foreground">
          Pricing
        </h1>
        <p className="mt-3 text-lg text-foreground/70">
          5 free generations when you sign up. Upgrade for more credits and unlock
          features — Silver → Gold → Platinum → Diamond.
        </p>

        {user ? (
          <p className="mt-4 text-sm text-foreground/80">
            Signed in as <span className="font-medium">{user.email}</span> —{" "}
            <span className="font-medium">{user.credits}</span> credits · plan{" "}
            <span className="font-medium">{PLAN_LABELS[user.plan]}</span>
          </p>
        ) : (
          <p className="mt-4 text-sm text-foreground/70">
            <Link href="/login" className="font-medium text-primary underline">
              Log in
            </Link>{" "}
            to buy credit packs.
          </p>
        )}

        {paid ? (
          <div className="mt-6 space-y-2">
            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              Payment successful. Credits are added to your account.
            </p>
            <Link
              href="/#studio"
              className="inline-block text-sm font-medium text-primary hover:text-accent"
            >
              Back to studio →
            </Link>
          </div>
        ) : null}

        <PricingPacks
          loggedIn={Boolean(user)}
          dodoOn={isDodoConfigured()}
          packs={packs.map((pack) => ({
            id: pack.id,
            label: pack.label,
            amountPaise: pack.amountPaise,
            amountCents: pack.amountCents,
            credits: pack.credits,
            highlight: pack.id === "gold",
            bullets:
              PLAN_FEATURE_BULLETS[pack.id as PaidPlanId] ?? [
                `${pack.credits} generations`,
              ],
          }))}
        />
      </div>
    </div>
  );
}
