"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useState } from "react";

export function DodoBuyButton({ packId }: { packId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setError(null);
          setLoading(true);
          void (async () => {
            try {
              const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId, channel: "web" }),
              });
              const data = (await response.json()) as {
                error?: string;
                kind?: string;
                url?: string;
              };
              if (response.status === 401) {
                throw new Error("Please log in to buy credits.");
              }
              if (!response.ok || data.kind !== "redirect" || !data.url) {
                throw new Error(data.error ?? "Checkout failed");
              }
              const native = (
                window as Window & {
                  Capacitor?: { isNativePlatform?: () => boolean };
                }
              ).Capacitor?.isNativePlatform?.();
              if (native) {
                window.open(data.url, "_blank", "noopener,noreferrer");
              } else {
                window.location.assign(data.url);
              }
            } catch (cause) {
              setError(toUserFacingError(cause, "Checkout failed"));
              setLoading(false);
            }
          })();
        }}
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-50 hover:bg-accent hover:text-foreground"
      >
        {loading ? "Opening checkout…" : "Subscribe monthly"}
      </button>
      {error ? (
        <p className="mt-2 text-center text-xs text-red-600" role="alert">
          {error}
          {error.includes("log in") ? (
            <>
              {" "}
              <Link href="/login" className="font-medium underline">
                Log in
              </Link>
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
