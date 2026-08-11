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
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-6 text-center text-stone-800">
      <h1 className="text-2xl font-light text-stone-900">Something broke</h1>
      <p className="mt-3 max-w-md text-sm text-stone-600">
        {error.message || "An unexpected error occurred."}
      </p>
      <div className="mt-8 flex gap-4">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-amber-500"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm text-stone-700 shadow-sm hover:bg-stone-50"
        >
          Home
        </Link>
      </div>
    </div>
  );
}
