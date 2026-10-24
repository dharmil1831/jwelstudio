import { LegalPage } from "@/components/legal-page";
import { sitePublic } from "@/lib/site-public";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds — Jwelpixel",
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund and cancellation">
      <section>
        <h2>What you buy</h2>
        <p className="mt-3">
          {sitePublic.name} sells digital generation credits in Indian rupees.
          Credits are added to your account as soon as Razorpay confirms the
          payment. There is no physical shipment. Prices are on the{" "}
          <Link href="/pricing" className="text-primary underline">
            pricing page
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>When we refund</h2>
        <ul>
          <li>
            You were charged and the credits never appeared. Write to us within
            7 days with the payment time and the email on the account. We will
            add the credits or refund the amount.
          </li>
          <li>
            You were charged twice for one purchase. We refund the duplicate.
          </li>
          <li>
            A generation failed and did not save a result, but credits were
            still taken. We restore those credits.
          </li>
        </ul>
      </section>
      <section>
        <h2>When we do not refund</h2>
        <ul>
          <li>
            Credits were added successfully. Because the credits are delivered
            immediately, that purchase is not refundable once any of those
            credits have been used.
          </li>
          <li>
            You are unhappy with an AI result that was generated and saved.
            Check the preview options and regenerate. A result that does not
            match your taste is not a failed payment.
          </li>
          <li>Free signup credits. Those are not a purchase.</li>
        </ul>
      </section>
      <section>
        <h2>Cancellation</h2>
        <p className="mt-3">
          One-time credit packs do not renew. If a monthly plan is active, you
          can ask us to cancel it. Cancellation stops future charges. Credits
          already added for the current period stay on the account and are not
          refunded.
        </p>
      </section>
      <section>
        <h2>How to ask</h2>
        <p className="mt-3">
          Email{" "}
          <a
            href={`mailto:${sitePublic.supportEmail}`}
            className="text-primary underline"
          >
            {sitePublic.supportEmail}
          </a>{" "}
          from the address on your account. Include the date, the amount, and
          what went wrong. We reply within 3 business days. Approved refunds go
          back through Razorpay to the original payment method. Your bank can
          take several working days to show the money.
        </p>
      </section>
    </LegalPage>
  );
}
