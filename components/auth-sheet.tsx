"use client";

import {
  GoogleSignInButton,
  googleSignInAvailable,
} from "@/components/google-sign-in-button";
import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type View = "phone" | "return" | "password" | "forgot";

const inputClass =
  "w-full rounded-2xl border border-[#d9cfe8] bg-white px-4 py-3.5 text-[15px] text-foreground outline-none placeholder:text-foreground/40 focus:border-primary focus:ring-2 focus:ring-primary/25";

const primaryButtonClass =
  "h-12 w-full rounded-full bg-primary text-[15px] font-semibold text-white shadow-md shadow-primary/25 transition active:scale-[0.99] disabled:opacity-40";

/**
 * First visit creates the account with a phone number and SMS code.
 * Later visits can use Gmail, an email code, or the password set on the profile.
 */
export function AuthPanel({
  onSignedIn,
  heading = "Sign in to Jwelpixel",
  subheading = "First time here? Enter your mobile number and we’ll text you a code. You get 5 free credits.",
}: {
  onSignedIn: () => void;
  heading?: string;
  subheading?: string;
}) {
  const [view, setView] = useState<View>("phone");
  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [email, setEmail] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [password, setPassword] = useState("");
  const [resetTarget, setResetTarget] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetPassword, setResetPassword] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  const finish = useCallback(() => {
    window.dispatchEvent(new Event("jewel-auth-changed"));
    onSignedIn();
  }, [onSignedIn]);

  function openView(next: View) {
    setView(next);
    setError(null);
    setInfo(null);
    setDevHint(null);
  }

  const phoneValid = phone.replace(/\D/g, "").length >= 10;
  const emailValid = /^\S+@\S+\.\S+$/.test(email.trim());

  async function sendPhoneCode() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          purpose: "otp_login",
          channel: "sms",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setPhoneSent(true);
      setInfo(data.message ?? "Code sent by SMS.");
      if (data.devCode) setDevHint(`Dev code: ${data.devCode}`);
    } catch (e) {
      setError(toUserFacingError(e, "Could not send code"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyPhone() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/phone-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone.trim(),
          code: phoneCode.trim(),
          purpose: "otp_login",
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
      finish();
    } catch (e) {
      setError(toUserFacingError(e, "Sign-in failed"));
    } finally {
      setLoading(false);
    }
  }

  async function sendEmailCode() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevHint(null);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          purpose: "otp_login",
          channel: "email",
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        devCode?: string;
      };
      if (!res.ok) throw new Error(data.error ?? "Could not send code");
      setEmailSent(true);
      setInfo(data.message ?? "Code sent.");
      if (data.devCode) setDevHint(`Dev code: ${data.devCode}`);
    } catch (e) {
      setError(toUserFacingError(e, "Could not send code"));
    } finally {
      setLoading(false);
    }
  }

  async function verifyEmail() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/email-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: emailCode.trim() }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Sign-in failed");
      finish();
    } catch (e) {
      setError(toUserFacingError(e, "Sign-in failed"));
    } finally {
      setLoading(false);
    }
  }

  async function loginWithPassword() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Login failed");
      finish();
    } catch (e) {
      setError(toUserFacingError(e, "Login failed"));
    } finally {
      setLoading(false);
    }
  }

  async function sendReset() {
    setLoading(true);
    setError(null);
    setInfo(null);
    setDevHint(null);
    try {
      const looksPhone = !resetTarget.includes("@");
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          looksPhone
            ? { phone: resetTarget, purpose: "reset", channel: "sms" }
            : { email: resetTarget, purpose: "reset", channel: "email" },
        ),
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
      setError(toUserFacingError(e, "Could not send code"));
    } finally {
      setLoading(false);
    }
  }

  async function submitReset() {
    setLoading(true);
    setError(null);
    try {
      const looksPhone = !resetTarget.includes("@");
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          looksPhone
            ? { phone: resetTarget, code: resetCode, password: resetPassword }
            : { email: resetTarget, code: resetCode, password: resetPassword },
        ),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Could not reset password");
      setInfo(data.message ?? "Password updated. You can sign in now.");
      setEmail(looksPhone ? "" : resetTarget);
      openView("password");
    } catch (e) {
      setError(toUserFacingError(e, "Could not reset password"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h2 className="font-[family-name:var(--font-display)] text-[26px] leading-tight text-foreground">
          {view === "phone" ? heading : "Welcome back"}
        </h2>
        <p className="mt-2 text-sm text-foreground/65">
          {view === "phone"
            ? subheading
            : "Use Gmail, the email on your account, or the password you set."}
        </p>
      </div>

      {view === "phone" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!phoneSent) void sendPhoneCode();
            else void verifyPhone();
          }}
        >
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setPhoneSent(false);
              setPhoneCode("");
            }}
            className={inputClass}
          />
          {phoneSent ? (
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="6-digit SMS code"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className={`${inputClass} tracking-[0.4em]`}
              autoFocus
            />
          ) : null}
          <button
            type="submit"
            disabled={loading || !phoneValid || (phoneSent && phoneCode.length < 4)}
            className={primaryButtonClass}
          >
            {loading
              ? phoneSent
                ? "Verifying…"
                : "Sending…"
              : phoneSent
                ? "Verify & continue"
                : "Send code"}
          </button>
          {phoneSent ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => void sendPhoneCode()}
              className="w-full text-sm font-medium text-primary disabled:opacity-40"
            >
              Resend code
            </button>
          ) : null}
        </form>
      ) : null}

      {view === "return" ? (
        <div className="space-y-4">
          {googleSignInAvailable() ? <GoogleSignInButton onSignedIn={finish} onError={setError} /> : null}
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (!emailSent) void sendEmailCode();
              else void verifyEmail();
            }}
          >
            <input
              type="email"
              autoComplete="email"
              placeholder="Email on your account"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailSent(false);
                setEmailCode("");
              }}
              className={inputClass}
            />
            {emailSent ? (
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit email code"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputClass} tracking-[0.4em]`}
                autoFocus
              />
            ) : null}
            <button
              type="submit"
              disabled={loading || !emailValid || (emailSent && emailCode.length < 4)}
              className={primaryButtonClass}
            >
              {loading
                ? emailSent
                  ? "Verifying…"
                  : "Sending…"
                : emailSent
                  ? "Verify & continue"
                  : "Email me a code"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => openView("password")}
            className="h-12 w-full rounded-full border-2 border-primary/40 bg-white text-sm font-semibold text-primary"
          >
            Use the password you set
          </button>
        </div>
      ) : null}

      {view === "password" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            void loginWithPassword();
          }}
        >
          <input
            type="email"
            autoComplete="email"
            placeholder="Email on your account"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={loading || !emailValid || password.length < 8}
            className={primaryButtonClass}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <button
            type="button"
            onClick={() => {
              setResetTarget(email);
              setResetSent(false);
              openView("forgot");
            }}
            className="h-12 w-full rounded-full border-2 border-primary/40 bg-white text-sm font-semibold text-primary"
          >
            Forgot password?
          </button>
        </form>
      ) : null}

      {view === "forgot" ? (
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!resetSent) void sendReset();
            else void submitReset();
          }}
        >
          <input
            type="text"
            autoComplete="username"
            placeholder="Email or 10-digit mobile"
            value={resetTarget}
            onChange={(e) => {
              setResetTarget(e.target.value);
              setResetSent(false);
            }}
            className={inputClass}
          />
          {resetSent ? (
            <>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6-digit code"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={inputClass}
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="New password (min 8 characters)"
                value={resetPassword}
                onChange={(e) => setResetPassword(e.target.value)}
                className={inputClass}
              />
            </>
          ) : null}
          <button
            type="submit"
            disabled={
              loading ||
              resetTarget.trim().length < 5 ||
              (resetSent && (resetCode.length < 4 || resetPassword.length < 8))
            }
            className={primaryButtonClass}
          >
            {loading ? "Please wait…" : resetSent ? "Update password" : "Send reset code"}
          </button>
        </form>
      ) : null}

      {devHint ? (
        <p className="rounded-lg bg-sky-50 px-3 py-2 text-xs text-sky-900">{devHint}</p>
      ) : null}
      {info && !error ? <p className="text-center text-sm text-foreground/70">{info}</p> : null}
      {error ? (
        <p className="text-center text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      {view === "phone" ? (
        <button
          type="button"
          onClick={() => openView("return")}
          className="w-full rounded-2xl border-2 border-primary bg-white px-4 py-3 text-center shadow-sm"
        >
          <span className="block text-sm font-semibold text-primary">
            Already signed in before?
          </span>
          <span className="mt-0.5 block text-xs font-medium text-foreground/70">
            Use Gmail, email, or password
          </span>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => openView("phone")}
          className="h-12 w-full rounded-full border-2 border-primary/40 bg-white text-sm font-semibold text-primary"
        >
          First time? Use your phone number
        </button>
      )}

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
            "First time? Enter your mobile number. We’ll text you a code and start you with 5 free credits."
          }
        />
      </div>
    </div>
  );
}
