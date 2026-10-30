import { getCreditPacks } from "@/lib/credit-packs";
import { fulfillPayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import {
  parseRevenueCatPurchase,
  revenueCatAuthorized,
  revenueCatConfigured,
} from "@/lib/revenuecat";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Adds credits after Google Play or the App Store confirms a subscription. */
export async function POST(req: Request) {
  if (!revenueCatConfigured()) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!revenueCatAuthorized(req.headers.get("authorization"))) {
    return NextResponse.json({ error: "Invalid authorization" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const purchase = parseRevenueCatPurchase(body);
  if (!purchase) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const existingEvent = await prisma.processedPaymentEvent.findUnique({
    where: { id: purchase.eventId },
  });
  if (existingEvent) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const user = await prisma.user.findUnique({ where: { id: purchase.userId } });
  if (!user) {
    return NextResponse.json({ received: true, ignored: true });
  }

  await prisma.payment.upsert({
    where: { razorpayOrderId: purchase.transactionId },
    create: {
      userId: purchase.userId,
      razorpayOrderId: purchase.transactionId,
      amountPaise: purchase.amountMinor,
      creditsAdded:
        getCreditPacks().find((pack) => pack.id === purchase.packId)?.credits ?? 20,
      packId: purchase.packId,
      status: "created",
    },
    update: {},
  });

  await fulfillPayment(purchase.transactionId, purchase.transactionId);
  await prisma.processedPaymentEvent
    .create({ data: { id: purchase.eventId } })
    .catch(() => undefined);
  return NextResponse.json({ received: true });
}
