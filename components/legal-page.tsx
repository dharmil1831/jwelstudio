import Link from "next/link";
import type { ReactNode } from "react";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <article className="mx-auto max-w-3xl">
        <Link
          href="/"
          className="text-sm font-medium text-primary hover:text-accent"
        >
          ← Back to studio
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-4xl font-normal text-foreground">
          {title}
        </h1>
        <p className="mt-3 text-sm text-foreground/55">
          Last updated 21 October 2026
        </p>
        <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/80 [&_h2]:font-[family-name:var(--font-display)] [&_h2]:text-2xl [&_h2]:font-normal [&_h2]:text-foreground [&_li]:mt-1 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
          {children}
        </div>
      </article>
    </div>
  );
}
