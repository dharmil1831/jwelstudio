"use client";

import { BuyCreditsButton } from "@/components/buy-credits-button";
import { DodoBuyButton } from "@/components/dodo-buy-button";
import { StoreBuyButton } from "@/components/store-buy-button";
import { useEffect, useState } from "react";

type CheckoutMode = "pending" | "store" | "web";

function nativeStoreReady(): boolean {
  const cap = (
    window as Window & {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        isPluginAvailable?: (name: string) => boolean;
      };
    }
  ).Capacitor;
  return Boolean(cap?.isNativePlatform?.() && cap?.isPluginAvailable?.("Purchases"));
}

export function SubscribeButton({
  packId,
  dodoOn,
}: {
  packId: string;
  dodoOn: boolean;
}) {
  const [mode, setMode] = useState<CheckoutMode>("pending");

  useEffect(() => {
    setMode(nativeStoreReady() ? "store" : "web");
  }, []);

  if (mode === "pending") {
    return (
      <button
        type="button"
        disabled
        className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-background opacity-50"
      >
        Subscribe monthly
      </button>
    );
  }

  if (mode === "store") return <StoreBuyButton packId={packId} />;
  if (dodoOn) return <DodoBuyButton packId={packId} />;
  return <BuyCreditsButton packId={packId} />;
}
