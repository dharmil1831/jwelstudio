import { LegalPage } from "@/components/legal-page";
import { sitePublic } from "@/lib/site-public";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact — Jwelpixel",
  description: "Email jwelpixel@gmail.com for account help, failed generations, and refund requests.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <LegalPage title="Contact">
      <section>
        <h2>Support</h2>
        <p className="mt-3">
          For account help, failed generations, and refund requests, email{" "}
          <a
            href={`mailto:${sitePublic.supportEmail}`}
            className="text-primary underline"
          >
            {sitePublic.supportEmail}
          </a>
          . Include the email you used to sign up. We reply within 3 business
          days.
        </p>
        {sitePublic.phone ? (
          <p className="mt-3">Phone: {sitePublic.phone}</p>
        ) : null}
        {sitePublic.address ? (
          <p className="mt-3 whitespace-pre-line">{sitePublic.address}</p>
        ) : null}
      </section>
      <section>
        <h2>Payments</h2>
        <p className="mt-3">
          Credit packs are listed on the{" "}
          <Link href="/pricing" className="text-primary underline">
            pricing page
          </Link>{" "}
          and charged by Dodo Payments. In India that is rupees, by card or UPI. Refund rules are on the{" "}
          <Link href="/refund" className="text-primary underline">
            refund page
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Policies</h2>
        <ul>
          <li>
            <Link href="/terms" className="text-primary underline">
              Terms of use
            </Link>
          </li>
          <li>
            <Link href="/privacy" className="text-primary underline">
              Privacy policy
            </Link>
          </li>
          <li>
            <Link href="/refund" className="text-primary underline">
              Refund and cancellation
            </Link>
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
