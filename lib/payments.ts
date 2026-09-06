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
