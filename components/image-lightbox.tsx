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

  const baseHeight = "calc(100vh - 8rem)";

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
            onClick={() => setZoom((z) => Math.max(Number((z - 0.25).toFixed(2)), 1))}
            disabled={zoom <= 1}
            aria-label="Zoom out"
            title="Zoom out"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-2xl font-light leading-none hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[3.5rem] text-center text-sm text-white/80">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(Number((z + 0.25).toFixed(2)), 3))}
            disabled={zoom >= 3}
            aria-label="Zoom in"
            title="Zoom in"
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-white/10 text-2xl font-light leading-none hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-background hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Downloading…" : "Download"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
            aria-label="Close"
          >
            Close
          </button>
        </div>
      </div>

      {downloadError ? (
        <p className="px-4 text-center text-sm text-red-300">{downloadError}</p>
      ) : null}

      <div
        className="relative flex-1 overflow-auto"
        onClick={onClose}
        role="presentation"
      >
        <div
          className="flex items-center justify-center p-4"
          style={{
            minWidth: "100%",
            minHeight: "100%",
            width: zoom > 1 ? `${zoom * 100}%` : "100%",
            height: zoom > 1 ? `${zoom * 100}%` : "100%",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={url}
            alt={alt}
            draggable={false}
            className="object-contain select-none"
            style={{
              height: zoom === 1 ? baseHeight : `calc((100vh - 8rem) * ${zoom})`,
              width: "auto",
              maxWidth: zoom === 1 ? "min(100%, 90vw)" : "none",
              maxHeight: zoom === 1 ? baseHeight : "none",
            }}
          />
        </div>
      </div>
    </div>
  );
}
