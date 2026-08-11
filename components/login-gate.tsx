"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";

type SessionState = {
  authenticated?: boolean;
  user?: { email: string; phone: string | null };
  credits?: number;
};

export function LoginGate() {
  const router = useRouter();
  const [session, setSession] = useState<SessionState | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    void fetch("/api/session")
      .then((r) => r.json())
      .then((d: SessionState) => setSession(d))
      .catch(() => setSession({ authenticated: false }));
  }, []);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authenticated: false });
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  if (session === null) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
        <p className="text-center text-sm text-stone-500">Loading…</p>
      </div>
    );
  }

  if (session.authenticated && session.user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-lg">
        <p className="text-sm font-medium text-stone-900">You&apos;re already logged in</p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Email</dt>
            <dd className="mt-1 text-stone-800">{session.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Phone</dt>
            <dd className="mt-1 text-stone-800">{session.user.phone ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-wide text-stone-500">Credits</dt>
            <dd className="mt-1 text-stone-800">{session.credits ?? "—"}</dd>
          </div>
        </dl>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href="/#studio"
            className="flex-1 rounded-xl bg-amber-600 py-3 text-center text-sm font-semibold text-white hover:bg-amber-700"
          >
            Go to studio
          </Link>
          <Link
            href="/profile"
            className="flex-1 rounded-xl border border-stone-200 py-3 text-center text-sm font-semibold text-stone-800 hover:bg-stone-50"
          >
            Profile
          </Link>
        </div>
        <button
          type="button"
          disabled={loggingOut}
          onClick={() => void logout()}
          className="mt-3 w-full rounded-xl py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
        >
          {loggingOut ? "Logging out…" : "Log out"}
        </button>
      </div>
    );
  }

  return <LoginForm />;
}
