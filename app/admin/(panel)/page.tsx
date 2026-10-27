import { getAdminStats, listActiveUsers } from "@/lib/admin-data";
import { PLAN_LABELS, normalizePlanId } from "@/lib/entitlements";

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-primary/20 bg-secondary p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/55">
        {label}
      </p>
      <p className="mt-2 text-3xl font-light text-foreground">{value}</p>
      {sub ? <p className="mt-1 text-xs text-foreground/55">{sub}</p> : null}
    </div>
  );
}

function formatWhen(value: Date | null): string {
  if (!value) return "—";
  return value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
}

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([
    getAdminStats(),
    listActiveUsers(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
      <p className="mt-1 text-sm text-foreground/70">Jwelpixel overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Active now"
          value={activity.activeNow}
          sub="Opened the app in the last 15 minutes"
        />
        <StatCard label="Users" value={stats.userCount} />
        <StatCard label="Total generations" value={stats.generationCount} />
        <StatCard
          label="Generations today"
          value={stats.generationsToday}
          sub="All accounts, since midnight India time"
        />
        <StatCard label="Paid orders" value={stats.paidPayments} />
        <StatCard
          label="Revenue"
          value={`₹${(stats.revenuePaise / 100).toFixed(0)}`}
          sub="Successful Razorpay payments"
        />
        <StatCard
          label="Credits in circulation"
          value={stats.creditsInCirculation}
          sub="Sum of all user balances"
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-foreground">
        Recent accounts
      </h2>
      <p className="mt-1 text-sm text-foreground/70">
        Active means the account loaded the app in the last 15 minutes. Last
        active updates while they stay signed in. Last login updates when they
        sign in again.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-primary/20 bg-secondary shadow-sm">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase tracking-wide text-foreground/55">
            <tr>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Account</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Last login</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {activity.recent.length === 0 ? (
              <tr>
                <td className="px-4 py-3 text-foreground/55" colSpan={6}>
                  No one has opened the app since this was turned on. The list
                  fills as people use the site.
                </td>
              </tr>
            ) : (
              activity.recent.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        user.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-background text-foreground/55"
                      }`}
                    >
                      {user.active ? "Active" : "Away"}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{user.email}</td>
                  <td className="px-4 py-3">{user.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    {PLAN_LABELS[normalizePlanId(user.plan)]}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {formatWhen(user.lastSeenAt)}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">
                    {formatWhen(user.lastLoginAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
