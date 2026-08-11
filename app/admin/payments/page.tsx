import { listAdminPayments } from "@/lib/admin-data";

export default async function AdminPaymentsPage() {
  const payments = await listAdminPayments();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Payments</h1>
      <p className="mt-1 text-sm text-stone-600">Razorpay orders</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Order ID</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-500">
                  No payments yet
                </td>
              </tr>
            ) : (
              payments.map((p) => (
                <tr key={p.id} className="text-stone-800">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.user.email}</p>
                    <p className="text-xs text-stone-500">{p.user.phone ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3">₹{(p.amountPaise / 100).toFixed(0)}</td>
                  <td className="px-4 py-3">+{p.creditsAdded}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "paid"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-stone-500">
                    {p.razorpayOrderId}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
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
