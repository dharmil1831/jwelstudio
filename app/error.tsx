"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 text-center text-foreground">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-light text-foreground">
        Something broke
      </h1>
      <p className="mt-3 max-w-md text-sm text-foreground/70">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-background shadow-sm hover:bg-accent hover:text-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-primary/30 bg-secondary px-5 py-2.5 text-sm text-foreground shadow-sm hover:bg-accent/30"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
