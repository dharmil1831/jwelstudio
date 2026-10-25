"use client";

import { useEffect, useRef } from "react";

type StudioResultVideoProps = {
  src: string;
  className?: string;
  fillClassName?: string;
  /** Kept for call-site compatibility; unused — video starts directly. */
  label?: string;
  onDuration?: (seconds: number) => void;
  onEnded?: () => void;
  onTime?: (seconds: number) => void;
};

/**
 * After generation: show and play the video immediately.
 * No JP cover, no upload thumbnail / poster frame.
 */
export function StudioResultVideo({
  src,
  className,
  fillClassName,
  onDuration,
  onEnded,
  onTime,
}: StudioResultVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.playsInline = true;
    void el.play().catch(() => {
      /* autoplay blocked — native controls still work */
    });
  }, [src]);

  return (
    <div className={fillClassName ?? "relative h-full w-full"}>
      <video
        ref={videoRef}
        key={src}
        src={src}
        controls
        playsInline
        autoPlay
        muted
        preload="auto"
        // Transparent poster — never paint the jewelry still as a thumbnail.
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        onLoadedMetadata={(e) => {
          const seconds = e.currentTarget.duration;
          if (Number.isFinite(seconds) && seconds > 0) onDuration?.(seconds);
        }}
        onLoadedData={(e) => {
          void e.currentTarget.play().catch(() => undefined);
        }}
        onTimeUpdate={(e) => onTime?.(e.currentTarget.currentTime)}
        onEnded={() => onEnded?.()}
        onCanPlay={(e) => {
          void e.currentTarget.play().catch(() => undefined);
        }}
        className={
          className ?? "h-full w-full bg-[#1a1224] object-contain"
        }
      />
    </div>
  );
}
