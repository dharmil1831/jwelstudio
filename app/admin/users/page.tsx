import { CreditsEditor } from "@/components/admin/credits-editor";
import { listAdminUsers } from "@/lib/admin-data";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Users</h1>
      <p className="mt-1 text-sm text-foreground/70">{users.length} accounts</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-primary/20 bg-secondary shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase tracking-wide text-foreground/55">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Gens</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {users.map((u) => (
              <tr key={u.id} className="text-foreground/90">
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">{u.phone ?? "—"}</td>
                <td className="px-4 py-3">
                  <CreditsEditor userId={u.id} currentCredits={u.credits} />
                </td>
                <td className="px-4 py-3">{u._count.generations}</td>
                <td className="px-4 py-3 text-foreground/55">
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
