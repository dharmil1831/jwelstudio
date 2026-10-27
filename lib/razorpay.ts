import crypto from "crypto";

function getKeyId(): string | undefined {
  return process.env.RAZORPAY_KEY_ID?.trim() || undefined;
}

function getKeySecret(): string | undefined {
  return process.env.RAZORPAY_KEY_SECRET?.trim() || undefined;
}

export function isRazorpayConfigured(): boolean {
  return Boolean(getKeyId() && getKeySecret());
}

export function getRazorpayKeyId(): string {
  const id = getKeyId();
  if (!id) throw new Error("Razorpay is not configured.");
  return id;
}

export type CreditPack = {
  id: string;
  label: string;
  amountPaise: number;
  credits: number;
};

export function getCreditPacks(): CreditPack[] {
  const raw = process.env.RAZORPAY_CREDIT_PACKS?.trim();
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CreditPack[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {
      /* fall through */
    }
  }
  // ~₹30/credit: Silver / Gold / Platinum / Diamond
  return [
    { id: "silver", label: "Silver", amountPaise: 59900, credits: 20 },
    { id: "gold", label: "Gold", amountPaise: 149900, credits: 50 },
    { id: "platinum", label: "Platinum", amountPaise: 299900, credits: 100 },
    { id: "diamond", label: "Diamond", amountPaise: 599900, credits: 200 },
  ];
}

export async function createRazorpayOrder(params: {
  amountPaise: number;
  receipt: string;
  notes: Record<string, string>;
}): Promise<{ id: string; amount: number; currency: string }> {
  const secret = getKeySecret();
  if (!secret) throw new Error("Razorpay is not configured.");

  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${getKeyId()}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: params.amountPaise,
      currency: "INR",
      receipt: params.receipt,
      notes: params.notes,
    }),
  });

  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Razorpay order failed: ${msg.slice(0, 200)}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

export function verifyPaymentSignature(params: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getKeySecret();
  if (!secret) return false;
  const body = `${params.orderId}|${params.paymentId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === params.signature;
}

/** Razorpay subscription checkout signs `payment_id|subscription_id`. */
export function verifySubscriptionSignature(params: {
  subscriptionId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const secret = getKeySecret();
  if (!secret) return false;
  const body = `${params.paymentId}|${params.subscriptionId}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === params.signature;
}

async function razorpayFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const secret = getKeySecret();
  if (!secret) throw new Error("Razorpay is not configured.");
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${getKeyId()}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`Razorpay ${path} failed: ${msg.slice(0, 240)}`);
  }
  return res.json() as Promise<T>;
}

const AUTOPAY_CYCLES = 12;

/** Reuse a monthly plan for this pack, or create one. */
export async function ensureMonthlyPlan(pack: CreditPack): Promise<string> {
  const marker = `jwelpixel-${pack.id}-monthly-${pack.amountPaise}-${pack.credits}`;
  const listed = await razorpayFetch<{
    items?: { id: string; notes?: Record<string, string> }[];
  }>("/plans?count=100");
  const existing = listed.items?.find((p) => p.notes?.marker === marker);
  if (existing?.id) return existing.id;

  const created = await razorpayFetch<{ id: string }>("/plans", {
    method: "POST",
    body: JSON.stringify({
      period: "monthly",
      interval: 1,
      item: {
        name: `Jwelpixel ${pack.label} monthly`,
        amount: pack.amountPaise,
        currency: "INR",
        description: `${pack.credits} credits each month`,
      },
      notes: { marker, packId: pack.id },
    }),
  });
  return created.id;
}

export async function createRazorpaySubscription(params: {
  planId: string;
  notes: Record<string, string>;
}): Promise<{ id: string }> {
  return razorpayFetch<{ id: string }>("/subscriptions", {
    method: "POST",
    body: JSON.stringify({
      plan_id: params.planId,
      total_count: AUTOPAY_CYCLES,
      quantity: 1,
      customer_notify: 1,
      notes: params.notes,
    }),
  });
}

export { AUTOPAY_CYCLES };

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();
  if (!secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export function appBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}
