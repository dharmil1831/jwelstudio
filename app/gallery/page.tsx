import { GalleryGrid } from "@/components/gallery-grid";
import Link from "next/link";

export const metadata = {
  title: "Gallery — Jewel Studio",
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-background px-6 py-16 text-foreground">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          ← Studio
        </Link>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-normal text-foreground">
          Your gallery
        </h1>
        <p className="mt-2 text-foreground/70">Past model shots from your account.</p>
        <div className="mt-10">
          <GalleryGrid />
        </div>
      </div>
    </div>
  );
}
