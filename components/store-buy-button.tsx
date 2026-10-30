"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const OFFERING_ID = "jwelpixel_plans";
let purchasesReady = false;

function packageLookup(packId: string): string {
  return `$rc_custom_${packId}`;
}

export function StoreBuyButton({ packId }: { packId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  return (
    <div>
      <button
        type="button"
        disabled={loading || paid}
        onClick={() => {
          setError(null);
          setLoading(true);
          void (async () => {
            try {
              await purchaseStorePlan(packId);
              setPaid(true);
              router.refresh();
              window.setTimeout(() => router.refresh(), 4000);
            } catch (cause) {
              if (!isCancelled(cause)) {
                setError(toUserFacingError(cause, "The store could not open this plan."));
              }
              setLoading(false);
            }
          })();
        }}
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-50 hover:bg-accent hover:text-foreground"
      >
        {paid ? "Payment received" : loading ? "Opening the store…" : "Subscribe monthly"}
      </button>
      {paid ? (
        <p className="mt-2 text-center text-xs text-foreground/70">
          The store has the payment. Credits appear on this page in a few seconds.
        </p>
      ) : null}
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
          {error.includes("log in") ? (
            <>
              {" "}
              <Link href="/login" className="font-medium underline">
                Log in
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

async function purchaseStorePlan(packId: string): Promise<void> {
  const { Capacitor } = await import("@capacitor/core");
  const platform = Capacitor.getPlatform();
  const apiKey =
    platform === "ios"
      ? process.env.NEXT_PUBLIC_REVENUECAT_IOS_API_KEY
      : process.env.NEXT_PUBLIC_REVENUECAT_ANDROID_API_KEY;
  if (!apiKey) throw new Error("Store checkout is not open yet.");

  const account = await fetch("/api/billing/account", { cache: "no-store" });
  const accountBody = (await account.json()) as { userId?: string; error?: string };
  if (account.status === 401) throw new Error("Please log in to buy credits.");
  if (!account.ok || !accountBody.userId) {
    throw new Error(accountBody.error ?? "Please log in to buy credits.");
  }

  const { Purchases } = await import("@revenuecat/purchases-capacitor");
  if (!purchasesReady) {
    try {
      await Purchases.configure({ apiKey, appUserID: accountBody.userId });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "";
      if (!/already configured/i.test(message)) throw cause;
    }
    purchasesReady = true;
  }
  await Purchases.logIn({ appUserID: accountBody.userId });

  const offerings = await Purchases.getOfferings();
  const offering = offerings.all?.[OFFERING_ID] ?? offerings.current;
  const selected = offering?.availablePackages?.find(
    (item) => item.identifier === packageLookup(packId),
  );
  if (!selected) throw new Error("This plan is not in the store yet.");
  await Purchases.purchasePackage({ aPackage: selected });
}

function isCancelled(cause: unknown): boolean {
  if (!cause || typeof cause !== "object") return false;
  const row = cause as { userCancelled?: boolean; code?: string | number };
  if (row.userCancelled) return true;
  const code = String(row.code ?? "");
  return code === "1" || code.includes("PURCHASE_CANCELLED");
}
