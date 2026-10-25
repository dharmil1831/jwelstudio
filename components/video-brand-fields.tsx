"use client";

import { StudioResultVideo } from "@/components/studio-result-video";
import { useEffect, useState } from "react";

type VideoBrandFieldsProps = {
  name: string;
  onName: (value: string) => void;
  logoSrc: string | null;
  onLogoFile: (file: File | null) => void;
  endCard: boolean;
  onEndCard: (value: boolean) => void;
};

export function VideoBrandFields({
  name,
  onName,
  logoSrc,
  onLogoFile,
  endCard,
  onEndCard,
}: VideoBrandFieldsProps) {
  return (
    <div className="flex flex-col gap-2 rounded-xl bg-secondary/50 p-3 ring-1 ring-primary/20">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Shop on the video</p>
      <input
        value={name}
        maxLength={40}
        onChange={(e) => onName(e.target.value)}
        placeholder="Shop name"
        className="w-full rounded-lg bg-background px-3 py-2 text-sm outline-none ring-1 ring-primary/20"
      />
      <label className="flex items-center gap-3 rounded-lg bg-background px-3 py-2 text-sm ring-1 ring-primary/20">
        {logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoSrc} alt="" className="h-10 w-10 rounded-md object-contain" />
        ) : null}
        <span className="font-semibold text-foreground/80">
          {logoSrc ? "Logo added. Tap to replace." : "Add logo"}
        </span>
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            onLogoFile(e.target.files?.[0] ?? null);
            e.target.value = "";
          }}
        />
      </label>
      {logoSrc ? (
        <button
          type="button"
          onClick={() => onLogoFile(null)}
          className="self-start text-xs font-semibold text-primary underline"
        >
          Remove logo
        </button>
      ) : null}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onEndCard(false)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            endCard ? "bg-background text-foreground/70 ring-1 ring-primary/15" : "bg-primary text-white"
          }`}
        >
          End card off
        </button>
        <button
          type="button"
          onClick={() => onEndCard(true)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            endCard ? "bg-primary text-white" : "bg-background text-foreground/70 ring-1 ring-primary/15"
          }`}
        >
          3 second end card
        </button>
      </div>
      <p className="text-[11px] leading-relaxed text-foreground/55">
        The name and logo fade in at the corner and stay. The end card plays after the jewelry clip. No extra credits.
      </p>
    </div>
  );
}

type BrandedVideoStageProps = {
  src: string;
  name: string;
  logoSrc: string | null;
  endCard: boolean;
  /** Paint the mark on the player when it is not already in the file. */
  live: boolean;
  onDuration?: (seconds: number) => void;
};

export function BrandedVideoStage({
  src,
  name,
  logoSrc,
  endCard,
  live,
  onDuration,
}: BrandedVideoStageProps) {
  const [card, setCard] = useState(false);
  const show = live && Boolean(name.trim() || logoSrc);

  useEffect(() => {
    setCard(false);
  }, [src]);

  useEffect(() => {
    if (!card) return;
    const timer = window.setTimeout(() => setCard(false), 3000);
    return () => window.clearTimeout(timer);
  }, [card]);

  return (
    <div className="absolute inset-0">
      <style>{`
        @keyframes jwel-brand-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes jwel-card-logo { from { opacity: 0; transform: scale(0.82); } to { opacity: 1; transform: scale(1); } }
        @keyframes jwel-card-name { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
      `}</style>
      <StudioResultVideo
        src={src}
        fillClassName="absolute inset-0"
        className="h-full w-full bg-[#1a1224] object-contain"
        onDuration={onDuration}
        onEnded={() => {
          if (show && endCard) setCard(true);
        }}
      />
      {show && !card ? (
        <div
          className="pointer-events-none absolute bottom-3 right-3 flex max-w-[70%] items-center gap-2 rounded-xl bg-[#1a1224]/70 px-2.5 py-1.5"
          style={{ animation: "jwel-brand-in 1s ease forwards" }}
        >
          {name.trim() ? (
            <span className="truncate text-xs font-semibold text-[#f6f1e8]">{name.trim()}</span>
          ) : null}
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoSrc} alt="" className="h-8 w-8 object-contain" />
          ) : null}
        </div>
      ) : null}
      {show && card ? (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#2a1f33]">
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoSrc}
              alt=""
              className="h-24 w-24 object-contain"
              style={{ animation: "jwel-card-logo 0.75s ease forwards" }}
            />
          ) : null}
          {name.trim() ? (
            <p
              className="px-6 text-center text-lg font-semibold text-[#f6f1e8]"
              style={{ animation: "jwel-card-name 0.7s ease 0.45s both" }}
            >
              {name.trim()}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
