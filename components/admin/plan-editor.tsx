"use client";

import { PLAN_IDS, PLAN_LABELS, type PlanId } from "@/lib/entitlements";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function PlanEditor({
  userId,
  currentPlan,
}: {
  userId: string;
  currentPlan: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<PlanId>(
    (PLAN_IDS as readonly string[]).includes(currentPlan)
      ? (currentPlan as PlanId)
      : "free",
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: value }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={value}
        onChange={(e) => setValue(e.target.value as PlanId)}
        className="rounded border border-primary/25 bg-background/40 px-2 py-1 text-sm text-foreground"
      >
        {PLAN_IDS.map((id) => (
          <option key={id} value={id}>
            {PLAN_LABELS[id]}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={loading}
        onClick={() => void save()}
        className="rounded bg-primary px-2 py-1 text-xs font-semibold text-background disabled:opacity-50"
      >
        {loading ? "…" : "Set"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
