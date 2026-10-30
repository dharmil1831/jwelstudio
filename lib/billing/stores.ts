import type { CheckoutStart, PaymentProvider } from "@/lib/billing/types";

const PACKS = ["silver", "gold", "platinum", "diamond"] as const;

function productId(prefix: string, packId: string): string | undefined {
  const value = process.env[`${prefix}${packId.toUpperCase()}`]?.trim();
  return value || undefined;
}

function storeProvider(
  id: "play" | "app_store",
  channel: "android" | "ios",
  envPrefix: string,
  closedMessage: string,
): PaymentProvider {
  return {
    id,
    channels: [channel],
    isConfigured() {
      return PACKS.some((packId) => Boolean(productId(envPrefix, packId)));
    },
    async startCheckout(input: CheckoutStart) {
      const storeProductId = productId(envPrefix, input.packId);
      if (!storeProductId) throw new Error(closedMessage);
      return { provider: id, kind: "store", productId: storeProductId };
    },
  };
}

export const playProvider = storeProvider(
  "play",
  "android",
  "PLAY_PRODUCT_",
  "Play billing is not open yet.",
);

export const appleProvider = storeProvider(
  "app_store",
  "ios",
  "APPLE_PRODUCT_",
  "App Store billing is not open yet.",
);
