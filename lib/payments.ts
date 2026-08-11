import { prisma } from "@/lib/prisma";

export type FulfillPaymentResult = {
  userId: string;
  creditsAdded: number;
  credits: number;
  alreadyPaid: boolean;
};

/** Idempotent: credits are added at most once per order. */
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

    const user = await tx.user.update({
      where: { id: payment.userId },
      data: { credits: { increment: payment.creditsAdded } },
    });

    return {
      userId: payment.userId,
      creditsAdded: payment.creditsAdded,
      credits: user.credits,
      alreadyPaid: false,
    };
  });
}
