"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

type Pack = {
  id: string;
  label: string;
  amountPaise: number;
  credits: number;
};

export function BuyCreditsButton({ packId }: { packId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.getElementById("razorpay-js")) return;
    const s = document.createElement("script");
    s.id = "razorpay-js";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    document.body.appendChild(s);
  }, []);

  async function waitForRazorpay(maxMs = 8000): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
      if (window.Razorpay) return true;
      await new Promise((r) => setTimeout(r, 100));
    }
    return Boolean(window.Razorpay);
  }

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
              const r = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ packId }),
              });
              const data = (await r.json()) as {
                error?: string;
                keyId?: string;
                orderId?: string;
                amount?: number;
                currency?: string;
                pack?: Pack;
                prefill?: { email?: string; contact?: string };
              };

              if (r.status === 401) {
                throw new Error("Please log in to buy credits.");
              }
              if (!r.ok) throw new Error(data.error ?? "Checkout failed");

              const ready = await waitForRazorpay();
              if (!ready || !data.keyId || !data.orderId) {
                throw new Error("Razorpay failed to load. Check your connection.");
              }

              const rzp = new window.Razorpay!({
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: "Jwelpixel",
                description: `${data.pack?.credits ?? ""} generation credits`,
                order_id: data.orderId,
                prefill: data.prefill,
                theme: { color: "#7c5cbf" },
                handler: (response: {
                  razorpay_payment_id: string;
                  razorpay_order_id: string;
                  razorpay_signature: string;
                }) => {
                  void fetch("/api/razorpay/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(response),
                  })
                    .then(async (vr) => {
                      const vd = (await vr.json()) as {
                        error?: string;
                        credits?: number;
                      };
                      if (!vr.ok) throw new Error(vd.error ?? "Verification failed");
                      router.push("/pricing?paid=1");
                      router.refresh();
                    })
                    .catch((e: unknown) => {
                      setError(e instanceof Error ? e.message : "Payment verify failed");
                      setLoading(false);
                    });
                },
                modal: {
                  ondismiss: () => setLoading(false),
                },
              });
              rzp.open();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Checkout failed");
              setLoading(false);
            }
          })();
        }}
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background disabled:opacity-50 hover:bg-accent hover:text-foreground"
      >
        {loading ? "Opening checkout…" : "Buy with Razorpay"}
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
