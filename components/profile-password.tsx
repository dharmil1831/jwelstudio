"use client";

import { useState } from "react";

/** Lets a signed-in person set the password they will use on the next visit. */
export function ProfilePassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (password !== confirm) throw new Error("Passwords do not match.");
      const res = await fetch("/api/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Could not save password");
      setPassword("");
      setConfirm("");
      setNotice("Password saved. Next time you can sign in with your email and this password.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-4 rounded-2xl border border-primary/15 bg-white p-5 shadow-[0_4px_20px_rgba(76,45,120,0.08)] sm:p-6">
      <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-foreground/55">
        Password
      </h2>
      <p className="mt-2 text-sm text-foreground/65">
        Add the email above, then set a password. After this visit you can sign in with Gmail,
        that email, or this password.
      </p>
      <form
        className="mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <input
          type="password"
          autoComplete="new-password"
          placeholder="New password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl border border-primary/25 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full rounded-xl border border-primary/25 bg-white px-3.5 py-3 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="submit"
          disabled={busy || password.length < 8}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "Saving…" : "Save password"}
        </button>
      </form>
      {notice ? (
        <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary" role="status">
          {notice}
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
