"use client";

import { useEffect, useState } from "react";
import { estimatedGenerationPercent } from "@/lib/generation-progress";

export function GenerationPreviewPlaceholder({
  aspectClass,
  label,
  compact = false,
}: {
  aspectClass: string;
  label: string;
  compact?: boolean;
}) {
  const [elapsedSec, setElapsedSec] = useState(0);
  useEffect(() => {
    setElapsedSec(0);
    const id = window.setInterval(() => {
      setElapsedSec((n) => n + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [label]);

  const video = /video/i.test(label);
  const percent = estimatedGenerationPercent(elapsedSec, video);
  const progressLabel = `${percent}%`;

  return (
    <div
      className={`relative mx-auto w-full overflow-hidden border border-primary/30 shadow-lg ${
        compact ? "h-full rounded-none" : "rounded-2xl"
      } ${aspectClass}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={`${label} ${progressLabel}`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
    >
      <div className="absolute inset-0 gen-preview-base" />

      <div className="gen-preview-blob gen-preview-blob-a" aria-hidden />
      <div className="gen-preview-blob gen-preview-blob-b" aria-hidden />
      <div className="gen-preview-blob gen-preview-blob-c" aria-hidden />

      <div className="absolute inset-0 gen-preview-waves" aria-hidden />
      <div className="absolute inset-0 gen-preview-grid" aria-hidden />
      <div className="absolute inset-0 gen-preview-shimmer" aria-hidden />

      {!compact ? (
        <>
          <div className="gen-preview-spark gen-preview-spark-1" aria-hidden />
          <div className="gen-preview-spark gen-preview-spark-2" aria-hidden />
          <div className="gen-preview-spark gen-preview-spark-3" aria-hidden />
          <div className="gen-preview-spark gen-preview-spark-4" aria-hidden />
        </>
      ) : null}

      <div
        className={`absolute inset-0 flex flex-col items-center justify-center text-center ${
          compact ? "gap-1.5 px-3 pb-2" : "gap-2.5 px-5 pb-4 pt-2"
        }`}
      >
        <div
          className={`gen-preview-rings shrink-0 ${compact ? "scale-75" : ""}`}
          aria-hidden
        >
          <span />
          <span />
          <span />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/jwelpixel-emblem-v4.png"
            alt=""
            className={`gen-preview-logo ${compact ? "gen-preview-logo-compact" : ""}`}
          />
        </div>
        <p
          className={`relative z-10 shrink-0 font-semibold text-white drop-shadow-sm ${
            compact ? "text-[11px]" : "text-sm"
          }`}
        >
          {label}
        </p>
        <p
          className={`relative z-20 shrink-0 font-bold tabular-nums leading-none text-white drop-shadow-md ${
            compact ? "text-xl" : "text-4xl sm:text-3xl"
          }`}
        >
          {progressLabel}
        </p>
        <div
          className={`relative z-10 w-full shrink-0 ${
            compact ? "max-w-[7rem]" : "max-w-[14rem]"
          }`}
        >
          <div className="h-1.5 overflow-hidden rounded-full bg-white/25">
            <div
              className="h-full rounded-full bg-white transition-[width] duration-700 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          {!compact ? (
            <p className="mt-1.5 text-[11px] font-medium text-white/90">
              Painting light, metal & sparkle…
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
