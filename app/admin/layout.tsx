import { isAdminEmail } from "@/lib/admin";
import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin — Jewel Studio",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (!isAdminEmail(user.email)) redirect("/");

  return <AdminShell email={user.email}>{children}</AdminShell>;
}
