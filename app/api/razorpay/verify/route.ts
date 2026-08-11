import { verifyPaymentSignature } from "@/lib/razorpay";
import { fulfillPayment } from "@/lib/payments";
import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    razorpay_order_id?: string;
    razorpay_payment_id?: string;
    razorpay_signature?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const orderId = body.razorpay_order_id;
  const paymentId = body.razorpay_payment_id;
  const signature = body.razorpay_signature;

  if (!orderId || !paymentId || !signature) {
    return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
  }

  const valid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
  }

  const result = await fulfillPayment(orderId, paymentId);
  if (!result || result.userId !== user.id) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    credits: result.credits,
    creditsAdded: result.creditsAdded,
    duplicate: result.alreadyPaid,
  });
}
