import Link from "next/link";

const GALLERY = [
  "/mobile-looks/product-gold.jpg",
  "/mobile-looks/look-bridal.jpg",
  "/mobile-looks/product-portrait.jpg",
  "/mobile-looks/product-black.jpg",
  "/mobile-looks/product-blush.jpg",
  "/mobile-looks/look-beauty.jpg",
  "/mobile-looks/product-white.jpg",
  "/mobile-looks/look-glamour.jpg",
] as const;

export function MarketingShowcase() {
  return (
    <div className="mt-16 space-y-20">
      <section aria-label="Before and after" className="text-center">
        <Link
          href="#studio"
          className="inline-flex rounded-md bg-primary px-6 py-3 text-xs font-bold tracking-[0.18em] text-white hover:bg-accent hover:text-foreground"
        >
          START CREATING
        </Link>

        <div className="mt-10 flex flex-col items-center justify-center gap-6 md:flex-row md:gap-8">
          <figure className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-primary/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mobile-looks/product-white.jpg"
              alt="Jewelry photo before styling"
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>

          <div className="flex items-center gap-3 text-primary" aria-hidden>
            <span className="text-2xl">→</span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/jwelpixel-emblem-v4.png"
              alt=""
              className="h-24 w-24 object-contain"
            />
            <span className="text-2xl">→</span>
          </div>

          <figure className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-primary/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/mobile-looks/look-bridal.jpg"
              alt="Styled jewelry result"
              className="aspect-[4/3] w-full object-cover"
            />
          </figure>
        </div>
      </section>

      <section id="process" className="scroll-mt-24">
        <h2 className="text-center font-[family-name:var(--font-display)] text-4xl font-normal text-foreground">
          How It Works
        </h2>
        <div className="mx-auto mt-3 h-px w-16 bg-primary" />
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          <article>
            <p className="font-[family-name:var(--font-display)] text-2xl text-primary">01</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-foreground">
              Upload Your Photo
            </h3>
            <p className="mt-2 text-sm text-foreground/65">
              Take a plain photo of your piece. We handle the rest.
            </p>
            <figure className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mobile-looks/product-portrait.jpg"
                alt="Uploaded jewelry"
                className="aspect-[4/3] w-full object-cover"
              />
            </figure>
          </article>

          <article>
            <p className="font-[family-name:var(--font-display)] text-2xl text-primary">02</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-foreground">
              Pick Your Style
            </h3>
            <p className="mt-2 text-sm text-foreground/65">
              Choose model or background, tone, and size.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <figure className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mobile-looks/product-gold.jpg"
                  alt="Studio backdrop style"
                  className="aspect-square w-full object-cover"
                />
              </figure>
              <figure className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/mobile-looks/look-beauty.jpg"
                  alt="Model look style"
                  className="aspect-square w-full object-cover"
                />
              </figure>
            </div>
          </article>

          <article>
            <p className="font-[family-name:var(--font-display)] text-2xl text-primary">03</p>
            <h3 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-foreground">
              Download &amp; Use
            </h3>
            <p className="mt-2 text-sm text-foreground/65">
              Ready in seconds. Post it anywhere you sell.
            </p>
            <figure className="mt-4 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mobile-looks/look-glamour.jpg"
                alt="Finished jewelry visual"
                className="aspect-[4/3] w-full object-cover"
              />
            </figure>
          </article>
        </div>
      </section>

      <section id="looks" aria-label="Look gallery" className="scroll-mt-24">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {GALLERY.map((src) => (
            <figure
              key={src}
              className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-primary/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
