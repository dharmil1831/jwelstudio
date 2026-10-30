import { LegalPage } from "@/components/legal-page";
import { sitePublic } from "@/lib/site-public";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of use — Jwelpixel",
  description: "Terms for using Jwelpixel to generate jewelry model shots, backgrounds, and videos.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of use">
      <section>
        <h2>The service</h2>
        <p className="mt-3">
          {sitePublic.name} generates jewelry model shots, backgrounds, and
          videos from photos you upload. Accounts, credits, and payments are
          part of the same service, on the website and in the Android app.
        </p>
      </section>
      <section>
        <h2>Your account</h2>
        <p className="mt-3">
          You need an account to generate images. Keep your login details
          private. You are responsible for activity on your account. New
          accounts receive a small number of free generations.
        </p>
      </section>
      <section>
        <h2>Your photos</h2>
        <p className="mt-3">
          You must have the right to upload every photo you send us. Do not
          upload someone else’s jewelry, a person’s photo, or any image you are
          not allowed to use. You keep ownership of your uploads. We use them
          only to run the service: generating the result, showing it in your
          gallery, and storing it for your account.
        </p>
      </section>
      <section>
        <h2>Generated images</h2>
        <p className="mt-3">
          Results are for the account holder’s business use, such as product
          listings and campaigns. AI output can miss details, change a piece, or
          look unlike the photo. Check every result before you publish it. We
          do not promise a particular look, likeness, or sales result.
        </p>
      </section>
      <section>
        <h2>Credits and payment</h2>
        <p className="mt-3">
          Paid plans are monthly subscriptions. Dodo Payments charges in US
          dollars each month. Credits are added
          after a successful payment. One generation
          uses credits as shown in the studio before you start it. Prices are
          listed on the{" "}
          <Link href="/pricing" className="text-primary underline">
            pricing page
          </Link>
          . Refunds follow the{" "}
          <Link href="/refund" className="text-primary underline">
            refund policy
          </Link>
          .
        </p>
      </section>
      <section>
        <h2>Acceptable use</h2>
        <ul>
          <li>No illegal content, fraud, or impersonation.</li>
          <li>No uploads you do not have rights to use.</li>
          <li>No attempts to break, overload, or bypass the service.</li>
        </ul>
        <p className="mt-3">
          We may suspend an account that breaks these terms. Unused paid credits
          on a suspended account are handled under the refund policy.
        </p>
      </section>
      <section>
        <h2>Availability</h2>
        <p className="mt-3">
          The service depends on our hosting and on outside AI providers. It may
          be slow or unavailable. A failed generation that did not save a result
          should not spend your credits; if it does, write to us and we will
          restore them.
        </p>
      </section>
      <section>
        <h2>Law</h2>
        <p className="mt-3">
          These terms are governed by the laws of India. Questions go to{" "}
          <a
            href={`mailto:${sitePublic.supportEmail}`}
            className="text-primary underline"
          >
            {sitePublic.supportEmail}
          </a>
          .
        </p>
      </section>
    </LegalPage>
  );
}
