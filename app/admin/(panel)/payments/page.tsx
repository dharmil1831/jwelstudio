import { listAdminPayments } from "@/lib/admin-data";

export default async function AdminPaymentsPage() {
  const payments = await listAdminPayments();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Payments</h1>
      <p className="mt-1 text-sm text-foreground/70">Razorpay orders</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-primary/20 bg-secondary shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase tracking-wide text-foreground/55">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-foreground/55">
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="text-foreground/90">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.user.email}</p>
                    <p className="text-xs text-foreground/55">{p.user.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">₹{(p.amountPaise / 100).toFixed(0)}</td>
                  <td className="px-4 py-3">+{p.creditsAdded}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-background/50 text-foreground/65"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-foreground/55">
                    {p.razorpayOrderId}
                  </td>
                  <td className="px-4 py-3 text-foreground/55">
                    {p.createdAt.toLocaleString("en-IN")}
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
