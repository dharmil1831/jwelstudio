export type BillingChannel = "web" | "android" | "ios";

export type CheckoutStart = {
  channel: BillingChannel;
  userId: string;
  email?: string | null;
  packId: string;
};

export type CheckoutSession =
  | { provider: "dodo"; kind: "redirect"; url: string }
  | { provider: "play" | "app_store"; kind: "store"; productId: string };

/** A confirmed charge. Credits are added once per paymentId. */
export type PaidCharge = {
  type: "paid" | "renewed";
  paymentId: string;
  userId: string;
  packId: string;
  credits: number;
  amountMinor: number;
  currency: "inr" | "usd";
  updateAmount: boolean;
};

export interface PaymentProvider {
  id: CheckoutSession["provider"];
  channels: BillingChannel[];
  isConfigured(): boolean;
  startCheckout(input: CheckoutStart): Promise<CheckoutSession>;
}
