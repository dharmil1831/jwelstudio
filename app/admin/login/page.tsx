import { AdminLoginForm } from "@/components/admin/admin-login-form";
import { getAdminSessionUser } from "@/lib/admin";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Admin login — Jewel Studio",
};

export default async function AdminLoginPage() {
  const admin = await getAdminSessionUser();
  if (admin) redirect("/admin");

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Back home
        </Link>
        <h1 className="mt-8 font-[family-name:var(--font-display)] text-3xl font-normal text-foreground">
          Super admin
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          Sign in here only. This is separate from the customer studio login.
        </p>
        <div className="mt-8">
          <AdminLoginForm />
        </div>
      </div>
    </div>
  );
}
