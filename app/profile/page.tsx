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
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-lg">
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal text-foreground">
          Your profile
        </h1>
        <p className="mt-2 text-foreground/70">Account details and credits.</p>

        <div className="mt-8 rounded-2xl border border-primary/20 bg-secondary p-8 shadow-sm">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-lg font-semibold text-background">
              {(user.email.split("@")[0] ?? user.email).slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="font-medium text-foreground">{user.email}</p>
              <p className="text-sm text-foreground/55">{user.phone ?? "—"}</p>
            </div>
          </div>

          <dl className="mt-8 space-y-4 border-t border-primary/15 pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/55">Email</dt>
              <dd className="text-right font-medium text-foreground">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/55">Phone</dt>
              <dd className="text-right font-medium text-foreground">
                {user.phone ?? "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-foreground/55">Credits</dt>
              <dd className="text-right font-medium text-foreground">{user.credits}</dd>
            </div>
          </dl>

          <p className="mt-6 text-xs text-foreground/55">
            You signed up with email and password. Phone is optional. Contact support to
            change account details.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Link
              href="/#studio"
              className="flex-1 rounded-xl bg-primary py-3 text-center text-sm font-semibold text-background hover:bg-accent hover:text-foreground"
            >
              Open studio
            </Link>
            <Link
              href="/gallery"
              className="flex-1 rounded-xl border border-primary/25 py-3 text-center text-sm font-semibold text-foreground hover:bg-accent/30"
            >
              Gallery
            </Link>
            {user.credits === 0 ? (
              <Link
                href="/pricing"
                className="flex-1 rounded-xl border border-primary/40 bg-primary/15 py-3 text-center text-sm font-semibold text-primary hover:bg-primary/25"
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
