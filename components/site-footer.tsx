import Link from "next/link";

const LINKS = [
  { href: "/", label: "Studio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/login", label: "Log in" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/15 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <p className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight text-foreground">
              Jewel Studio
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/60">
              AI model shots and videos for jewelry brands — upload a piece,
              pick a look, generate campaign-ready visuals.
            </p>
          </div>

          <nav
            aria-label="Footer"
            className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-foreground/70"
          >
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-2 border-t border-primary/10 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Jewel Studio. All rights reserved.</p>
          <p>Jewelry visuals powered by AI — for business use by account holders.</p>
        </div>
      </div>
    </footer>
  );
}
