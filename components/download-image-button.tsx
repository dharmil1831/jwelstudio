"use client";

import { downloadImage, filenameFromUrl } from "@/lib/download-image";
import { useState } from "react";

type DownloadImageButtonProps = {
  url: string;
  filename?: string;
  className?: string;
  label?: string;
};

export function DownloadImageButton({
  url,
  filename,
  className,
  label = "Download",
}: DownloadImageButtonProps) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDownloading(true);
    try {
      await downloadImage(url, filename ?? filenameFromUrl(url));
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
      className={
        className ??
        "rounded-lg bg-primary/90 px-3 py-1.5 text-xs font-semibold text-background shadow hover:bg-primary disabled:opacity-50"
      }
    >
      {downloading ? "…" : label}
    </button>
  );
}
