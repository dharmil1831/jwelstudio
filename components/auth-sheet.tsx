"use client";

import {
  GoogleSignInButton,
  googleSignInAvailable,
} from "@/components/google-sign-in-button";
import { LoginForm } from "@/components/login-form";
import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Channel = "email" | "phone";

const inputClass =
  "w-full rounded-2xl border border-[#d9cfe8] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/25";

/**
 * Passwordless sign-in: Google, or a one-time code by email or SMS.
 * New accounts are created on first sign-in with the free starting credits.
 */
export function AuthPanel({
  onSignedIn,
  heading = "Sign in to Jwelpixel",
  subheading = "New here? Your account is created on first sign-in with 5 free credits.",
}: {
  onSignedIn: () => void;
  heading?: string;
  subheading?: string;
}) {
  const [channel, setChannel] = useState<Channel>("email");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);
  const [usePassword, setUsePassword] = useState(false);

  const finish = useCallback(() => {
    window.dispatchEvent(new Event("jewel-auth-changed"));
    onSignedIn();
  }, [onSignedIn]);

  const targetValid =
    channel === "email"
      ? /^\S+@\S+\.\S+$/.test(target.trim())
      : target.replace(/\D/g, "").length >= 10;

  function switchChannel(next: Channel) {
    setChannel(next);
    setTarget("");
    setCode("");
    setSent(false);
    setError(null);
    setInfo(null);
    setDevHint(null);
  }

  async function sendCode() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          channel === "email"
            ? { email: target.trim(), purpose: "otp_login", channel: "email" }
            : { phone: target.trim(), purpose: "otp_login", channel: "sms" },
        ),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setSent(true);
      setInfo(data.message ?? "Code sent.");
      if (data.devCode) setDevHint(`Dev code: ${data.devCode}`);
    } catch (e) {
      setError(toUserFacingError(e, "Could not send code"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        channel === "email" ? "/api/auth/email-login" : "/api/auth/phone-login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            channel === "email"
              ? { email: target.trim(), code: code.trim() }
              : { phone: target.trim(), code: code.trim(), purpose: "otp_login" },
          ),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
      finish();
    } catch (e) {
      setError(toUserFacingError(e, "Sign-in failed"));
    } finally {
      setLoading(false);
    }
  }

  if (usePassword) {
    return (
      <div className="space-y-4">
        <LoginForm />
        <button
          type="button"
          onClick={() => setUsePassword(false)}
          className="w-full text-sm font-medium text-primary"
        >
          ← Back to quick sign-in
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-tight text-foreground">
          {heading}
        </h2>
        <p className="mt-2 text-sm text-foreground/65">{subheading}</p>
      </div>

      {googleSignInAvailable() ? (
        <>
          <GoogleSignInButton
            onSignedIn={finish}
            onError={(message) => setError(message)}
          />
          <div className="flex items-center gap-3 text-xs uppercase tracking-[0.18em] text-foreground/45">
            <span className="h-px flex-1 bg-foreground/15" />
            or use a code
            <span className="h-px flex-1 bg-foreground/15" />
          </div>
        </>
      ) : null}

      <div className="flex rounded-full bg-[#efe8f7] p-1">
        {(
          [
            ["email", "Email"],
            ["phone", "Phone"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => switchChannel(id)}
            className={`flex-1 rounded-full py-2 text-sm font-semibold transition ${
              channel === id ? "bg-white text-primary shadow-sm" : "text-foreground/60"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!sent) void sendCode();
          else void verifyCode();
        }}
      >
        <input
          type={channel === "email" ? "email" : "tel"}
          inputMode={channel === "email" ? "email" : "tel"}
          autoComplete={channel === "email" ? "email" : "tel"}
          placeholder={channel === "email" ? "you@example.com" : "10-digit mobile number"}
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setSent(false);
            setCode("");
          }}
          className={inputClass}
        />
        {sent ? (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            className={`${inputClass} tracking-[0.4em]`}
            autoFocus
          />
        ) : null}
        <button
          type="submit"
          disabled={loading || !targetValid || (sent && code.length < 4)}
          className="h-12 w-full rounded-full bg-primary text-[15px] font-semibold text-white shadow-md shadow-primary/25 transition active:scale-[0.99] disabled:opacity-40"
        >
          {loading
            ? sent
              ? "Verifying…"
              : "Sending…"
            : sent
              ? "Verify & continue"
              : "Send code"}
        </button>
        {sent ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void sendCode()}
            className="w-full text-sm font-medium text-primary disabled:opacity-40"
          >
            Resend code
          </button>
        ) : null}
      </form>

      {devHint ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">{devHint}</p>
      ) : null}
      {info && !error ? <p className="text-center text-sm text-foreground/70">{info}</p> : null}
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setUsePassword(true)}
        className="w-full text-sm text-foreground/60 underline-offset-2 hover:underline"
      >
        Use password instead
      </button>

      <p className="text-center text-xs leading-relaxed text-foreground/50">
        By continuing you agree to our{" "}
        <Link href="/terms" className="font-medium text-primary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="font-medium text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}

/** Bottom sheet used inside the studio when a guest tries a signed-in action. */
export function AuthSheet({
  open,
  onClose,
  onSignedIn,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
  reason?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close sign-in"
        onClick={onClose}
        className="absolute inset-0 bg-[#2a1f33]/45 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[28px] bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:rounded-[28px] sm:pb-6"
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-foreground/15 sm:hidden" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-3 flex h-9 w-9 items-center justify-center rounded-full text-xl text-foreground/50 hover:bg-white/60"
        >
          ×
        </button>
        <AuthPanel
          onSignedIn={onSignedIn}
          heading="Sign in to continue"
          subheading={
            reason ??
            "Sign in to generate. New accounts get 5 free credits — no card needed."
          }
        />
      </div>
    </div>
  );
}
