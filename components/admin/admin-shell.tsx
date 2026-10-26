"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/generations", label: "Generations" },
  { href: "/admin/templates", label: "Templates" },
  { href: "/admin/homepage", label: "Homepage" },
  { href: "/admin/settings", label: "Settings" },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/admin-logout", { method: "POST" });
      window.dispatchEvent(new Event("jewel-auth-changed"));
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="border-b border-primary/15 bg-background shadow-[0_2px_12px_rgba(76,45,120,0.08)] lg:hidden">
        <div className="flex items-center gap-3 px-4 pt-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/55">
              Super admin
            </p>
            <p className="truncate text-xs text-foreground/80">{email}</p>
          </div>
          <Link href="/" className="shrink-0 text-xs font-medium text-primary">
            Studio
          </Link>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void logout()}
            className="shrink-0 rounded-full border border-red-300 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 disabled:opacity-50"
          >
            {loggingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
        <nav className="flex gap-1.5 overflow-x-auto px-4 py-2.5">
          {NAV.map((item) => {
            const active =
              "exact" in item && item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold ${
                  active
                    ? "bg-primary text-white"
                    : "border border-primary/20 bg-white text-foreground/75"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="mx-auto flex max-w-7xl gap-8 px-4 py-5 sm:px-6 lg:py-8">
        <aside className="hidden w-52 shrink-0 lg:block">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">
            Super admin
          </p>
          <p className="mt-1 truncate text-sm text-foreground/80">{email}</p>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV.map((item) => {
              const active =
                "exact" in item && item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-primary text-background"
                      : "text-foreground/80 hover:bg-accent/30"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            disabled={loggingOut}
            onClick={() => void logout()}
            className="mt-8 block text-left text-sm text-red-700 hover:underline disabled:opacity-50"
          >
            {loggingOut ? "Signing out…" : "Admin sign out"}
          </button>
          <Link
            href="/"
            className="mt-3 inline-block text-sm text-primary hover:text-accent"
          >
            ← Back to studio
          </Link>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
