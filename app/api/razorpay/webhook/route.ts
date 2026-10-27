import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfillPayment, fulfillSubscriptionCharge } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const signature = req.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const raw = await req.text();
  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: {
        entity?: {
          id?: string;
          order_id?: string;
          status?: string;
        };
      };
      subscription?: {
        entity?: { id?: string };
      };
    };
  };

  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const paymentEntity = event.payload?.payment?.entity;
  const subscriptionId = event.payload?.subscription?.entity?.id;

  if (event.event === "subscription.charged" && subscriptionId && paymentEntity?.id) {
    const eventId = `sub:${paymentEntity.id}`;
    const existing = await prisma.processedPaymentEvent.findUnique({
      where: { id: eventId },
    });
    if (existing) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    const result = await fulfillSubscriptionCharge(subscriptionId, paymentEntity.id);
    if (!result) {
      return NextResponse.json({ received: true, ignored: true });
    }
    await prisma.processedPaymentEvent.create({ data: { id: eventId } });
    return NextResponse.json({ received: true, autopay: true });
  }

  if (event.event !== "payment.captured" || !paymentEntity?.order_id) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const knownOrder = await prisma.payment.findUnique({
    where: { razorpayOrderId: paymentEntity.order_id },
  });
  if (!knownOrder) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const eventId = paymentEntity.id ?? paymentEntity.order_id;
  const existing = await prisma.processedPaymentEvent.findUnique({
    where: { id: eventId },
  });
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  await prisma.processedPaymentEvent.create({ data: { id: eventId } });
  await fulfillPayment(paymentEntity.order_id, paymentEntity.id ?? eventId);

  return NextResponse.json({ received: true });
}
