"use client";

import type { HomePlaceholderSelection } from "@/lib/home-placeholders";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

export const ONBOARDING_DONE_KEY = "jwelpixel-onboarding-v1";
export const OPEN_SIGN_IN_EVENT = "jewel-open-sign-in";

const subscribeNever = () => () => {};

function readOnboardingDone(): boolean {
  try {
    return window.localStorage.getItem(ONBOARDING_DONE_KEY) === "1";
  } catch {
    return false;
  }
}

type Slide = {
  title: string;
  body: string;
  before: string;
  after: string;
};

function slidesFor(images: HomePlaceholderSelection): Slide[] {
  return [
    {
      title: "Worn on a model, from one photo",
      body: "Upload a plain photo of your piece. We place the exact same jewelry on a model.",
      before: images.before,
      after: images.stepModel,
    },
    {
      title: "Clean catalog backgrounds",
      body: "White, black, or brand colors — ready for your website and marketplaces.",
      before: images.stepUpload,
      after: images.stepBackdrop,
    },
    {
      title: "Premium campaign looks",
      body: "Bridal, festive, editorial. Pick a look and keep every stone exactly as it is.",
      before: images.before,
      after: images.after,
    },
    {
      title: "Ready for Instagram & WhatsApp",
      body: "Right sizes for posts, stories, and catalogs. Your first 5 images are free.",
      before: images.stepUpload,
      after: images.stepDownload,
    },
  ];
}

function BeforeAfter({ before, after }: { before: string; after: string }) {
  return (
    <div className="grid min-h-0 flex-1 grid-rows-[2fr_3fr] gap-3">
      <figure className="relative min-h-0 overflow-hidden rounded-[22px] bg-white shadow-sm ring-1 ring-primary/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={before} alt="Before" className="h-full w-full object-cover" />
        <figcaption className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-foreground/70 shadow-sm">
          BEFORE
        </figcaption>
      </figure>
      <figure className="relative min-h-0 overflow-hidden rounded-[22px] bg-white shadow-md ring-2 ring-primary/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={after} alt="After" className="h-full w-full object-cover" />
        <figcaption className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-white shadow-sm">
          AFTER
        </figcaption>
      </figure>
    </div>
  );
}

/** First-run welcome + before/after tour for phones. Desktop keeps the marketing page. */
export function MobileOnboarding({
  images,
  onDone,
}: {
  images: HomePlaceholderSelection;
  onDone: (then?: "sign-in") => void;
}) {
  const slides = slidesFor(images);
  const [step, setStep] = useState<"welcome" | number>("welcome");

  if (step === "welcome") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-background px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] font-sans text-foreground lg:hidden">
        <div className="relative mx-auto mt-auto w-full max-w-sm pt-2">
          <div className="grid h-[42dvh] min-h-[220px] grid-cols-2 grid-rows-2 gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.hero[0] ?? images.after}
              alt=""
              className="row-span-2 h-full w-full rounded-[26px] object-cover shadow-md"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.hero[1] ?? images.stepModel}
              alt=""
              className="h-full w-full rounded-[26px] object-cover shadow-md"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={images.hero[2] ?? images.stepBackdrop}
              alt=""
              className="h-full w-full rounded-[26px] object-cover shadow-md"
            />
          </div>
        </div>

        <div className="mx-auto mb-auto mt-6 w-full max-w-sm text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/jwelpixel-emblem-v4.png"
            alt=""
            className="mx-auto h-12 w-12 object-contain"
          />
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-[34px] leading-[1.1] text-foreground">
            Welcome to Jwelpixel
          </h1>
          <p className="mx-auto mt-3 max-w-xs text-[15px] leading-relaxed text-foreground/65">
            Turn one phone photo of your jewelry into catalog and model shots — in seconds.
          </p>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="mt-7 w-full rounded-full bg-primary py-3.5 text-[16px] font-semibold text-white shadow-lg shadow-primary/30 transition active:scale-[0.99]"
          >
            Get Started
          </button>
          <p className="mt-5 text-sm text-foreground/65">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => onDone("sign-in")}
              className="font-semibold text-primary"
            >
              Sign in
            </button>
          </p>
          <p className="mt-6 text-xs text-foreground/45">
            <Link href="/privacy" className="hover:text-primary">
              Privacy Policy
            </Link>
            <span className="mx-2">·</span>
            <Link href="/terms" className="hover:text-primary">
              Terms of Service
            </Link>
          </p>
        </div>
      </div>
    );
  }

  const slide = slides[step];
  const last = step === slides.length - 1;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-background px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] font-sans text-foreground lg:hidden">
      <div className="flex h-10 items-center justify-end">
        <button
          type="button"
          onClick={() => onDone()}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-foreground/60"
        >
          Skip
        </button>
      </div>

      <div className="mx-auto w-full max-w-sm text-center">
        <h2 className="font-[family-name:var(--font-display)] text-[28px] leading-[1.15] text-foreground">
          {slide.title}
        </h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-foreground/65">
          {slide.body}
        </p>
      </div>

      <div className="mx-auto mt-5 flex min-h-0 w-full max-w-sm flex-1 flex-col">
        <BeforeAfter key={step} before={slide.before} after={slide.after} />
      </div>

      <div className="mx-auto mt-5 flex w-full max-w-sm items-center justify-center gap-2" aria-hidden>
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full transition-all ${
              i === step ? "w-6 bg-primary" : "w-2 bg-primary/25"
            }`}
          />
        ))}
      </div>

      <div className="mx-auto mt-5 grid w-full max-w-sm grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setStep(step === 0 ? "welcome" : step - 1)}
          className="h-12 rounded-full border border-primary/30 bg-white text-[15px] font-semibold text-primary"
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => (last ? onDone() : setStep(step + 1))}
          className="h-12 rounded-full bg-primary text-[15px] font-semibold text-white shadow-md shadow-primary/25"
        >
          {last ? "Start creating" : "Next"}
        </button>
      </div>
    </div>
  );
}

/**
 * Signed-out phone home: onboarding on first visit, then the studio in guest mode.
 * The studio itself is passed in so this stays a thin client wrapper.
 */
export function MobileGuestHome({
  images,
  children,
}: {
  images: HomePlaceholderSelection;
  children: React.ReactNode;
}) {
  const doneBefore = useSyncExternalStore(subscribeNever, readOnboardingDone, () => null);
  const [dismissed, setDismissed] = useState(false);
  const showOnboarding = doneBefore === null ? null : !doneBefore && !dismissed;

  function finish(then?: "sign-in") {
    try {
      window.localStorage.setItem(ONBOARDING_DONE_KEY, "1");
    } catch {
      /* private mode */
    }
    setDismissed(true);
    if (then === "sign-in") {
      window.setTimeout(() => window.dispatchEvent(new Event(OPEN_SIGN_IN_EVENT)), 0);
    }
  }

  return (
    <>
      {children}
      {showOnboarding === null ? (
        <div className="fixed inset-0 z-[60] bg-background lg:hidden" />
      ) : showOnboarding ? (
        <MobileOnboarding images={images} onDone={finish} />
      ) : null}
    </>
  );
}
