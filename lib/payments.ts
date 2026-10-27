import {
  higherPlan,
  isPaidPlanId,
  normalizePlanId,
  type PlanId,
} from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";

export type FulfillPaymentResult = {
  userId: string;
  creditsAdded: number;
  credits: number;
  plan: PlanId;
  alreadyPaid: boolean;
};

/** Idempotent: credits are added at most once per order. Highest plan wins. */
export async function fulfillPayment(
  orderId: string,
  paymentId: string,
): Promise<FulfillPaymentResult | null> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({
      where: { razorpayOrderId: orderId },
    });
    if (!payment) return null;

    if (payment.status === "paid") {
      const user = await tx.user.findUnique({ where: { id: payment.userId } });
      return {
        userId: payment.userId,
        creditsAdded: payment.creditsAdded,
        credits: user?.credits ?? 0,
        plan: normalizePlanId(user?.plan),
        alreadyPaid: true,
      };
    }

    await tx.payment.update({
      where: { id: payment.id },
      data: {
        status: "paid",
        razorpayPaymentId: paymentId,
      },
    });

    const current = await tx.user.findUnique({
      where: { id: payment.userId },
      select: { plan: true },
    });
    const purchased = payment.packId ? normalizePlanId(payment.packId) : "free";
    const nextPlan =
      isPaidPlanId(purchased) || purchased !== "free"
        ? higherPlan(normalizePlanId(current?.plan), purchased)
        : normalizePlanId(current?.plan);

    const user = await tx.user.update({
      where: { id: payment.userId },
      data: {
        credits: { increment: payment.creditsAdded },
        plan: nextPlan,
      },
    });

    return {
      userId: payment.userId,
      creditsAdded: payment.creditsAdded,
      credits: user.credits,
      plan: normalizePlanId(user.plan),
      alreadyPaid: false,
    };
  });
}

/**
 * First charge uses the subscription id row. Later months insert one row per
 * Razorpay payment id so credits are added again without double-counting.
 */
export async function fulfillSubscriptionCharge(
  subscriptionId: string,
  paymentId: string,
): Promise<FulfillPaymentResult | null> {
  return prisma.$transaction(async (tx) => {
    const anchor = await tx.payment.findUnique({
      where: { razorpayOrderId: subscriptionId },
    });
    if (!anchor) return null;

    const already = await tx.payment.findFirst({
      where: {
        OR: [
          { razorpayPaymentId: paymentId },
          { razorpayOrderId: paymentId },
        ],
      },
    });
    if (already) {
      const user = await tx.user.findUnique({ where: { id: anchor.userId } });
      return {
        userId: anchor.userId,
        creditsAdded: anchor.creditsAdded,
        credits: user?.credits ?? 0,
        plan: normalizePlanId(user?.plan),
        alreadyPaid: true,
      };
    }

    const current = await tx.user.findUnique({
      where: { id: anchor.userId },
      select: { plan: true },
    });
    const purchased = anchor.packId ? normalizePlanId(anchor.packId) : "free";
    const nextPlan = isPaidPlanId(purchased)
      ? higherPlan(normalizePlanId(current?.plan), purchased)
      : normalizePlanId(current?.plan);

    if (anchor.status === "created") {
      await tx.payment.update({
        where: { id: anchor.id },
        data: { status: "active", razorpayPaymentId: paymentId },
      });
    } else {
      await tx.payment.create({
        data: {
          userId: anchor.userId,
          razorpayOrderId: paymentId,
          razorpayPaymentId: paymentId,
          amountPaise: anchor.amountPaise,
          creditsAdded: anchor.creditsAdded,
          packId: anchor.packId,
          status: "paid",
        },
      });
    }

    const user = await tx.user.update({
      where: { id: anchor.userId },
      data: {
        credits: { increment: anchor.creditsAdded },
        plan: nextPlan,
      },
    });

    return {
      userId: anchor.userId,
      creditsAdded: anchor.creditsAdded,
      credits: user.credits,
      plan: normalizePlanId(user.plan),
      alreadyPaid: false,
    };
  });
}
