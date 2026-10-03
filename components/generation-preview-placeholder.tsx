"use client";

/** Animated preview slot while image/video generates — moving plum canvas, not a flat white box. */
export function GenerationPreviewPlaceholder({
  aspectClass,
  label,
  compact = false,
}: {
  aspectClass: string;
  label: string;
  /** Smaller chrome for batch grid tiles */
  compact?: boolean;
}) {
  return (
    <div
      className={`relative mx-auto w-full overflow-hidden border border-primary/30 shadow-lg ${
        compact ? "h-full rounded-none" : "rounded-2xl"
      } ${aspectClass}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
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
          compact ? "gap-1.5 px-3" : "gap-3 px-6"
        }`}
      >
        <div
          className={`gen-preview-rings ${compact ? "scale-75" : ""}`}
          aria-hidden
        >
          <span />
          <span />
          <span />
        </div>
        <p
          className={`relative z-10 font-semibold text-white drop-shadow-sm ${
            compact ? "text-[11px]" : "text-sm"
          }`}
        >
          {label}
        </p>
        {!compact ? (
          <p className="relative z-10 text-xs text-white/75">
            Painting light, metal &amp; sparkle…
          </p>
        ) : null}
      </div>
    </div>
  );
}
