import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfillPayment } from "@/lib/payments";
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
    };
  };

  try {
    event = JSON.parse(raw) as typeof event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const paymentEntity = event.payload?.payment?.entity;
  if (event.event !== "payment.captured" || !paymentEntity?.order_id) {
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
