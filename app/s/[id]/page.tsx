import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const row = await prisma.generation.findFirst({
    where: { id, shareEnabled: true, status: "succeeded" },
    select: { resultUrl: true, mode: true },
  });
  if (!row) return { title: "Shared image — Jewel Studio" };
  const title =
    row.mode === "background"
      ? "Jewelry background — Jewel Studio"
      : "Jewelry model shot — Jewel Studio";
  return {
    title,
    openGraph: {
      title,
      images: [{ url: row.resultUrl }],
    },
  };
}

export default async function SharedGenerationPage({ params }: Props) {
  const { id } = await params;
  const row = await prisma.generation.findFirst({
    where: { id, shareEnabled: true, status: "succeeded" },
    select: {
      id: true,
      resultUrl: true,
      mode: true,
      format: true,
      createdAt: true,
    },
  });

  if (!row) notFound();

  const alt =
    row.mode === "background" ? "Shared jewelry background" : "Shared jewelry model shot";

  return (
    <div className="min-h-screen bg-background px-6 py-12 text-foreground">
      <div className="mx-auto flex max-w-lg flex-col items-center gap-6">
        <Link href="/" className="text-sm font-medium text-primary hover:text-accent">
          Jewel Studio
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-normal">
          Shared creation
        </h1>
        <div className="w-full overflow-hidden rounded-2xl border border-primary/20 bg-secondary shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.resultUrl}
            alt={alt}
            className="h-auto w-full object-contain bg-background/50"
          />
        </div>
        <p className="text-center text-sm text-foreground/60">
          Made with Jewel Studio ·{" "}
          {row.createdAt.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a
            href={row.resultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-primary/25 bg-secondary px-4 py-2 text-sm font-medium hover:bg-accent/30"
          >
            Open image
          </a>
          <Link
            href="/#studio"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-background hover:bg-accent hover:text-foreground"
          >
            Create your own
          </Link>
        </div>
      </div>
    </div>
  );
}
