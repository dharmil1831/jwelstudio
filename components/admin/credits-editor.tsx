"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreditsEditor({
  userId,
  currentCredits,
}: {
  userId: string;
  currentCredits: number;
}) {
  const router = useRouter();
  const [value, setValue] = useState(String(currentCredits));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    const credits = Number.parseInt(value, 10);
    if (!Number.isFinite(credits) || credits < 0) {
      setError("Enter a valid non-negative number.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
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
      <input
        type="number"
        min={0}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="w-20 rounded border border-primary/25 bg-background/40 px-2 py-1 text-sm text-foreground"
      />
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
