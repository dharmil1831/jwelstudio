import Image from "next/image";
import Link from "next/link";

const LINKS = [
  { href: "/", label: "Studio" },
  { href: "/pricing", label: "Pricing" },
  { href: "/gallery", label: "Gallery" },
  { href: "/login", label: "Log in" },
] as const;

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
  { href: "/refund", label: "Refunds" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-primary/15 bg-background">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-sm">
            <Link href="/" aria-label="Jwelpixel home" className="inline-flex">
              <Image
                src="/brand/jwelpixel-logo-v4.png"
                unoptimized
                alt="Jwelpixel — AI model shots & videos for jewelry"
                width={1321}
                height={400}
                className="h-12 w-auto object-contain object-left"
              />
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-foreground/60">
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

        <div className="flex flex-col gap-3 border-t border-primary/10 pt-6 text-xs text-foreground/50 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Jwelpixel. All rights reserved.</p>
          <nav aria-label="Policies" className="flex flex-wrap gap-x-4 gap-y-2">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-primary">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
