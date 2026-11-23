"use client";

import { toUserFacingError } from "@/lib/user-facing-error";
import Link from "next/link";
import { useState } from "react";

export function DodoBuyButton({
  packId,
  purchase = "subscribe",
}: {
  packId: string;
  purchase?: "subscribe" | "topup";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openedExternally, setOpenedExternally] = useState(false);
  const isTopup = purchase === "topup";

  return (
    <div>
      <button
        type="button"
        disabled={loading}
        onClick={() => {
          setError(null);
          setOpenedExternally(false);
          setLoading(true);
          void (async () => {
            try {
              const response = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  packId,
                  channel: "web",
                  purchase: isTopup ? "topup" : "subscribe",
                }),
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
                setOpenedExternally(true);
                setLoading(false);
              } else {
                window.location.assign(data.url);
              }
            } catch (cause) {
              setError(toUserFacingError(cause, "Checkout failed"));
              setLoading(false);
            }
          })();
        }}
        className={
          isTopup
            ? "mt-3 w-full rounded-xl border border-primary/40 bg-secondary py-3 text-sm font-semibold text-primary disabled:opacity-50 hover:bg-primary/10"
            : "mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-50 hover:bg-accent hover:text-foreground"
        }
      >
        {loading
          ? "Opening checkout…"
          : isTopup
            ? "Buy credits once"
            : "Subscribe monthly"}
      </button>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-foreground/55">
        You can close checkout anytime without paying.
      </p>
      {openedExternally ? (
        <p className="mt-2 text-center text-[11px] text-foreground/70" role="status">
          Checkout opened in a new tab. Close that tab to cancel, then return here.
        </p>
      ) : null}
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
