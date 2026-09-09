"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import { PLAN_IDS, PLAN_LABELS, type PlanId } from "@/lib/entitlements";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateUserForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [credits, setCredits] = useState("5");
  const [plan, setPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          phone: phone.trim() || null,
          credits: Number.parseInt(credits, 10),
          plan,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Create failed");
      setEmail("");
      setPhone("");
      setPassword("");
      setCredits("5");
      setPlan("free");
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(toUserFacingError(e, "Create failed"));
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background"
      >
        + Create user
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border border-primary/20 bg-secondary p-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void create();
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground">Create user</h2>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="text-xs text-foreground/55 hover:text-foreground"
        >
          Cancel
        </button>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Email</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Phone (optional)</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="10-digit mobile"
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Password</span>
          <input
            required
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block text-foreground/70">Credits</span>
          <input
            type="number"
            min={0}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm"
          />
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-foreground/70">Plan</span>
          <select
            value={plan}
            onChange={(e) => setPlan(e.target.value as PlanId)}
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-sm"
          >
            {PLAN_IDS.map((id) => (
              <option key={id} value={id}>
                {PLAN_LABELS[id]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-background disabled:opacity-50"
      >
        {loading ? "Creating…" : "Create user"}
      </button>
    </form>
  );
}
