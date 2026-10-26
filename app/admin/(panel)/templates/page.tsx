import { AdminTemplatesManager } from "@/components/admin/admin-templates-manager";

export default function AdminTemplatesPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Model templates</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/70">
        Paid users pick one of these models in the studio, and the same model is generated wearing their jewelry.
      </p>
      <div className="mt-8">
        <AdminTemplatesManager />
      </div>
    </div>
  );
}
