import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileActions } from "@/components/profile-actions";

export const metadata = {
  title: "Profile — Jewel Studio",
};

export default async function ProfilePage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/80 via-stone-50 to-stone-100 px-6 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="text-3xl font-light text-stone-900">Your profile</h1>
        <p className="mt-2 text-stone-600">Account details and credits.</p>

        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-lg font-semibold text-white">
              {(user.email.split("@")[0] ?? user.email).slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-medium text-stone-900">{user.email}</p>
              <p className="text-sm text-stone-500">{user.phone ?? "—"}</p>
            </div>
          </div>

          <dl className="mt-8 space-y-4 border-t border-stone-100 pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Email</dt>
              <dd className="text-right font-medium text-stone-900">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Phone</dt>
              <dd className="text-right font-medium text-stone-900">
                {user.phone ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-stone-500">Credits</dt>
              <dd className="text-right font-medium text-stone-900">{user.credits}</dd>
            </div>
          </dl>

          <p className="mt-6 text-xs text-stone-500">
            You signed up with email and password. Phone is optional. Contact support to
            change account details.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/#studio"
              className="flex-1 rounded-xl bg-amber-600 py-3 text-center text-sm font-semibold text-white hover:bg-amber-700"
            >
              Open studio
            </Link>
            <Link
              href="/gallery"
              className="flex-1 rounded-xl border border-stone-200 py-3 text-center text-sm font-semibold text-stone-800 hover:bg-stone-50"
            >
              Gallery
            </Link>
            {user.credits === 0 ? (
              <Link
                href="/pricing"
                className="flex-1 rounded-xl border border-amber-300 bg-amber-50 py-3 text-center text-sm font-semibold text-amber-900 hover:bg-amber-100"
              >
                Buy credits
              </Link>
            ) : null}
          </div>

          <ProfileActions />
        </div>
      </div>
    </div>
  );
}
