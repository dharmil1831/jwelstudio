"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signup() {
    setLoading(true);
    setError(null);
    try {
      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          phone: phone.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not create account");
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/#studio");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create account");
    } finally {
      setLoading(false);
    }
  }

  async function login() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/#studio");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: "signup" | "login") {
    setMode(next);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
      <div className="mb-6 flex gap-2 rounded-xl bg-stone-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "signup" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "login" ? "bg-white text-stone-900 shadow-sm" : "text-stone-600"
          }`}
        >
          Log in
        </button>
      </div>

      {mode === "signup" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void signup();
          }}
        >
          <p className="text-sm text-stone-600">
            Create an account with email and password. You get{" "}
            <strong>5 free</strong> generations. Phone is optional.
          </p>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <input
            type="tel"
            autoComplete="tel"
            placeholder="Mobile number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading || !email || password.length < 8}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <p className="text-sm text-stone-600">Log in with your email and password.</p>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm outline-none ring-amber-500 focus:ring-2"
          />
          <button
            type="submit"
            disabled={loading || !loginEmail || !loginPassword}
            className="w-full rounded-xl bg-amber-600 py-3 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>
      )}

      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
