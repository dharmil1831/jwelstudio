"use client";

/** Animated preview slot while image/video generates — moving plum canvas, not a flat white box. */
export function GenerationPreviewPlaceholder({
  aspectClass,
  label,
}: {
  aspectClass: string;
  label: string;
}) {
  return (
    <div
      className={`relative mx-auto w-full overflow-hidden rounded-2xl border border-primary/30 shadow-lg ${aspectClass}`}
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

      <div className="gen-preview-spark gen-preview-spark-1" aria-hidden />
      <div className="gen-preview-spark gen-preview-spark-2" aria-hidden />
      <div className="gen-preview-spark gen-preview-spark-3" aria-hidden />
      <div className="gen-preview-spark gen-preview-spark-4" aria-hidden />

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="gen-preview-rings" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <p className="relative z-10 text-sm font-semibold text-white drop-shadow-sm">
          {label}
        </p>
        <p className="relative z-10 text-xs text-white/75">
          Painting light, metal &amp; sparkle…
        </p>
      </div>
    </div>
  );
}
