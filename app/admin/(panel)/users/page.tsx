import { CreateUserForm } from "@/components/admin/create-user-form";
import { UserRowActions } from "@/components/admin/user-row-actions";
import { isSuperAdminEmail } from "@/lib/admin";
import { listAdminUsers } from "@/lib/admin-data";
import { normalizePlanId, PLAN_LABELS } from "@/lib/entitlements";

export default async function AdminUsersPage() {
  const users = await listAdminUsers(500);

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Users</h1>
          <p className="mt-1 text-sm text-foreground/70">
            {users.length} accounts · create, edit, delete
          </p>
        </div>
        <CreateUserForm />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-primary/20 bg-secondary shadow-sm">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="border-b border-primary/15 bg-background/40 text-xs uppercase tracking-wide text-foreground/55">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Credits</th>
              <th className="px-4 py-3">Gens</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/10">
            {users.map((u) => {
              const plan = normalizePlanId(u.plan);
              const superAdmin = isSuperAdminEmail(u.email);
              return (
                <tr key={u.id} className="align-top text-foreground/90">
                  <td className="px-4 py-3 font-medium">
                    {u.email}
                    {superAdmin ? (
                      <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Super admin
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">{PLAN_LABELS[plan]}</td>
                  <td className="px-4 py-3">{u.credits}</td>
                  <td className="px-4 py-3">{u._count.generations}</td>
                  <td className="px-4 py-3 text-foreground/55">
                    {u.createdAt.toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-4 py-3">
                    <UserRowActions
                      userId={u.id}
                      email={u.email}
                      phone={u.phone}
                      credits={u.credits}
                      plan={plan}
                      isSuperAdmin={superAdmin}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
