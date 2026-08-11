import { getAdminStats } from "@/lib/admin-data";

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
    <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-light text-stone-900">{value}</p>
      {sub ? <p className="mt-1 text-xs text-stone-500">{sub}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Dashboard</h1>
      <p className="mt-1 text-sm text-stone-600">Jewel Studio overview</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Users" value={stats.userCount} />
        <StatCard label="Total generations" value={stats.generationCount} />
        <StatCard
          label="Generations today"
          value={stats.generationsToday}
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
    </div>
  );
}
