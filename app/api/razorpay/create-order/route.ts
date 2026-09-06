import {
  createRazorpayOrder,
  getCreditPacks,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Razorpay is not configured." },
      { status: 503 },
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }

  let body: { packId?: string };
  try {
    body = (await req.json()) as { packId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const packs = getCreditPacks();
  const pack = packs.find((p) => p.id === body.packId) ?? packs[0];

  const order = await createRazorpayOrder({
    amountPaise: pack.amountPaise,
    receipt: `credits_${user.id.slice(0, 8)}_${Date.now()}`,
    notes: {
      userId: user.id,
      credits: String(pack.credits),
      packId: pack.id,
    },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      razorpayOrderId: order.id,
      amountPaise: pack.amountPaise,
      creditsAdded: pack.credits,
      packId: pack.id,
      status: "created",
    },
  });

  return NextResponse.json({
    keyId: getRazorpayKeyId(),
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    pack: {
      id: pack.id,
      label: pack.label,
      credits: pack.credits,
      amountPaise: pack.amountPaise,
    },
    prefill: {
      email: user.email,
      contact: user.phone?.replace(/^\+91/, "") || undefined,
    },
  });
}
