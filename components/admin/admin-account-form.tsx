"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function AdminAccountForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void fetch("/api/admin/account")
      .then(async (r) => {
        const data = (await r.json()) as { email?: string; error?: string };
        if (!r.ok) throw new Error(data.error ?? "Could not load login");
        setEmail(data.email ?? "");
      })
      .catch((e) => setError(toUserFacingError(e, "Could not load login")))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          email,
          newPassword,
          confirmPassword,
        }),
      });
      const data = (await res.json()) as { error?: string; email?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not save login");
      if (data.email) setEmail(data.email);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      router.refresh();
    } catch (e) {
      setError(toUserFacingError(e, "Could not save login"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-foreground/55">Loading login…</p>;
  }

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-primary/20 bg-secondary p-5"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div>
        <h2 className="text-lg font-semibold text-foreground">Admin login</h2>
        <p className="mt-1 text-sm text-foreground/65">
          This email and password are the only way into the admin panel. Sign in
          at /admin/login after you change them.
        </p>
      </div>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground/80">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground/80">
          Current password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground/80">
          New password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep the current password"
          className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
        />
      </label>
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-foreground/80">
          Confirm new password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
        />
      </label>
      {error ? (
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="text-sm text-foreground/70">Login saved.</p>
      ) : null}
      <button
        type="submit"
        disabled={saving}
        className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save login"}
      </button>
    </form>
  );
}
