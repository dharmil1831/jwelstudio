"use client";

import { BuyCreditsButton } from "@/components/buy-credits-button";
import { DodoBuyButton } from "@/components/dodo-buy-button";
import Link from "next/link";

export type PricingPack = {
  id: string;
  label: string;
  amountPaise: number;
  amountCents: number;
  credits: number;
  bullets: string[];
  highlight: boolean;
};

export function PricingPacks({
  packs,
  loggedIn,
  dodoOn,
}: {
  packs: PricingPack[];
  loggedIn: boolean;
  dodoOn: boolean;
}) {
  return (
    <div className="mt-10 grid gap-6 sm:grid-cols-2">
      <div className="rounded-2xl border border-primary/20 bg-secondary p-8 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/55">
          Free
        </h2>
        <p className="mt-2 text-3xl font-light">₹0</p>
        <ul className="mt-4 space-y-2 text-sm text-foreground/70">
          <li>5 generations per new account</li>
          <li>Model shot & background</li>
          <li>WhatsApp & Instagram formats</li>
        </ul>
      </div>

      {packs.map((pack) => (
        <div
          key={pack.id}
          className={`rounded-2xl border p-8 shadow-md ${
            pack.highlight
              ? "border-primary/50 bg-gradient-to-b from-primary/20 to-secondary ring-2 ring-primary/30"
              : "border-primary/35 bg-gradient-to-b from-primary/15 to-secondary ring-1 ring-primary/20"
          }`}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wide text-primary">
            {pack.label}
            {pack.highlight ? (
              <span className="ml-2 text-[10px] font-medium text-foreground/55">
                Popular
              </span>
            ) : null}
          </h2>
          <p className="mt-2 text-3xl font-light">
            ${(pack.amountCents / 100).toFixed(0)}
            <span className="text-base text-foreground/55"> / month</span>
          </p>
          <p className="mt-1 text-sm text-foreground/70">
            {pack.credits} generations · $
            {(pack.amountCents / pack.credits / 100).toFixed(2)}/credit
          </p>
          <ul className="mt-4 space-y-1.5 text-sm text-foreground/70">
            {pack.bullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
          {loggedIn ? (
            dodoOn ? (
              <DodoBuyButton packId={pack.id} />
            ) : (
              <BuyCreditsButton packId={pack.id} />
            )
          ) : (
            <Link
              href="/login"
              className="mt-6 block w-full rounded-xl border border-primary/40 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/15"
            >
              Log in to buy
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}
