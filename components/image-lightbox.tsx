"use client";

import { downloadImage, filenameFromUrl } from "@/lib/download-image";
import { useCallback, useEffect, useState } from "react";

type ImageLightboxProps = {
  url: string;
  alt: string;
  open: boolean;
  onClose: () => void;
  filename?: string;
};

export function ImageLightbox({
  url,
  alt,
  open,
  onClose,
  filename,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setZoom(1);
    setDownloadError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(z + 0.25, 3));
      if (e.key === "-") setZoom((z) => Math.max(z - 0.25, 1));
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, reset]);

  async function handleDownload() {
    setDownloading(true);
    setDownloadError(null);
    try {
      await downloadImage(url, filename ?? filenameFromUrl(url));
    } catch {
      setDownloadError("Download failed. Try again.");
    } finally {
      setDownloading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/90"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z - 0.25, 1))}
            disabled={zoom <= 1}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-40"
          >
            Zoom out
          </button>
          <span className="min-w-[3rem] text-center text-sm text-white/80">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z + 0.25, 3))}
            disabled={zoom >= 3}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20 disabled:opacity-40"
          >
            Zoom in
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-background hover:bg-accent hover:text-foreground disabled:opacity-50"
          >
            {downloading ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>

      {downloadError ? (
        <p className="px-4 text-center text-sm text-red-300">{downloadError}</p>
      ) : null}

      <button
        type="button"
        className="relative flex-1 overflow-auto p-4"
        onClick={onClose}
        aria-label="Close preview"
      >
        <div
          className="flex min-h-full min-w-full items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            style={{ transform: `scale(${zoom})` }}
            className="max-h-[calc(100vh-8rem)] max-w-full origin-center object-contain transition-transform duration-150"
            draggable={false}
          />
        </div>
      </button>
    </div>
  );
}
