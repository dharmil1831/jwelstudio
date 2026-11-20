"use client";

import {
  SELFIE_CONSENT_LABEL,
  SELFIE_DISCLAIMER,
} from "@/lib/selfie-consent";
import Link from "next/link";

export function SelfieConsentFields({
  consented,
  onConsentChange,
  locked,
}: {
  consented: boolean;
  onConsentChange: (value: boolean) => void;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <p className="text-xs text-foreground/70">
        Selfie try-on unlocks on Platinum and above.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-relaxed text-foreground/60">
        {SELFIE_DISCLAIMER} See{" "}
        <Link href="/terms" className="font-medium text-primary underline">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-primary underline">
          Privacy
        </Link>
        .
      </p>
      <label className="flex cursor-pointer items-start gap-2 rounded-xl bg-secondary/70 px-3 py-2 text-[11px] leading-snug text-foreground/80">
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => onConsentChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
        />
        <span>{SELFIE_CONSENT_LABEL}</span>
      </label>
    </div>
  );
}
