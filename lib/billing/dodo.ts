import { createDodoCheckout, dodoProductId, isDodoConfigured, packIdForDodoProduct } from "@/lib/dodo";
import { getCreditPacks } from "@/lib/credit-packs";
import type { CheckoutStart, PaidCharge, PaymentProvider } from "@/lib/billing/types";

type DodoEvent = {
  type?: string;
  data?: {
    payment_id?: string;
    metadata?: { userId?: string; packId?: string } | null;
    currency?: string;
    total_amount?: number;
    product_cart?: { product_id?: string }[];
  };
};

export const dodoProvider: PaymentProvider = {
  id: "dodo",
  channels: ["web"],
  isConfigured: isDodoConfigured,
  async startCheckout(input: CheckoutStart) {
    const productId = dodoProductId(input.packId);
    if (!productId) throw new Error("Unknown pack.");
    const checkout = await createDodoCheckout({
      productId,
      userId: input.userId,
      packId: input.packId,
      email: input.email,
    });
    return { provider: "dodo", kind: "redirect", url: checkout.checkoutUrl };
  },
};

/** Credits are granted only for a successful charge or a renewal that names that charge. */
export function parseDodoCharge(body: unknown): PaidCharge | null {
  if (!body || typeof body !== "object") return null;
  const event = body as DodoEvent;
  if (event.type !== "payment.succeeded" && event.type !== "subscription.renewed") {
    return null;
  }
  const data = event.data ?? {};
  const paymentId = data.payment_id;
  const metadata = data.metadata ?? {};
  const productId = data.product_cart?.[0]?.product_id;
  const packId = metadata.packId || (productId ? packIdForDodoProduct(productId) : undefined);
  const userId = metadata.userId;
  if (!paymentId || !userId || !packId) return null;
  const pack = getCreditPacks().find((item) => item.id === packId);
  if (!pack) return null;
  const currency = (data.currency ?? "INR").toLowerCase() === "usd" ? "usd" : "inr";
  const amount =
    typeof data.total_amount === "number"
      ? data.total_amount
      : currency === "usd"
        ? pack.amountCents
        : pack.amountPaise;
  return {
    type: event.type === "payment.succeeded" ? "paid" : "renewed",
    paymentId,
    userId,
    packId,
    credits: pack.credits,
    amountMinor: amount,
    currency,
    updateAmount: event.type === "payment.succeeded",
  };
}
