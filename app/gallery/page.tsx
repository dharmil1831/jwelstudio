import { GalleryGrid } from "@/components/gallery-grid";
import Link from "next/link";

export const metadata = {
  title: "Gallery — Jewel Studio",
};

export default function GalleryPage() {
  return (
    <div className="min-h-screen bg-stone-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-amber-800">
          ← Studio
        </Link>
        <h1 className="mt-6 text-3xl font-light text-stone-900">Your gallery</h1>
        <p className="mt-2 text-stone-600">Past model shots from your account.</p>
        <div className="mt-10">
          <GalleryGrid />
        </div>
      </div>
    </div>
  );
}
