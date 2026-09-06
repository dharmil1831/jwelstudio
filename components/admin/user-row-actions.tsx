"use client";

import { PLAN_IDS, PLAN_LABELS, type PlanId } from "@/lib/entitlements";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function UserRowActions({
  userId,
  email,
  phone,
  credits,
  plan,
  isSuperAdmin,
}: {
  userId: string;
  email: string;
  phone: string | null;
  credits: number;
  plan: PlanId;
  isSuperAdmin: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nextEmail, setNextEmail] = useState(email);
  const [nextPhone, setNextPhone] = useState(phone ?? "");
  const [nextPassword, setNextPassword] = useState("");
  const [nextCredits, setNextCredits] = useState(String(credits));
  const [nextPlan, setNextPlan] = useState<PlanId>(plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        email: nextEmail,
        phone: nextPhone.trim() || null,
        credits: Number.parseInt(nextCredits, 10),
        plan: nextPlan,
      };
      if (nextPassword.trim()) body.password = nextPassword.trim();

      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Update failed");
      setNextPassword("");
      setEditing(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (isSuperAdmin) return;
    const ok = window.confirm(
      `Delete ${email}? This removes their generations, payments, and themes.`,
    );
    if (!ok) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <div className="min-w-[220px] space-y-2 rounded-lg border border-primary/20 bg-background/50 p-3">
        <label className="block text-xs">
          Email
          <input
            type="email"
            value={nextEmail}
            onChange={(e) => setNextEmail(e.target.value)}
            className="mt-0.5 w-full rounded border border-primary/25 bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          Phone
          <input
            type="tel"
            value={nextPhone}
            onChange={(e) => setNextPhone(e.target.value)}
            className="mt-0.5 w-full rounded border border-primary/25 bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          New password (optional)
          <input
            type="text"
            value={nextPassword}
            onChange={(e) => setNextPassword(e.target.value)}
            placeholder="Leave blank to keep"
            className="mt-0.5 w-full rounded border border-primary/25 bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          Credits
          <input
            type="number"
            min={0}
            value={nextCredits}
            onChange={(e) => setNextCredits(e.target.value)}
            className="mt-0.5 w-full rounded border border-primary/25 bg-background px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs">
          Plan
          <select
            value={nextPlan}
            onChange={(e) => setNextPlan(e.target.value as PlanId)}
            className="mt-0.5 w-full rounded border border-primary/25 bg-background px-2 py-1 text-sm"
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {PLAN_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
        {error ? <p className="text-xs text-red-600">{error}</p> : null}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={() => void save()}
            className="rounded bg-primary px-2 py-1 text-xs font-semibold text-background disabled:opacity-50"
          >
            {loading ? "…" : "Save"}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              setEditing(false);
              setError(null);
              setNextEmail(email);
              setNextPhone(phone ?? "");
              setNextPassword("");
              setNextCredits(String(credits));
              setNextPlan(plan);
            }}
            className="rounded border border-primary/25 px-2 py-1 text-xs"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="rounded border border-primary/25 px-2 py-1 text-xs font-medium hover:bg-accent/30"
        >
          Edit
        </button>
        {!isSuperAdmin ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void remove()}
            className="rounded border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        ) : (
          <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Super admin
          </span>
        )}
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
