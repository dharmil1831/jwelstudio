import { HomeFaq } from "@/components/home-faq";
import { JsonLd } from "@/components/json-ld";
import { MarketingShowcase } from "@/components/marketing-showcase";
import { MobileGuestHome } from "@/components/mobile-onboarding";
import { StudioApp } from "@/components/studio-app";
import { getHomePlaceholders } from "@/lib/home-placeholders";
import { getSessionUser } from "@/lib/session";
import { homeFaqs, siteUrl } from "@/lib/site-seo";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function Home() {
  const user = await getSessionUser();
  const showMarketing = !user;
  const homeImages = showMarketing ? await getHomePlaceholders() : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {showMarketing && homeImages ? (
        <>
          <div className="hidden lg:block">
            <MarketingShowcase images={homeImages} />
          </div>
          <div className="lg:hidden">
            <MobileGuestHome images={homeImages}>
              <StudioApp />
            </MobileGuestHome>
            <section className="px-4 pb-4 pt-10 text-center">
              <h1 className="font-[family-name:var(--font-display)] text-3xl font-normal leading-tight text-foreground">
                Model shots and videos from one photo.
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/70">
                Pick a look. Jwelpixel puts your jewelry on a model, or on a clean backdrop.
              </p>
            </section>
            <HomeFaq />
          </div>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              url: siteUrl(),
              mainEntity: homeFaqs.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            }}
          />
        </>
      ) : null}
      {user ? (
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6">
          <section className="mx-auto hidden max-w-2xl text-center lg:block">
            <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal leading-tight text-foreground sm:text-5xl">
              Model-ready jewelry visuals in minutes
            </h1>
            <p className="mt-4 text-lg text-foreground/70">
              Upload your piece, choose the look, and generate campaign shots — 5 free
              generations for every new account.
            </p>
          </section>
          <section id="studio" className="scroll-mt-20 mt-0 lg:mt-16">
            <StudioApp />
          </section>
        </main>
      ) : null}
    </div>
  );
}
