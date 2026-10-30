import Link from "next/link";

export const metadata = {
  title: "Font preview — Jwelpixel",
  robots: { index: false, follow: false },
};

export default function FontPreviewPage() {
  return (
    <div className="min-h-screen bg-[#e8e0f0] px-6 py-10 text-[#2a1f33]">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-medium text-[#7c5cbf] hover:underline">
          ← Back home
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">Softer display options</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#2a1f33]/70">
          The live site uses Newsreader for headlines and Manrope for the rest.
        </p>

        <article className="mt-10 overflow-hidden rounded-2xl border border-[#7c5cbf] bg-white shadow-sm ring-2 ring-[#7c5cbf]/35">
          <header className="border-b border-[#7c5cbf]/15 bg-[#7c5cbf]/10 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#7c5cbf]">Live now</p>
            <p className="mt-1 text-sm font-semibold">Newsreader + Manrope</p>
          </header>
          <div className="space-y-5 px-5 py-6">
            <p
              className="text-2xl font-semibold tracking-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Jwelpixel
            </p>
            <h2
              className="text-3xl font-normal leading-tight"
              style={{ fontFamily: "var(--font-display), Georgia, serif" }}
            >
              Model-ready jewelry visuals in minutes
            </h2>
            <p className="text-sm leading-relaxed text-[#2a1f33]/75">
              Upload your piece, choose the look, and generate campaign shots — WhatsApp,
              Instagram, and studio stills.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
