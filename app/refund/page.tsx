import { LegalPage } from "@/components/legal-page";
import { sitePublic } from "@/lib/site-public";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Refunds — Jwelpixel",
  description: "How refunds and cancellations work for Jwelpixel generation credits.",
  alternates: { canonical: "/refund" },
};

export default function RefundPage() {
  return (
    <LegalPage title="Refund and cancellation">
      <section>
        <h2>What you buy</h2>
        <p className="mt-3">
          {sitePublic.name} sells monthly digital generation credits. Dodo
          Payments charges in US dollars each month. Credits are added as
          soon as the payment is confirmed. There is no physical shipment.
          Prices are on the{" "}
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
          Monthly plans renew until you cancel. You
          can ask us to cancel a plan. Cancellation stops future charges. Credits
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
          back through Dodo Payments to the original payment method. Your bank can
          take several working days to show the money.
        </p>
      </section>
    </LegalPage>
  );
}
