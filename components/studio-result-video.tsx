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
 * Never flash the jewelry upload / first still frame. Keep the JP loader up
 * until the video is actually playing (or the user taps Play).
 */
export function StudioResultVideo({
  src,
  className,
  fillClassName,
  label = "Starting your video…",
}: StudioResultVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  useEffect(() => {
    setPlaying(false);
    setNeedsTap(false);
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.load();
  }, [src]);

  function skipStillHead(el: HTMLVideoElement) {
    if (!Number.isFinite(el.duration) || el.duration <= 0.5) return;
    const target = Math.min(0.85, Math.max(0.4, el.duration * 0.12));
    try {
      el.currentTime = target;
    } catch {
      /* seek can fail before full buffer */
    }
  }

  async function startPlayback() {
    const el = videoRef.current;
    if (!el) return;
    skipStillHead(el);
    try {
      el.muted = true;
      await el.play();
      setPlaying(true);
      setNeedsTap(false);
    } catch {
      setNeedsTap(true);
      setPlaying(false);
    }
  }

  return (
    <div className={fillClassName ?? "relative h-full w-full"}>
      {!playing ? (
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
        controls={playing}
        playsInline
        autoPlay
        muted
        preload="auto"
        // Transparent poster so the browser never paints the jewelry still underneath.
        poster="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        onLoadedData={(e) => {
          skipStillHead(e.currentTarget);
        }}
        onCanPlay={() => {
          if (!playing) void startPlayback();
        }}
        onPlaying={() => {
          setPlaying(true);
          setNeedsTap(false);
        }}
        onPause={(e) => {
          // Ignore the brief pause that can happen while seeking the still head.
          if (e.currentTarget.currentTime < 0.2) return;
        }}
        onEnded={() => {
          setPlaying(false);
          setNeedsTap(true);
        }}
        className={`${className ?? "h-full w-full object-contain"} ${
          playing
            ? "relative z-[1] opacity-100"
            : "pointer-events-none absolute inset-0 opacity-0"
        }`}
      />
    </div>
  );
}
