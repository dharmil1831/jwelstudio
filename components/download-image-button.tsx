"use client";

import {
  downloadGenerationFile,
  downloadImage,
  exportExactSizeJpeg,
  filenameFromUrl,
} from "@/lib/download-image";
import { useState } from "react";

type DownloadImageButtonProps = {
  url: string;
  filename?: string;
  className?: string;
  label?: string;
  /** Saved gallery row. Downloaded through the app so phones can save the file. */
  generationId?: string;
  /** When set, download is resized to exact social pixel size for that format. */
  exportFormat?: import("@/lib/style-options").OutputFormat;
  /** Exact custom canvas. Wins over the preset export size. */
  exportPixels?: { width: number; height: number };
};

export function DownloadImageButton({
  url,
  filename,
  className,
  label = "Download",
  generationId,
  exportFormat,
  exportPixels,
}: DownloadImageButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const buttonClass =
    className ??
    "rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-background shadow hover:bg-primary disabled:opacity-50";

  if (generationId && !exportFormat && !exportPixels) {
    return (
      <a
        href={`/api/generations/${generationId}/file`}
        download={filename ?? `jwelpixel-${generationId}`}
        onClick={(e) => e.stopPropagation()}
        className={buttonClass}
      >
        {label}
      </a>
    );
  }

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      if (exportPixels) {
        const source = generationId
          ? `/api/generations/${encodeURIComponent(generationId)}/file`
          : url;
        const blob = await exportExactSizeJpeg(
          source,
          exportPixels.width,
          exportPixels.height,
        );
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        const base = (filename ?? `jwelpixel-${exportPixels.width}x${exportPixels.height}`).replace(
          /\.(png|jpe?g|webp)$/i,
          "",
        );
        anchor.download = `${base}.jpg`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      } else if (generationId) {
        await downloadGenerationFile(
          generationId,
          filename ?? `jwelpixel-${generationId}`,
        );
      } else {
        await downloadImage(
          url,
          filename ?? filenameFromUrl(url),
          exportFormat,
        );
      }
    } catch {
      window.alert("Could not download image. Please try again.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      type="button"
      disabled={downloading}
      onClick={(e) => void handleDownload(e)}
      className={buttonClass}
    >
      {downloading ? "…" : label}
    </button>
  );
}
