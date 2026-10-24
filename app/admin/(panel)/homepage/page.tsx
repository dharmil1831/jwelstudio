import { AdminHomepageForm } from "@/components/admin/admin-homepage-form";

export default function AdminHomepagePage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-foreground">Homepage photos</h1>
      <p className="mt-1 max-w-2xl text-sm text-foreground/70">
        Choose the sample photos on the signed-out home page: the sliding hero, the before and after, the three steps, and the gallery.
      </p>
      <div className="mt-8">
        <AdminHomepageForm />
      </div>
    </div>
  );
}
