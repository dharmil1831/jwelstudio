import type { HomePlaceholderSelection } from "@/lib/home-placeholders";
import Link from "next/link";

function marqueeSources(sources: string[]): string[] {
  const base = sources.length > 0 ? sources : [];
  const filled = [...base];
  while (filled.length > 0 && filled.length < 8) filled.push(...base);
  return [...filled, ...filled];
}

export function MarketingShowcase({ images }: { images: HomePlaceholderSelection }) {
  const strip = marqueeSources(images.hero);
  return (
    <div className="w-full min-w-0 bg-background text-foreground">
      <section className="pt-10 text-center sm:pt-16">
        <p className="px-4 text-[11px] font-semibold tracking-[0.18em] text-primary sm:tracking-[0.32em]">
          MODEL SHOTS & VIDEOS
        </p>
        <h1 className="mx-auto mt-5 max-w-4xl px-4 font-[family-name:var(--font-display)] text-[clamp(2rem,7vw,3.75rem)] leading-[1.08] font-normal text-balance text-foreground sm:px-6">
          Model shots and videos from one photo.
        </h1>
        <div className="mt-8 overflow-hidden sm:mt-10">
          <div className="flex w-max animate-marquee gap-3 sm:gap-4">
            {strip.map((src, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`${src}-${index}`}
                src={src}
                alt=""
                className="h-36 w-52 shrink-0 rounded-2xl object-cover sm:h-52 sm:w-72 lg:h-64 lg:w-80"
              />
            ))}
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-md px-4 text-sm leading-relaxed text-foreground/70 sm:px-6">
          Pick a look. Jwelpixel puts your jewelry on a model, or on a clean backdrop.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex rounded-full bg-primary px-8 py-3 text-sm font-semibold tracking-wide text-white hover:bg-primary/90"
        >
          Start creating
        </Link>
        <p className="mt-4 text-sm text-foreground/70">
          Your first 5 generations are free · no card needed
        </p>

        <div className="mx-auto mt-10 flex w-full max-w-5xl flex-col items-center gap-4 px-4 sm:mt-14 sm:px-6 lg:flex-row lg:justify-center lg:gap-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images.before}
            alt="Plain jewellery photo"
            className="h-44 w-full max-w-72 min-w-0 rounded-2xl object-cover shadow-sm ring-1 ring-primary/15 sm:h-52 lg:max-w-64"
          />
          <span aria-hidden className="text-2xl text-primary lg:hidden">
            ↓
          </span>
          <span aria-hidden className="hidden text-2xl text-primary lg:inline">
            →
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/jwelpixel-emblem-v4.png"
            alt="Jwelpixel"
            className="h-24 w-24 shrink-0 object-contain sm:h-28 sm:w-28"
          />
          <span aria-hidden className="text-2xl text-primary lg:hidden">
            ↓
          </span>
          <span aria-hidden className="hidden text-2xl text-primary lg:inline">
            →
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images.after}
            alt="Catalog-ready jewellery photo"
            className="h-44 w-full max-w-72 min-w-0 rounded-2xl object-cover shadow-sm ring-1 ring-primary/15 sm:h-52 lg:max-w-64"
          />
        </div>
      </section>

      <section id="process" className="mt-16 scroll-mt-20 bg-secondary px-4 py-12 sm:mt-20 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,2.25rem)] font-normal text-balance text-foreground">
            How it works
          </h2>
          <span className="mx-auto mt-3 block h-px w-16 bg-primary" />
          <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-3 lg:gap-12">
            <article>
              <p className="font-[family-name:var(--font-display)] text-2xl text-accent">01</p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-foreground">
                Upload your photo
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/70">
                Take a plain photo of your piece. We handle the rest.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images.stepUpload}
                alt=""
                className="mt-6 aspect-[4/3] w-full rounded-lg object-cover"
              />
            </article>
            <article>
              <p className="font-[family-name:var(--font-display)] text-2xl text-accent">02</p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-foreground">
                Pick your style
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/70">
                Choose a model look or a clean backdrop, then the size.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <figure className="rounded-lg bg-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.stepModel} alt="" className="aspect-square w-full rounded object-cover" />
                  <figcaption className="px-1 pt-2 text-xs font-semibold text-foreground">Model</figcaption>
                  <p className="px-1 pb-1 text-[11px] text-foreground/60">Worn on a model</p>
                </figure>
                <figure className="rounded-lg bg-background p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={images.stepBackdrop} alt="" className="aspect-square w-full rounded object-cover" />
                  <figcaption className="px-1 pt-2 text-xs font-semibold text-foreground">Backdrop</figcaption>
                  <p className="px-1 pb-1 text-[11px] text-foreground/60">Clean catalog background</p>
                </figure>
              </div>
            </article>
            <article>
              <p className="font-[family-name:var(--font-display)] text-2xl text-accent">03</p>
              <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-foreground">
                Download and use
              </h3>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-foreground/70">
                Ready in seconds. Post it anywhere you sell.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={images.stepDownload}
                alt=""
                className="mt-6 aspect-[4/3] w-full rounded-lg object-cover"
              />
            </article>
          </div>
        </div>
      </section>

      <section id="gallery" className="scroll-mt-20 bg-background px-4 py-12 sm:px-6 sm:py-16">
        <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,2.25rem)] font-normal text-balance text-foreground">
          Gallery
        </h2>
        <span className="mx-auto mt-3 block h-px w-16 bg-primary" />
        <div className="mx-auto mt-8 grid max-w-6xl grid-cols-2 gap-2 sm:mt-10 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4">
          {images.gallery.map((src) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={src} src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
          ))}
        </div>
      </section>
    </div>
  );
}
