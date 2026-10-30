import { getCreditPacks } from "@/lib/credit-packs";
import crypto from "crypto";

const GRANT_TYPES = new Set(["INITIAL_PURCHASE", "RENEWAL"]);
const STORE_SOURCES = new Set(["PLAY_STORE", "APP_STORE"]);

export type RevenueCatPurchase = {
  eventId: string;
  userId: string;
  packId: string;
  transactionId: string;
  amountMinor: number;
};

export function packIdForStoreProduct(productId: string): string | undefined {
  const base = productId.split(":")[0];
  return getCreditPacks().some((pack) => pack.id === base) ? base : undefined;
}

export function revenueCatConfigured(): boolean {
  return Boolean(process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim());
}

/** RevenueCat sends the authorization value configured on the webhook. */
export function revenueCatAuthorized(header: string | null): boolean {
  const expected = process.env.REVENUECAT_WEBHOOK_AUTHORIZATION?.trim();
  if (!expected || !header) return false;
  const presented = header.replace(/^Bearer\s+/i, "").trim();
  for (const value of [header.trim(), presented]) {
    const a = Buffer.from(expected);
    const b = Buffer.from(value);
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return true;
  }
  return false;
}

/**
 * Grants credits for a Play Store or App Store purchase already tied to our user id.
 * Other stores and anonymous RevenueCat users are ignored.
 */
export function parseRevenueCatPurchase(body: unknown): RevenueCatPurchase | null {
  if (!body || typeof body !== "object") return null;
  const event = (body as { event?: unknown }).event;
  if (!event || typeof event !== "object") return null;
  const row = event as {
    id?: unknown;
    type?: unknown;
    app_user_id?: unknown;
    product_id?: unknown;
    transaction_id?: unknown;
    store?: unknown;
    price_in_purchased_currency?: unknown;
  };
  if (typeof row.type !== "string" || !GRANT_TYPES.has(row.type)) return null;
  if (typeof row.store !== "string" || !STORE_SOURCES.has(row.store)) return null;
  if (typeof row.app_user_id !== "string" || !row.app_user_id || row.app_user_id.startsWith("$RCAnonymous")) {
    return null;
  }
  if (typeof row.id !== "string" || !row.id) return null;
  if (typeof row.transaction_id !== "string" || !row.transaction_id) return null;
  if (typeof row.product_id !== "string") return null;
  const packId = packIdForStoreProduct(row.product_id);
  if (!packId) return null;
  const pack = getCreditPacks().find((item) => item.id === packId);
  if (!pack) return null;
  const price = row.price_in_purchased_currency;
  const amountMinor =
    typeof price === "number" && Number.isFinite(price) && price > 0
      ? Math.round(price * 100)
      : pack.amountCents;
  return {
    eventId: row.id,
    userId: row.app_user_id,
    packId,
    transactionId: row.transaction_id,
    amountMinor,
  };
}
