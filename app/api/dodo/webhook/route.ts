import { parseDodoCharge } from "@/lib/billing/dodo";
import { verifyDodoSignature } from "@/lib/dodo";
import { fulfillPayment } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyDodoSignature(raw, req.headers)) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  let event: unknown;
  try {
    event = JSON.parse(raw) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const charge = parseDodoCharge(event);
  if (!charge) return NextResponse.json({ ok: true });

  await prisma.payment.upsert({
    where: { razorpayOrderId: charge.paymentId },
    create: {
      userId: charge.userId,
      razorpayOrderId: charge.paymentId,
      amountPaise: charge.amountMinor,
      creditsAdded: charge.credits,
      packId: charge.packId,
      status: "created",
    },
    update: charge.updateAmount ? { amountPaise: charge.amountMinor } : {},
  });

  await fulfillPayment(charge.paymentId, charge.paymentId);
  return NextResponse.json({ ok: true });
}
