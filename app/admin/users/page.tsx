import { CreditsEditor } from "@/components/admin/credits-editor";
import { listAdminUsers } from "@/lib/admin-data";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-900">Users</h1>
      <p className="mt-1 text-sm text-stone-600">{users.length} accounts</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-stone-100 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Gens</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id} className="text-stone-800">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <CreditsEditor userId={u.id} currentCredits={u.credits} />
                </td>
                <td className="px-4 py-3">{u._count.generations}</td>
                <td className="px-4 py-3 text-stone-500">
                  {u.createdAt.toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
