"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "login" | "signup";

export function AdminLoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup" && password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const res = await fetch(
        mode === "login" ? "/api/auth/admin-login" : "/api/auth/admin-signup",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/admin");
      router.refresh();
    } catch (e) {
      setError(toUserFacingError(e, "Request failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-primary/20 bg-secondary p-6 shadow-sm">
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("login");
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "login"
              ? "bg-primary text-background"
              : "text-foreground/70 hover:bg-accent/30"
          }`}
        >
          Log in
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            setError(null);
          }}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
            mode === "signup"
              ? "bg-primary text-background"
              : "text-foreground/70 hover:bg-accent/30"
          }`}
        >
          Sign up
        </button>
      </div>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
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
            Password
          </span>
          <input
            type="password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
          />
        </label>
        {mode === "signup" ? (
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-foreground/80">
              Confirm password
            </span>
            <input
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-lg border border-primary/25 bg-background px-3 py-2 text-foreground outline-none focus:border-primary"
            />
          </label>
        ) : null}

        {error ? (
          <p className="text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Enter admin"
              : "Create super admin"}
        </button>
      </form>

      <p className="mt-4 text-xs text-foreground/55">
        Only the single email in <code>SUPER_ADMIN_EMAIL</code> can use this page.
        Studio login at{" "}
        <Link href="/login" className="text-primary hover:underline">
          /login
        </Link>{" "}
        never grants admin access.
      </p>
    </div>
  );
}
