"use client";

import { GenerationPreviewPlaceholder } from "@/components/generation-preview-placeholder";
import { useEffect, useRef, useState } from "react";

type StudioResultVideoProps = {
  src: string;
  className?: string;
  /** Wrapper classes when filling a fixed aspect slot (e.g. absolute inset-0). */
  fillClassName?: string;
  label?: string;
};

/**
 * Plays generated video as soon as it can — never flashes the jewelry upload
 * thumbnail while the file buffers.
 */
export function StudioResultVideo({
  src,
  className,
  fillClassName,
  label = "Starting your video…",
}: StudioResultVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const el = videoRef.current;
    if (!el) return;
    el.load();
  }, [src]);

  return (
    <div className={fillClassName ?? "relative h-full w-full"}>
      {!ready ? (
        <GenerationPreviewPlaceholder
          aspectClass="absolute inset-0 !mx-0 h-full w-full !rounded-none"
          label={label}
          compact
        />
      ) : null}
      <video
        ref={videoRef}
        key={src}
        src={src}
        controls
        playsInline
        autoPlay
        muted
        preload="auto"
        onLoadedData={(e) => {
          const el = e.currentTarget;
          // Skip the still source-image freeze many image-to-video models put first.
          if (Number.isFinite(el.duration) && el.duration > 0.35) {
            try {
              el.currentTime = Math.min(0.25, el.duration * 0.08);
            } catch {
              /* seek can fail before full buffer — ignore */
            }
          }
        }}
        onCanPlay={(e) => {
          setReady(true);
          void e.currentTarget.play().catch(() => {
            /* autoplay may be blocked; controls still work */
          });
        }}
        onPlaying={() => setReady(true)}
        className={`${className ?? "h-full w-full object-contain"} ${
          ready ? "relative z-[1] opacity-100" : "pointer-events-none absolute inset-0 opacity-0"
        }`}
      />
    </div>
  );
}
