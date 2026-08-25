"use client";

import { DownloadImageButton } from "@/components/download-image-button";
import { ImageLightbox } from "@/components/image-lightbox";
import Link from "next/link";
import { useEffect, useState } from "react";

type GenerationItem = {
  id: string;
  resultUrl: string;
  mode?: string;
  format?: string;
  placement: string;
  subject: string;
  shot: string;
  scene: string;
  vibe: string;
  createdAt: string;
};

function generationCaption(item: GenerationItem): string {
  const mode = item.mode === "background" ? "background" : "model";
  const detail = item.mode === "background" ? item.shot : item.placement;
  return [mode, item.format, detail, item.vibe]
    .filter(Boolean)
    .join(" · ")
    .replace(/_/g, " ");
}

function generationAlt(item: GenerationItem): string {
  return item.mode === "background" ? "Background still" : "Model shot";
}

export function GalleryGrid() {
  const [items, setItems] = useState<GenerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<GenerationItem | null>(null);

  useEffect(() => {
    void fetch("/api/generations")
      .then(async (r) => {
        if (r.status === 401) {
          setError("login");
          return null;
        }
        const data = (await r.json()) as { items?: GenerationItem[]; error?: string };
        if (!r.ok) throw new Error(data.error ?? "Failed to load gallery");
        return data.items ?? [];
      })
      .then((rows) => {
        if (rows) setItems(rows);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-center text-sm text-foreground/55">Loading gallery…</p>;
  }

  if (error === "login") {
    return (
      <p className="text-center text-sm text-foreground/70">
        <Link href="/login" className="font-medium text-primary underline">
          Log in
        </Link>{" "}
        to see your past generations.
      </p>
    );
  }

  if (error) {
    return <p className="text-center text-sm text-red-400">{error}</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-center text-sm text-foreground/55">
        No generations yet. Create your first shot in the studio.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <figure
            key={item.id}
            className="group overflow-hidden rounded-xl border border-primary/20 bg-secondary shadow-sm"
          >
            <button
              type="button"
              onClick={() => setLightboxItem(item)}
              className="relative block w-full cursor-zoom-in"
              aria-label="View full size"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.resultUrl}
                alt={generationAlt(item)}
                className="aspect-[4/5] w-full object-cover transition group-hover:brightness-95"
              />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                <span className="rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-background">
                  Tap to zoom
                </span>
              </span>
            </button>
            <figcaption className="flex items-center justify-between gap-2 px-2 py-2">
              <span className="truncate text-[10px] uppercase tracking-wide text-foreground/55">
                {generationCaption(item)}
              </span>
              <DownloadImageButton
                url={item.resultUrl}
                filename={`jewel-studio-${item.id}.png`}
                label="Save"
                className="shrink-0 rounded-md bg-background/50 px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-accent/40"
              />
            </figcaption>
          </figure>
        ))}
      </div>

      <ImageLightbox
        url={lightboxItem?.resultUrl ?? ""}
        alt={lightboxItem ? generationAlt(lightboxItem) : "Generated image"}
        open={lightboxItem !== null}
        onClose={() => setLightboxItem(null)}
        filename={
          lightboxItem
            ? `jewel-studio-${lightboxItem.id}.png`
            : undefined
        }
      />
    </>
  );
}
