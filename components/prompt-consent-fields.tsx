"use client";

import {
  PROMPT_CONSENT_LABEL,
  PROMPT_DISCLAIMER,
} from "@/lib/prompt-safety";
import Link from "next/link";

export function PromptConsentFields({
  value,
  consented,
  onChange,
  onConsentChange,
  locked,
}: {
  value: string;
  consented: boolean;
  onChange: (value: string) => void;
  onConsentChange: (value: boolean) => void;
  locked?: boolean;
}) {
  if (locked) {
    return (
      <p className="text-xs text-foreground/70">
        Custom prompts unlock on higher plans.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, 2000))}
        placeholder="Soft temple light. Keep every stone exact."
        className="min-h-24 w-full rounded-xl bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20 focus:ring-2 focus:ring-primary"
        rows={3}
      />
      <p className="text-[11px] leading-relaxed text-foreground/60">
        {PROMPT_DISCLAIMER} See{" "}
        <Link href="/terms" className="font-medium text-primary underline">
          Terms
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
        <span>{PROMPT_CONSENT_LABEL}</span>
      </label>
    </div>
  );
}
