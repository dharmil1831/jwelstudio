"use client";

import { useEffect, useState } from "react";

const STEPS = [
  {
    title: "Upload the jewelry",
    detail: "A signed-in account starts with a photo of the piece.",
  },
  {
    title: "Choose the look",
    detail: "On a model, bridal, square for WhatsApp and Instagram.",
  },
  {
    title: "Generate",
    detail: "One credit turns the photo into a catalog shot.",
  },
  {
    title: "Ready to use",
    detail: "Download or share the finished image.",
  },
] as const;

const STEP_MS = 2600;

/** Autoplaying walkthrough of the signed-in image journey. */
export function AppJourneyDemo() {
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % STEPS.length);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  const current = STEPS[step];

  return (
    <div className="overflow-hidden rounded-2xl border border-primary/20 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-primary/10 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">App tutorial</p>
          <p className="text-xs text-foreground/55">From photo to catalog image</p>
        </div>
        <button
          type="button"
          aria-label="Replay tutorial"
          onClick={() => {
            setPaused(false);
            setStep(0);
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/25 text-primary"
        >
          <span aria-hidden className="text-base leading-none">
            ↻
          </span>
        </button>
      </div>

      <div
        className="bg-[#f6f1fb] px-4 py-5"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="mx-auto w-full max-w-[280px] overflow-hidden rounded-[28px] border border-primary/15 bg-white shadow-[0_12px_40px_rgba(76,45,120,0.12)]">
          <div className="flex items-center justify-between bg-primary px-3 py-2 text-white">
            <span className="text-xs font-semibold tracking-wide">Jwelpixel</span>
            <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">
              5 credits
            </span>
          </div>

          <div className="relative aspect-[4/5] bg-[#fbf8fd]">
            {step === 0 ? <UploadStep /> : null}
            {step === 1 ? <LookStep /> : null}
            {step === 2 ? <GenerateStep /> : null}
            {step === 3 ? <ReadyStep /> : null}
          </div>
        </div>

        <div className="mx-auto mt-4 flex max-w-[280px] justify-center gap-1.5">
          {STEPS.map((item, index) => (
            <button
              key={item.title}
              type="button"
              aria-label={item.title}
              onClick={() => setStep(index)}
              className={`h-1.5 rounded-full transition-all ${
                index === step ? "w-6 bg-primary" : "w-1.5 bg-primary/25"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-primary/10 px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {step + 1}. {current.title}
        </p>
        <p className="mt-0.5 text-xs leading-relaxed text-foreground/60">{current.detail}</p>
      </div>
    </div>
  );
}

function UploadStep() {
  return (
    <div className="flex h-full flex-col p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-foreground/45">
        Studio
      </p>
      <div className="mt-2 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-primary/35 bg-primary/5 px-4 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mobile-looks/product-gold.jpg"
          alt=""
          className="h-24 w-24 rounded-xl object-cover opacity-80"
        />
        <p className="mt-3 text-sm font-semibold text-foreground">Upload jewelry</p>
        <p className="mt-1 text-[11px] text-foreground/55">JPG or PNG of the piece</p>
      </div>
    </div>
  );
}

function LookStep() {
  return (
    <div className="flex h-full flex-col p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mobile-looks/product-gold.jpg"
        alt="Uploaded necklace"
        className="h-28 w-full rounded-xl object-cover"
      />
      <div className="mt-3 grid grid-cols-2 gap-2">
        <span className="rounded-full bg-primary px-2 py-1.5 text-center text-[11px] font-semibold text-white">
          On a model
        </span>
        <span className="rounded-full border border-primary/20 px-2 py-1.5 text-center text-[11px] font-medium text-foreground/70">
          Background
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mobile-looks/look-bridal.jpg"
          alt=""
          className="h-16 w-16 rounded-xl object-cover ring-2 ring-primary"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mobile-looks/look-glamour.jpg"
          alt=""
          className="h-16 w-16 rounded-xl object-cover opacity-70"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mobile-looks/look-outdoor.jpg"
          alt=""
          className="h-16 w-16 rounded-xl object-cover opacity-70"
        />
      </div>
      <p className="mt-auto pt-2 text-center text-[11px] font-medium text-primary">
        Bridal look selected
      </p>
    </div>
  );
}

function GenerateStep() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <span className="h-10 w-10 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="mt-4 text-sm font-semibold text-foreground">Generating…</p>
      <p className="mt-1 text-[11px] text-foreground/55">Wearing the necklace on the model</p>
      <span className="mt-5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-white">
        Generate · 1 credit
      </span>
    </div>
  );
}

function ReadyStep() {
  return (
    <div className="flex h-full flex-col p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mobile-looks/look-bridal.jpg"
        alt="Generated bridal portrait wearing the necklace"
        className="h-44 w-full rounded-xl object-cover"
      />
      <p className="mt-2 text-center text-[11px] font-semibold text-primary">Image ready</p>
      <div className="mt-auto grid grid-cols-2 gap-2">
        <span className="rounded-full bg-primary py-2 text-center text-[11px] font-semibold text-white">
          Download
        </span>
        <span className="rounded-full border border-primary/30 py-2 text-center text-[11px] font-semibold text-primary">
          Share
        </span>
      </div>
    </div>
  );
}
