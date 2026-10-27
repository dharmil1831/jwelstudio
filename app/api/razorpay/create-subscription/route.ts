import {
  createRazorpaySubscription,
  ensureMonthlyPlan,
  getCreditPacks,
  getRazorpayKeyId,
  isRazorpayConfigured,
} from "@/lib/razorpay";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
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
  const pack = packs.find((p) => p.id === body.packId);
  if (!pack) {
    return NextResponse.json({ error: "Unknown pack." }, { status: 400 });
  }

  const planId = await ensureMonthlyPlan(pack);
  const subscription = await createRazorpaySubscription({
    planId,
    notes: {
      userId: user.id,
      credits: String(pack.credits),
      packId: pack.id,
    },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      razorpayOrderId: subscription.id,
      amountPaise: pack.amountPaise,
      creditsAdded: pack.credits,
      packId: pack.id,
      status: "created",
    },
  });

  return NextResponse.json({
    keyId: getRazorpayKeyId(),
    subscriptionId: subscription.id,
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
