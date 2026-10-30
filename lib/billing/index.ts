import type { BillingChannel, CheckoutSession, PaymentProvider } from "@/lib/billing/types";
import { dodoProvider } from "@/lib/billing/dodo";
import { appleProvider, playProvider } from "@/lib/billing/stores";

const providers: PaymentProvider[] = [dodoProvider, playProvider, appleProvider];

export function providerFor(channel: BillingChannel): PaymentProvider {
  const match = providers.find(
    (provider) => provider.channels.includes(channel) && provider.isConfigured(),
  );
  if (match) return match;
  if (channel === "android") throw new Error("Play billing is not open yet.");
  if (channel === "ios") throw new Error("App Store billing is not open yet.");
  throw new Error("Checkout is not open yet.");
}

export async function startBillingCheckout(input: {
  channel: BillingChannel;
  userId: string;
  email?: string | null;
  packId: string;
}): Promise<CheckoutSession> {
  return providerFor(input.channel).startCheckout(input);
}

export function billingChannel(value: unknown): BillingChannel {
  if (value === "android" || value === "ios" || value === "web") return value;
  return "web";
}
