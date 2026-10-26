import { LegalPage } from "@/components/legal-page";
import { sitePublic } from "@/lib/site-public";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy — Jwelpixel",
};

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <section>
        <h2>Who we are</h2>
        <p className="mt-3">
          {sitePublic.name} is an AI jewelry image and video studio. This policy
          explains what we collect when you use the website or the Android app,
          and why.
        </p>
      </section>
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>Account details: email, phone number if you add one, and a scrambled password if you set one. We cannot read your password back.</li>
          <li>If you continue with Google: your Google account email and the fact that Google verified it. We do not get your Google password or contacts.</li>
          <li>Login codes sent by email or SMS, and the time they were used.</li>
          <li>Photos you upload, the style options you pick, and the images or videos we generate.</li>
          <li>Credit balance, plan, and payment records: order id, amount, and status. Card, UPI, and bank details are handled by Razorpay. We do not store them.</li>
          <li>A session cookie that keeps you signed in.</li>
        </ul>
      </section>
      <section>
        <h2>Why we use it</h2>
        <ul>
          <li>To create your account, sign you in (by code or Google), and send verification codes.</li>
          <li>To generate, store, and show your results.</li>
          <li>To take payment and add credits.</li>
          <li>To fix failures, prevent abuse, and answer support requests.</li>
        </ul>
      </section>
      <section>
        <h2>Who else sees it</h2>
        <p className="mt-3">
          Uploaded photos and generation instructions are sent to our AI
          providers (Google Gemini, and OpenAI when it is used as a fallback) so
          they can create the result. Payments go through Razorpay. Email codes
          go through our email provider, and SMS codes through our SMS provider.
          Files may be stored with our database and file host. These providers
          process data only to perform that work.
        </p>
        <p className="mt-3">
          We do not sell your photos, account, or payment data.
        </p>
      </section>
      <section>
        <h2>How long we keep it</h2>
        <p className="mt-3">
          Account data, uploads, and results stay while your account is open, so
          your gallery keeps working. Payment records are kept as needed for
          accounting and disputes. You can delete your account yourself from
          Profile → Delete account; this removes your account, uploads, results,
          and saved looks right away. You can also ask by emailing{" "}
          <a
            href={`mailto:${sitePublic.supportEmail}`}
            className="text-primary underline"
          >
            {sitePublic.supportEmail}
          </a>
          . Payment receipts stay with Razorpay where the law requires it. We
          keep a one-way fingerprint of your email or phone so free credits are
          not granted twice.
        </p>
      </section>
      <section>
        <h2>Your choices</h2>
        <p className="mt-3">
          You can update your email and phone from your profile, stop using the
          service, or ask for a copy or deletion of your account data. Write to
          the same address. We will respond to access and deletion requests.
        </p>
      </section>
    </LegalPage>
  );
}
