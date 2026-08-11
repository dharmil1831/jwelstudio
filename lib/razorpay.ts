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
  return [
    { id: "starter", label: "Starter", amountPaise: 9900, credits: 20 },
    { id: "pro", label: "Pro", amountPaise: 19900, credits: 50 },
    { id: "studio", label: "Studio", amountPaise: 49900, credits: 150 },
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
