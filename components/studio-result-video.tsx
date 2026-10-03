"use client";

import { GenerationPreviewPlaceholder } from "@/components/generation-preview-placeholder";
import { useEffect, useRef, useState } from "react";

type StudioResultVideoProps = {
  src: string;
  className?: string;
  fillClassName?: string;
  label?: string;
};

/** Seconds of playback kept under the cover so the jewelry still-head never flashes. */
const STILL_COVER_S = 0.65;
const REVEAL_FALLBACK_MS = 2800;

/**
 * Plays under an opaque JP cover, then reveals only after the still head is past.
 * Never shows the upload thumbnail as a poster.
 */
export function StudioResultVideo({
  src,
  className,
  fillClassName,
  label = "Opening your video…",
}: StudioResultVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    setRevealed(false);
    setNeedsTap(false);
    startedRef.current = false;
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.load();

    const fallback = window.setTimeout(() => {
      // Don't leave people stuck on the cover if autoplay/buffer stalls.
      if (!startedRef.current) setNeedsTap(true);
      else setRevealed(true);
    }, REVEAL_FALLBACK_MS);

    return () => window.clearTimeout(fallback);
  }, [src]);

  async function startPlayback() {
    const el = videoRef.current;
    if (!el) return;
    try {
      el.muted = true;
      el.playsInline = true;
      await el.play();
      startedRef.current = true;
      setNeedsTap(false);
    } catch {
      setNeedsTap(true);
    }
  }

  function maybeReveal(el: HTMLVideoElement) {
    if (revealed) return;
    if (el.currentTime >= STILL_COVER_S) {
      setRevealed(true);
      setNeedsTap(false);
    }
  }

  return (
    <div className={fillClassName ?? "relative h-full w-full"}>
      {!revealed ? (
        <div className="absolute inset-0 z-[2]">
          <GenerationPreviewPlaceholder
            aspectClass="absolute inset-0 !mx-0 h-full w-full !rounded-none"
            label={needsTap ? "Tap to play video" : label}
            compact
          />
          {needsTap ? (
            <button
              type="button"
              onClick={() => void startPlayback()}
              className="absolute inset-0 z-[3] grid place-items-center bg-transparent"
              aria-label="Play video"
            >
              <span className="grid h-14 w-14 place-items-center rounded-full bg-white/95 text-primary shadow-lg">
                <svg viewBox="0 0 24 24" className="ml-0.5 h-7 w-7" aria-hidden>
                  <path fill="currentColor" d="M8 5v14l11-7z" />
                </svg>
              </span>
            </button>
          ) : null}
        </div>
      ) : null}

      <video
        ref={videoRef}
        key={src}
        src={src}
        controls={revealed}
        playsInline
        autoPlay
        muted
        preload="auto"
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        onLoadedData={() => {
          if (!startedRef.current) void startPlayback();
        }}
        onCanPlay={() => {
          if (!startedRef.current) void startPlayback();
        }}
        onPlaying={() => {
          startedRef.current = true;
          setNeedsTap(false);
          const el = videoRef.current;
          if (el) maybeReveal(el);
        }}
        onTimeUpdate={(e) => maybeReveal(e.currentTarget)}
        onEnded={() => {
          setNeedsTap(true);
          setRevealed(false);
          startedRef.current = false;
        }}
        className={`${className ?? "h-full w-full object-contain"} ${
          revealed
            ? "relative z-[1] bg-[#1a1224] opacity-100"
            : "pointer-events-none absolute inset-0 bg-[#1a1224] opacity-0"
        }`}
      />
    </div>
  );
}
