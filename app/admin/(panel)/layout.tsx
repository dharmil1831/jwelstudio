import { getAdminSessionUser } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { redirect } from "next/navigation";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminSessionUser();
  if (!admin) redirect("/admin/login");

  return <AdminShell email={admin.email}>{children}</AdminShell>;
}
