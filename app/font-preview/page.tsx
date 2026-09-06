import {
  Alegreya,
  Literata,
  Manrope,
  Newsreader,
  Petrona,
  Source_Serif_4,
  Spectral,
} from "next/font/google";
import Link from "next/link";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const alegreya = Alegreya({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const petrona = Petrona({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const OPTIONS = [
  {
    id: "SOFT1",
    name: "Newsreader + Manrope",
    vibe: "Softer editorial — live now",
    favorite: true,
    display: newsreader,
  },
  {
    id: "SOFT2",
    name: "Literata + Manrope",
    vibe: "Rounder, calm reading serif",
    favorite: false,
    display: literata,
  },
  {
    id: "SOFT3",
    name: "Alegreya + Manrope",
    vibe: "Calligraphic soft, jewelry-friendly",
    favorite: false,
    display: alegreya,
  },
  {
    id: "SOFT4",
    name: "Source Serif 4 + Manrope",
    vibe: "Soft modern classic",
    favorite: false,
    display: sourceSerif,
  },
  {
    id: "SOFT5",
    name: "Petrona + Manrope",
    vibe: "Gentle display, low contrast",
    favorite: false,
    display: petrona,
  },
  {
    id: "SOFT6",
    name: "Spectral + Manrope",
    vibe: "Earlier keep option — slightly firmer",
    favorite: false,
    display: spectral,
  },
] as const;

export const metadata = {
  title: "Font preview — Jewel Studio",
};

export default function FontPreviewPage() {
  return (
    <div className="min-h-screen bg-[#e8e0f0] px-6 py-10 text-[#2a1f33]">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-medium text-[#7c5cbf] hover:underline">
          ← Back home
        </Link>
        <h1 className={`mt-6 text-2xl font-semibold tracking-tight ${manrope.className}`}>
          Softer display options
        </h1>
        <p className={`mt-2 max-w-2xl text-sm text-[#2a1f33]/70 ${manrope.className}`}>
          Direction: <strong>softer</strong>. <strong>SOFT1</strong> is live.
          Reply with an id to switch.
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {OPTIONS.map((opt) => (
            <article
              key={opt.id}
              className={`overflow-hidden rounded-2xl border bg-white shadow-sm ${
                opt.favorite
                  ? "border-[#7c5cbf] ring-2 ring-[#7c5cbf]/35"
                  : "border-[#7c5cbf]/25"
              }`}
            >
              <header className="border-b border-[#7c5cbf]/15 bg-[#7c5cbf]/10 px-5 py-3">
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs font-bold uppercase tracking-widest text-[#7c5cbf] ${manrope.className}`}
                  >
                    {opt.id}
                  </p>
                  {opt.favorite ? (
                    <span
                      className={`rounded-full bg-[#7c5cbf] px-2 py-0.5 text-[10px] font-semibold text-white ${manrope.className}`}
                    >
                      Live now
                    </span>
                  ) : null}
                </div>
                <p className={`mt-1 text-sm font-semibold ${manrope.className}`}>
                  {opt.name}
                </p>
                <p className={`text-xs text-[#2a1f33]/55 ${manrope.className}`}>
                  {opt.vibe}
                </p>
              </header>

              <div className="space-y-5 px-5 py-6">
                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest text-[#7c5cbf]/80 ${manrope.className}`}
                  >
                    Brand
                  </p>
                  <p
                    className={`mt-1 text-2xl font-semibold tracking-tight ${opt.display.className}`}
                  >
                    Jewel Studio
                  </p>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest text-[#7c5cbf]/80 ${manrope.className}`}
                  >
                    Headline
                  </p>
                  <h2
                    className={`mt-1 text-3xl font-normal leading-tight ${opt.display.className}`}
                  >
                    Model-ready jewelry visuals in minutes
                  </h2>
                </div>

                <div>
                  <p
                    className={`text-[10px] uppercase tracking-widest text-[#7c5cbf]/80 ${manrope.className}`}
                  >
                    Body / UI
                  </p>
                  <p
                    className={`mt-1 text-sm leading-relaxed text-[#2a1f33]/75 ${manrope.className}`}
                  >
                    Upload your piece, choose the look, and generate campaign
                    shots — WhatsApp, Instagram, and studio stills.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
