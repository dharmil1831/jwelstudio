"use client";

import { getCreditPacks } from "@/lib/credit-packs";
import {
  PLAN_LABELS,
  normalizePlanId,
  type PlanId,
} from "@/lib/entitlements";
import { CREDIT_COST_PER_VIDEO } from "@/lib/video-presets";
import Link from "next/link";

export function planCreditAllotment(plan: PlanId | string | null | undefined): number {
  const id = normalizePlanId(plan);
  if (id === "free") return 5;
  return getCreditPacks().find((p) => p.id === id)?.credits ?? 5;
}

function ringStyle(pct: number, color = "var(--primary)") {
  const safe = Math.max(0, Math.min(100, pct));
  return {
    background: `radial-gradient(closest-side, var(--secondary) 72%, transparent 73% 100%), conic-gradient(${color} ${safe}%, color-mix(in oklab, var(--primary) 12%, white) 0)`,
  } as const;
}

export function CreditsUsageCard({
  credits,
  plan,
  compact = false,
  className = "",
}: {
  credits: number | null;
  plan: string | null;
  compact?: boolean;
  className?: string;
}) {
  const planId = normalizePlanId(plan);
  const label = PLAN_LABELS[planId];
  const allotment = planCreditAllotment(planId);
  const left = credits ?? 0;
  const remainingPct =
    allotment > 0 ? Math.min(100, Math.round((left / allotment) * 100)) : 0;
  const usedApprox = Math.max(0, allotment - left);

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-secondary text-center shadow-sm ${
        compact ? "p-3.5" : "p-4"
      } ${className}`}
    >
      <div
        className={`relative mx-auto grid place-items-center rounded-full ${
          compact ? "h-[110px] w-[110px]" : "h-[140px] w-[140px]"
        }`}
        style={ringStyle(remainingPct)}
        role="img"
        aria-label={`${left} credits left of ${allotment}`}
      >
        <div>
          <p
            className={`font-[family-name:var(--font-display)] font-normal leading-none text-foreground ${
              compact ? "text-3xl" : "text-4xl"
            }`}
          >
            {credits === null ? "—" : left}
          </p>
          <p className="mt-1 text-[10px] text-foreground/55">
            {credits === null ? "credits" : `of ${allotment} left`}
          </p>
        </div>
      </div>

      <span className="mt-3 inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-bold text-primary">
        {label} plan
      </span>

      <p className="mt-2 text-xs text-foreground/60">
        {credits === null
          ? "Sign in to see your balance"
          : left >= allotment
            ? `${allotment} credits each month on ${label}`
            : `${usedApprox} used toward this month’s ${allotment} · 1 photo = 1 credit`}
      </p>

      <ul className="mt-3 space-y-2 text-left text-sm">
        <li className="flex items-center justify-between gap-2">
          <span className="text-foreground/70">Video</span>
          <span className="font-semibold text-foreground">
            {CREDIT_COST_PER_VIDEO} credits each
          </span>
        </li>
        <li className="flex items-center justify-between gap-2">
          <span className="text-foreground/70">Failed attempts</span>
          <span className="font-semibold text-emerald-700">Credit returned</span>
        </li>
      </ul>

      <Link
        href="/pricing#packs"
        className={`mt-4 block w-full rounded-full bg-primary text-center font-semibold text-white hover:bg-accent hover:text-foreground ${
          compact ? "py-2.5 text-xs" : "py-3 text-sm"
        }`}
      >
        {left === 0 ? "Buy credits once" : "Buy more credits"}
      </Link>
      <Link
        href="/pricing#packs"
        className={`mt-2 block w-full rounded-full border border-primary/30 text-center font-semibold text-primary ${
          compact ? "py-2 text-xs" : "py-2.5 text-sm"
        }`}
      >
        Compare plans
      </Link>
      <p className="mt-2 text-[10px] leading-snug text-foreground/50">
        Top-ups are one payment. Subscribe monthly if you want credits to renew
        automatically.
      </p>
    </div>
  );
}

export function CreditsUsageChip({
  credits,
  plan,
  onClick,
  className = "",
}: {
  credits: number | null;
  plan: string | null;
  onClick?: () => void;
  className?: string;
}) {
  const planId = normalizePlanId(plan);
  const label = PLAN_LABELS[planId];
  const allotment = planCreditAllotment(planId);
  const left = credits ?? 0;
  const remainingPct =
    allotment > 0 ? Math.min(100, Math.round((left / allotment) * 100)) : 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 items-center gap-1.5 rounded-full border border-primary/25 bg-secondary py-1 pl-1 pr-2.5 shadow-sm transition hover:border-primary ${className}`}
      aria-label={`Credits: ${credits ?? "—"} left on ${label}. Open details.`}
    >
      <span
        className="grid h-7 w-7 place-items-center rounded-full"
        style={ringStyle(remainingPct)}
        aria-hidden
      />
      <span className="text-left leading-tight">
        <span className="block text-[11px] font-bold text-foreground sm:text-xs">
          {credits === null ? "—" : left} left
        </span>
        <span className="hidden text-[9px] text-foreground/55 sm:block">{label}</span>
      </span>
    </button>
  );
}

export function CreditsUsageSheet({
  open,
  onClose,
  credits,
  plan,
}: {
  open: boolean;
  onClose: () => void;
  credits: number | null;
  plan: string | null;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] lg:hidden">
      <button
        type="button"
        className="absolute inset-0 bg-foreground/35"
        aria-label="Close credit usage"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-[#f3eef8] px-4 pb-8 pt-3 shadow-2xl">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/20" />
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full bg-white text-foreground/70"
            aria-label="Close"
          >
            ✕
          </button>
          <h2 className="text-base font-semibold text-foreground">Your credits</h2>
          <span className="w-9" />
        </div>
        <CreditsUsageCard credits={credits} plan={plan} />
        <p className="mt-3 text-center text-xs text-foreground/55">
          Paid plans renew monthly until you cancel. Credits already on the account stay.
        </p>
      </div>
    </div>
  );
}
