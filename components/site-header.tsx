"use client";

import {
  CreditsUsageCard,
  CreditsUsageChip,
} from "@/components/credits-usage-card";
import Image from "next/image";
import Link from "next/link";
import { fetchClientSession } from "@/lib/fetch-session";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export type HeaderSession = {
  authenticated: boolean;
  isAdmin?: boolean;
  user?: { email: string; phone: string | null };
  credits?: number;
  plan?: string;
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
  const creditsRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<HeaderSession | null>(
    initialSession ?? null,
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchClientSession()
      .then((d) => {
        if (cancelled) return;
        setSession({
          authenticated: Boolean(d.authenticated),
          isAdmin: d.isAdmin,
          user: d.user?.email
            ? { email: d.user.email, phone: d.user.phone ?? null }
            : undefined,
          credits: d.credits,
          plan:
            typeof d.plan === "string"
              ? d.plan
              : typeof d.user?.plan === "string"
                ? d.user.plan
                : undefined,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setSession((current) => current ?? { authenticated: false });
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    function onAuthChanged() {
      void fetchClientSession()
        .then((d) => {
          setSession({
            authenticated: Boolean(d.authenticated),
            isAdmin: d.isAdmin,
            user: d.user?.email
              ? { email: d.user.email, phone: d.user.phone ?? null }
              : undefined,
            credits: d.credits,
            plan:
              typeof d.plan === "string"
                ? d.plan
                : typeof d.user?.plan === "string"
                  ? d.user.plan
                  : undefined,
          });
        })
        .catch(() => {});
    }
    function onCreditsChanged(event: Event) {
      const detail = (event as CustomEvent<{ credits?: number; plan?: string }>)
        .detail;
      if (!detail) return;
      setSession((current) =>
        current?.authenticated
          ? {
              ...current,
              credits:
                typeof detail.credits === "number"
                  ? detail.credits
                  : current.credits,
              plan:
                typeof detail.plan === "string" ? detail.plan : current.plan,
            }
          : current,
      );
    }
    window.addEventListener("jewel-auth-changed", onAuthChanged);
    window.addEventListener("jewel-credits-changed", onCreditsChanged);
    return () => {
      window.removeEventListener("jewel-auth-changed", onAuthChanged);
      window.removeEventListener("jewel-credits-changed", onCreditsChanged);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen && !creditsOpen) return;

    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (menuOpen && menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
      if (
        creditsOpen &&
        creditsRef.current &&
        !creditsRef.current.contains(target)
      ) {
        setCreditsOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuOpen, creditsOpen]);

  const logout = useCallback(async () => {
    setLoggingOut(true);
    setMenuOpen(false);
    setCreditsOpen(false);
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
  const plan = session?.plan ?? null;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-primary/15 bg-background/98 pt-[env(safe-area-inset-top)] shadow-[0_2px_12px_rgba(76,45,120,0.10)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center overflow-hidden hover:opacity-90"
          aria-label="Jwelpixel home"
        >
          <Image
            src="/brand/jwelpixel-logo-v4.png"
            unoptimized
            alt="Jwelpixel — AI model shots & videos for jewelry"
            width={1321}
            height={400}
            priority
            className="h-8 w-auto max-w-full object-contain object-left sm:h-14"
          />
        </Link>

        <nav className="flex shrink-0 items-center gap-2 text-xs text-foreground/70 sm:gap-3 sm:text-sm">
          <Link href="/pricing" className="hover:text-primary">
            Pricing
          </Link>
          <Link href="/gallery" className="hover:text-primary">
            Studio
          </Link>

          {session === null ? (
            <Link
              href="/login"
              className="rounded-full border border-primary/25 bg-secondary px-3 py-1.5 text-foreground/80 hover:border-primary"
            >
              Account
            </Link>
          ) : authenticated && email ? (
            <>
              <div className="relative" ref={creditsRef}>
                <CreditsUsageChip
                  credits={typeof credits === "number" ? credits : null}
                  plan={plan}
                  onClick={() => {
                    setMenuOpen(false);
                    setCreditsOpen((open) => !open);
                  }}
                />
                {creditsOpen ? (
                  <div className="absolute right-0 z-50 mt-2 w-[300px] rounded-2xl border border-primary/20 bg-[#f3eef8] p-3 shadow-lg">
                    <div className="mb-2 flex items-center justify-between px-1">
                      <p className="text-sm font-semibold text-foreground">
                        Your credits
                      </p>
                      <button
                        type="button"
                        onClick={() => setCreditsOpen(false)}
                        className="text-xs text-primary underline"
                      >
                        Close
                      </button>
                    </div>
                    <CreditsUsageCard
                      credits={typeof credits === "number" ? credits : null}
                      plan={plan}
                      compact
                    />
                  </div>
                ) : null}
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  aria-label={`Account menu for ${email}`}
                  onClick={() => {
                    setCreditsOpen(false);
                    setMenuOpen((open) => !open);
                  }}
                  className="flex items-center gap-2 rounded-full border border-primary/25 bg-secondary py-1 pl-1 pr-3 shadow-sm transition hover:border-primary"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-background">
                    {avatarLabel(email)}
                  </span>
                  <span className="hidden max-w-[10rem] truncate text-left text-sm font-medium text-foreground sm:block">
                    {email.split("@")[0]}
                  </span>
                </button>

                {menuOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 z-50 mt-2 w-64 rounded-xl border border-primary/20 bg-secondary py-1 shadow-lg"
                  >
                    <div className="border-b border-primary/15 px-4 py-3">
                      <p className="text-xs text-foreground/55">Signed in as</p>
                      <p className="mt-0.5 break-all text-sm font-medium text-foreground">
                        {email}
                      </p>
                      <p className="mt-1 text-xs text-foreground/55">
                        {credits ?? "—"} credits left
                        {isAdmin ? " · Admin" : ""}
                      </p>
                    </div>
                    <Link
                      href="/profile"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent/30"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/gallery"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-foreground/80 hover:bg-accent/30"
                    >
                      Studio
                    </Link>
                    <Link
                      href="/pricing"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="block px-4 py-2 text-sm text-primary hover:bg-accent/30"
                    >
                      Buy credits
                    </Link>
                    {isAdmin ? (
                      <Link
                        href="/admin"
                        role="menuitem"
                        onClick={() => setMenuOpen(false)}
                        className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-accent/30"
                      >
                        Admin panel
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
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-primary px-4 py-1.5 font-medium text-background hover:bg-accent hover:text-foreground"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
