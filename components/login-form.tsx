"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Mode = "signup" | "login" | "forgot";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  async function requestResetOtp(target: string) {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: target, purpose: "reset" }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setResetSent(true);
      setInfo(data.message ?? "Code sent.");
      if (data.devCode) setDevHint(`Dev code: ${data.devCode}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  }

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

  async function resetPasswordSubmit() {
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      if (resetPassword !== resetConfirm) {
        throw new Error("Passwords do not match.");
      }
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          password: resetPassword,
        }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not reset password");
      setInfo(data.message ?? "Password updated. You can log in now.");
      setMode("login");
      setLoginEmail(resetEmail);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setInfo(null);
    setDevHint(null);
  }

  const inputClass =
    "w-full rounded-xl border border-primary/25 bg-background/40 px-4 py-3 text-sm text-foreground outline-none placeholder:text-foreground/40 ring-primary focus:ring-2";

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-primary/20 bg-secondary p-8 shadow-lg">
      <div className="mb-6 flex gap-2 rounded-xl bg-background/50 p-1">
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "signup" ? "bg-background text-foreground shadow-sm" : "text-foreground/65"
          }`}
        >
          Sign up
        </button>
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-lg py-2 text-sm font-medium ${
            mode === "login" ? "bg-background text-foreground shadow-sm" : "text-foreground/65"
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
          <p className="text-sm text-foreground/70">
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
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="new-password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className={inputClass}
          />
          <input
            type="tel"
            autoComplete="tel"
            placeholder="Mobile number (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading || !email || password.length < 8}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-40"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>
      ) : null}

      {mode === "login" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void login();
          }}
        >
          <p className="text-sm text-foreground/70">Log in with your email and password.</p>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading || !loginEmail || !loginPassword}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-40"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
          <button
            type="button"
            onClick={() => {
              switchMode("forgot");
              setResetEmail(loginEmail);
            }}
            className="w-full text-sm text-primary hover:underline"
          >
            Forgot password?
          </button>
        </form>
      ) : null}

      {mode === "forgot" ? (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resetSent) void requestResetOtp(resetEmail);
            else void resetPasswordSubmit();
          }}
        >
          <p className="text-sm text-foreground/70">
            Enter your email. We&apos;ll send a code so you can set a new password.
          </p>
          <input
            type="email"
            autoComplete="email"
            placeholder="Email address"
            value={resetEmail}
            onChange={(e) => {
              setResetEmail(e.target.value);
              setResetSent(false);
            }}
            required
            className={inputClass}
          />
          {!resetSent ? (
            <button
              type="submit"
              disabled={loading || !resetEmail}
              className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-40"
            >
              {loading ? "Sending code…" : "Send reset code"}
            </button>
          ) : (
            <>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code from email"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
                required
                className={inputClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password (min 8 characters)"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={resetConfirm}
                onChange={(e) => setResetConfirm(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
              <button
                type="submit"
                disabled={
                  loading || resetCode.length < 4 || resetPassword.length < 8
                }
                className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-40"
              >
                {loading ? "Updating…" : "Update password"}
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="w-full text-sm text-foreground/70 hover:underline"
          >
            Back to log in
          </button>
        </form>
      ) : null}

      {devHint ? (
        <p className="mt-4 rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">{devHint}</p>
      ) : null}
      {info ? <p className="mt-4 text-sm text-foreground/80">{info}</p> : null}
      {error ? (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
