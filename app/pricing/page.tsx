import { BuyCreditsButton } from "@/components/buy-credits-button";

import { getCreditPacks, isRazorpayConfigured } from "@/lib/razorpay";

import { getSessionUser } from "@/lib/session";

import Link from "next/link";



export const metadata = {

  title: "Pricing — Jewel Studio",

};



export default async function PricingPage({

  searchParams,

}: {

  searchParams: Promise<{ paid?: string }>;

}) {

  const sp = await searchParams;

  const paid = sp.paid === "1";

  const packs = getCreditPacks();

  const razorpayOn = isRazorpayConfigured();

  const user = await getSessionUser();



  return (

    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-stone-50 to-stone-100 px-6 py-16 text-stone-800">

      <div className="mx-auto max-w-3xl">

        <Link href="/" className="text-sm font-medium text-amber-800 hover:text-amber-900">

          ← Back to studio

        </Link>

        <h1 className="mt-8 text-4xl font-light text-stone-900">Pricing</h1>

        <p className="mt-3 text-lg text-stone-600">

          5 free generations when you sign up. Buy more credits anytime in INR.

        </p>



        {user ? (

          <p className="mt-4 text-sm text-stone-700">

            Signed in as <span className="font-medium">{user.email}</span> —{" "}

            <span className="font-medium">{user.credits}</span> credits left

          </p>

        ) : (

          <p className="mt-4 text-sm text-stone-600">

            <Link href="/login" className="font-medium text-amber-800 underline">

              Log in

            </Link>{" "}

            to buy credit packs.

          </p>

        )}



        {razorpayOn ? (

          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">

            Razorpay checkout is enabled. Use test keys in development (see RAZORPAY.md).

          </p>

        ) : null}



        {paid ? (

          <div className="mt-6 space-y-2">

            <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">

              Payment successful. Credits are added to your account.

            </p>

            <Link

              href="/#studio"

              className="inline-block text-sm font-medium text-amber-800 hover:text-amber-900"

            >

              Back to studio →

            </Link>

          </div>

        ) : null}



        <div className="mt-10 grid gap-6 sm:grid-cols-2">

          <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">

            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">

              Free

            </h2>

            <p className="mt-2 text-3xl font-light">₹0</p>

            <ul className="mt-4 space-y-2 text-sm text-stone-600">

              <li>5 generations per new account</li>

              <li>Email verification at signup</li>

              <li>1 credit per generation</li>

            </ul>

          </div>



          {packs.map((pack) => (

            <div

              key={pack.id}

              className="rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-white p-8 shadow-md ring-1 ring-amber-100"

            >

              <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-900">

                {pack.label}

              </h2>

              <p className="mt-2 text-3xl font-light">

                ₹{(pack.amountPaise / 100).toFixed(0)}

              </p>

              <p className="mt-1 text-sm text-stone-600">

                {pack.credits} generations · ₹

                {(pack.amountPaise / pack.credits / 100).toFixed(2)}/credit

              </p>

              {razorpayOn && user ? (

                <BuyCreditsButton packId={pack.id} />

              ) : razorpayOn ? (

                <Link

                  href="/login"

                  className="mt-6 block w-full rounded-xl border border-amber-300 py-3 text-center text-sm font-semibold text-amber-900 hover:bg-amber-50"

                >

                  Log in to buy

                </Link>

              ) : (

                <p className="mt-6 text-xs text-stone-500">

                  Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env — see RAZORPAY.md

                </p>

              )}

            </div>

          ))}

        </div>

      </div>

    </div>

  );

}


