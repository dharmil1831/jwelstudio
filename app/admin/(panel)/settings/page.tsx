import { AdminSettingsForm } from "@/components/admin/admin-settings-form";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
      <p className="mt-1 text-sm text-foreground/70">
        Tutorial video, feature flags, and launch controls
      </p>
      <div className="mt-8">
        <AdminSettingsForm />
      </div>
    </div>
  );
}
