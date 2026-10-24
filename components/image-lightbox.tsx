"use client";

import { downloadImage, filenameFromUrl } from "@/lib/download-image";
import { useCallback, useEffect, useRef, useState } from "react";

type ImageLightboxProps = {
  url: string;
  alt: string;
  open: boolean;
  onClose: () => void;
  filename?: string;
  generationId?: string;
};

export function ImageLightbox({
  url,
  alt,
  open,
  onClose,
  filename,
  generationId,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const zoomRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });
  const stageRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const drag = useRef<{ x: number; y: number; panX: number; panY: number } | null>(
    null,
  );

  const reset = useCallback(() => {
    zoomRef.current = 1;
    panRef.current = { x: 0, y: 0 };
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setDownloadError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose, reset]);

  const applyZoom = useCallback((next: number) => {
    const clamped = Math.min(4, Math.max(1, next));
    zoomRef.current = clamped;
    setZoom(clamped);
    if (clamped <= 1) {
      panRef.current = { x: 0, y: 0 };
      setPan({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    const el = stageRef.current;
    if (!open || !el) return;

    let pinchStart: { distance: number; zoom: number } | null = null;
    let dragStart: { x: number; y: number; panX: number; panY: number } | null = null;
    let lastTap = 0;

    function touchDistance(touches: TouchList) {
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY,
      );
    }

    function onTouchStart(event: TouchEvent) {
      if (event.touches.length >= 2) {
        event.preventDefault();
        pinchStart = {
          distance: touchDistance(event.touches),
          zoom: zoomRef.current,
        };
        dragStart = null;
        return;
      }
      const now = Date.now();
      if (now - lastTap < 300) {
        event.preventDefault();
        applyZoom(zoomRef.current > 1 ? 1 : 2.5);
        lastTap = 0;
        dragStart = null;
        return;
      }
      lastTap = now;
      if (zoomRef.current > 1) {
        dragStart = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY,
          panX: panRef.current.x,
          panY: panRef.current.y,
        };
      }
    }

    function onTouchMove(event: TouchEvent) {
      if (event.touches.length >= 2 && pinchStart && pinchStart.distance > 0) {
        event.preventDefault();
        applyZoom(pinchStart.zoom * (touchDistance(event.touches) / pinchStart.distance));
        return;
      }
      if (event.touches.length === 1 && dragStart && zoomRef.current > 1) {
        event.preventDefault();
        panRef.current = {
          x: dragStart.panX + (event.touches[0].clientX - dragStart.x),
          y: dragStart.panY + (event.touches[0].clientY - dragStart.y),
        };
        setPan({ ...panRef.current });
      }
    }

    function onTouchEnd(event: TouchEvent) {
      if (event.touches.length < 2) pinchStart = null;
      if (event.touches.length === 0) dragStart = null;
    }

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd);
    el.addEventListener("touchcancel", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [open, applyZoom]);

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

  const fileHref = generationId ? `/api/generations/${generationId}/file` : null;

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-black/95 pt-[env(safe-area-inset-top)]"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
    >
      <div className="flex shrink-0 items-center justify-end gap-2 bg-black px-3 py-2 text-white">
        {fileHref ? (
          <a
            href={fileHref}
            download={filename ?? `jwelpixel-${generationId}`}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-background"
          >
            Download
          </a>
        ) : (
          <button
            type="button"
            disabled={downloading}
            onClick={() => void handleDownload()}
            className="cursor-pointer rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-background hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {downloading ? "Downloading…" : "Download"}
          </button>
        )}
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg bg-white/10 px-3 py-1.5 text-sm hover:bg-white/20"
          aria-label="Close"
        >
          Close
        </button>
      </div>

      {downloadError ? (
        <p className="px-4 text-center text-sm text-red-300">{downloadError}</p>
      ) : null}

      <div
        ref={stageRef}
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => {
          if (e.pointerType !== "mouse") return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (zoomRef.current > 1) {
            drag.current = {
              x: e.clientX,
              y: e.clientY,
              panX: panRef.current.x,
              panY: panRef.current.y,
            };
          }
        }}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || !pointers.current.has(e.pointerId)) return;
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
          if (drag.current && zoomRef.current > 1) {
            panRef.current = {
              x: drag.current.panX + (e.clientX - drag.current.x),
              y: drag.current.panY + (e.clientY - drag.current.y),
            };
            setPan(panRef.current);
          }
        }}
        onPointerUp={(e) => {
          if (e.pointerType !== "mouse") return;
          pointers.current.delete(e.pointerId);
          if (pointers.current.size === 0) drag.current = null;
        }}
        onPointerCancel={(e) => {
          pointers.current.delete(e.pointerId);
          drag.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={alt}
          draggable={false}
          className="max-h-full max-w-full object-contain select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            touchAction: "none",
          }}
        />
      </div>
    </div>
  );
}
