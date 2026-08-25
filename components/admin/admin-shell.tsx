"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/generations", label: "Generations" },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="mx-auto flex max-w-7xl gap-8 px-6 py-8">
        <aside className="w-52 shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-foreground/55">
            Admin
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
          <Link
            href="/"
            className="mt-8 inline-block text-sm text-primary hover:text-accent"
          >
            ← Back to studio
          </Link>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
