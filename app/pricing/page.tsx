import { BuyCreditsButton } from "@/components/buy-credits-button";
import { getCreditPacks, isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";

export const metadata = {
  title: "Pricing — Jewel Studio",
};

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ paid?: string }>;
}) {
  const sp = await searchParams;
  const paid = sp.paid === "1";
  const packs = getCreditPacks();
  const razorpayOn = isRazorpayConfigured();
  const user = await getSessionUser();

  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Back to studio
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-4xl font-light text-foreground">
          Pricing
        </h1>
        <p className="mt-3 text-lg text-foreground/70">
          5 free generations when you sign up. Buy more credits anytime in INR.
        </p>

        {user ? (
          <p className="mt-4 text-sm text-foreground/80">
            Signed in as <span className="font-medium">{user.email}</span> —{" "}
            <span className="font-medium">{user.credits}</span> credits left
          </p>
        ) : (
          <p className="mt-4 text-sm text-foreground/70">
            <Link href="/login" className="font-medium text-primary underline">
              Log in
            </Link>{" "}
            to buy credit packs.
          </p>
        )}

        {razorpayOn ? (
          <p className="mt-3 rounded-lg bg-primary/15 px-3 py-2 text-xs text-primary">
            Razorpay checkout is enabled. Use test keys in development (see RAZORPAY.md).
          </p>
        ) : null}

        {paid ? (
          <div className="mt-6 space-y-2">
            <p className="rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-200">
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

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-primary/20 bg-secondary p-8 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">
              Free
            </h2>
            <p className="mt-2 text-3xl font-light">₹0</p>
            <ul className="mt-4 space-y-2 text-sm text-foreground/70">
              <li>5 generations per new account</li>
              <li>Email verification at signup</li>
              <li>1 credit per generation</li>
            </ul>
          </div>

          {packs.map((pack) => (
            <div
              key={pack.id}
              className="rounded-2xl border border-primary/35 bg-gradient-to-b from-primary/15 to-secondary p-8 shadow-md ring-1 ring-primary/20"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
                {pack.label}
              </h2>
              <p className="mt-2 text-3xl font-light">
                ₹{(pack.amountPaise / 100).toFixed(0)}
              </p>
              <p className="mt-1 text-sm text-foreground/70">
                {pack.credits} generations · ₹
                {(pack.amountPaise / pack.credits / 100).toFixed(2)}/credit
              </p>
              {razorpayOn && user ? (
                <BuyCreditsButton packId={pack.id} />
              ) : razorpayOn ? (
                <Link
                  href="/login"
                  className="mt-6 block w-full rounded-xl border border-primary/40 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/15"
                >
                  Log in to buy
                </Link>
              ) : (
                <p className="mt-6 text-xs text-foreground/55">
                  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env — see RAZORPAY.md
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
