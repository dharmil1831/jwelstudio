import { appBaseUrl } from "@/lib/app-url";
import crypto from "crypto";

const TEST_PRODUCT_IDS: Record<string, string> = {
  silver: "pdt_0NqmuSy7iDT56IVfx5FWQ",
  gold: "pdt_0NqmuT63WdJ1Rzyl4WFD6",
  platinum: "pdt_0NqmuT9HifrzeQOCr6GXl",
  diamond: "pdt_0NqmuTCOO69qPIlFuhYPN",
};

const PACK_IDS = ["silver", "gold", "platinum", "diamond"] as const;

export function dodoApiKey(): string | undefined {
  const mode = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim();
  const live = process.env.DODO_PAYMENTS_LIVE_API_KEY?.trim();
  if (mode === "live_mode" && live) return live;
  const key = process.env.DODO_PAYMENTS_API_KEY?.trim();
  return key || undefined;
}

export function isDodoConfigured(): boolean {
  return Boolean(dodoApiKey());
}

export function isDodoTest(): boolean {
  const key = dodoApiKey() ?? "";
  if (key.includes("dodo_live_")) return false;
  if (key.includes("dodo_test_")) return true;
  return process.env.DODO_PAYMENTS_ENVIRONMENT?.trim() !== "live_mode";
}

export function dodoApiBase(): string {
  return isDodoTest()
    ? "https://test.dodopayments.com"
    : "https://live.dodopayments.com";
}

function productIdFromEnv(packId: string): string | undefined {
  const prefix = isDodoTest() ? "DODO_TEST_PRODUCT_" : "DODO_LIVE_PRODUCT_";
  const value = process.env[`${prefix}${packId.toUpperCase()}`]?.trim();
  return value || undefined;
}

export function dodoProductId(packId: string): string | undefined {
  return productIdFromEnv(packId) ?? (isDodoTest() ? TEST_PRODUCT_IDS[packId] : undefined);
}

export function packIdForDodoProduct(productId: string): string | undefined {
  for (const packId of PACK_IDS) {
    if (dodoProductId(packId) === productId || TEST_PRODUCT_IDS[packId] === productId) {
      return packId;
    }
  }
  return undefined;
}

function dodoReturnUrl(): string {
  const base = appBaseUrl();
  if (base.startsWith("https://")) return `${base}/pricing?paid=1`;
  return "https://jwel-pixel.vercel.app/pricing?paid=1";
}

export async function createDodoCheckout(params: {
  productId: string;
  userId: string;
  packId: string;
  email?: string | null;
  name?: string | null;
}): Promise<{ checkoutUrl: string }> {
  const key = dodoApiKey();
  if (!key) throw new Error("Checkout is not open yet.");

  const res = await fetch(`${dodoApiBase()}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      product_cart: [{ product_id: params.productId, quantity: 1 }],
      customer: {
        email: params.email || undefined,
        name: params.name || undefined,
      },
      return_url: dodoReturnUrl(),
      metadata: {
        userId: params.userId,
        packId: params.packId,
      },
      feature_flags: { redirect_immediately: true },
    }),
  });

  if (!res.ok) {
    console.error("Dodo checkout failed", res.status);
    throw new Error("Checkout failed");
  }

  const body = (await res.json()) as { checkout_url?: string };
  if (!body.checkout_url) throw new Error("Checkout failed");
  return { checkoutUrl: body.checkout_url };
}

/** Standard Webhooks: webhook-id, webhook-timestamp, webhook-signature. */
export function verifyDodoSignature(
  rawBody: string,
  headers: Headers,
): boolean {
  const mode = process.env.DODO_PAYMENTS_ENVIRONMENT?.trim();
  const liveSecret = process.env.DODO_PAYMENTS_LIVE_WEBHOOK_SECRET?.trim();
  const secret =
    mode === "live_mode" && liveSecret
      ? liveSecret
      : process.env.DODO_PAYMENTS_WEBHOOK_SECRET?.trim();
  const id = headers.get("webhook-id");
  const timestamp = headers.get("webhook-timestamp");
  const signature = headers.get("webhook-signature");
  if (!secret || !id || !timestamp || !signature) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = crypto
    .createHmac("sha256", key)
    .update(`${id}.${timestamp}.${rawBody}`)
    .digest("base64");

  for (const part of signature.split(" ")) {
    const value = part.startsWith("v1,") ? part.slice(3) : part;
    const a = Buffer.from(expected);
    const b = Buffer.from(value);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}
