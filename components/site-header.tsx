"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeaderSession = {
  authenticated: boolean;
  isAdmin?: boolean;
  user?: { email: string; phone: string | null };
  credits?: number;
};

function avatarLabel(email: string): string {
  const local = email.split("@")[0] ?? email;
  return local.slice(0, 2).toUpperCase();
}

export function SiteHeader({
  initialSession,
}: {
  initialSession?: HeaderSession | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<HeaderSession | null>(
    initialSession ?? null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/session", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((d: HeaderSession) => {
        if (!cancelled) setSession(d);
      })
      .catch(() => {
        if (!cancelled) setSession({ authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    setMenuOpen(false);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setSession({ authenticated: false });
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }, [router]);

  const authenticated = session?.authenticated === true;
  const isAdmin = session?.isAdmin === true;
  const email = session?.user?.email;
  const credits = session?.credits;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-white/90 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="mr-auto shrink-0 text-lg font-semibold tracking-tight text-stone-900 hover:text-amber-900 sm:text-xl"
        >
          Jewel Studio
        </Link>

        <nav className="flex shrink-0 items-center gap-3 text-sm text-stone-600">
          <Link href="/pricing" className="hover:text-amber-800">
            Pricing
          </Link>
          <Link href="/gallery" className="hover:text-amber-800">
            Gallery
          </Link>

          {session === null ? (
            <Link
              href="/login"
              className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-stone-700 hover:border-amber-300"
            >
              Account
            </Link>
          ) : authenticated && email ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={`Account menu for ${email}`}
                onClick={() => setMenuOpen((open) => !open)}
                className="flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pl-1 pr-3 shadow-sm transition hover:border-amber-300"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xs font-semibold text-white">
                  {avatarLabel(email)}
                </span>
                <span className="hidden max-w-[10rem] truncate text-left text-sm font-medium text-stone-900 sm:block">
                  {email.split("@")[0]}
                </span>
              </button>

              {menuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
                >
                  <div className="border-b border-stone-100 px-4 py-3">
                    <p className="text-xs text-stone-500">Signed in as</p>
                    <p className="mt-0.5 break-all text-sm font-medium text-stone-900">
                      {email}
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      {credits ?? "—"} credits left
                      {isAdmin ? " · Admin" : ""}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-stone-700 hover:bg-amber-50"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/gallery"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-stone-700 hover:bg-amber-50"
                  >
                    Gallery
                  </Link>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm font-medium text-stone-900 hover:bg-amber-50"
                    >
                      Admin panel
                    </Link>
                  ) : null}
                  {credits === 0 ? (
                    <Link
                      href="/pricing"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-amber-800 hover:bg-amber-50"
                    >
                      Buy credits
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={loggingOut}
                    onClick={() => void logout()}
                    className="block w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut ? "Logging out…" : "Log out"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-amber-600 px-4 py-1.5 font-medium text-white hover:bg-amber-700"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
