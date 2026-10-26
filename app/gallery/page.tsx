import { GalleryGrid } from "@/components/gallery-grid";
import { MobileStudioNav } from "@/components/mobile-studio-nav";
import { getSessionUser } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Gallery — Jwelpixel",
};

export default async function GalleryPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-4 py-6 pb-10 sm:px-6 lg:px-6 lg:py-16 lg:pb-16">
        <Link href="/" className="hidden text-sm font-medium text-primary hover:text-accent lg:inline">
          ← Studio
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal text-foreground lg:mt-6">
          Your gallery
        </h1>
        <p className="mt-2 text-foreground/70">Past model shots from your account.</p>
        <div className="mt-6 lg:mt-10">
          <GalleryGrid />
        </div>
      </div>
      <div data-bottom-nav className="fixed inset-x-0 bottom-0 z-50 shadow-[0_-4px_16px_rgba(76,45,120,0.10)] lg:hidden">
        <MobileStudioNav />
      </div>
    </div>
  );
}
