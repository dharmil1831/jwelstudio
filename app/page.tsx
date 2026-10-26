import { MarketingShowcase } from "@/components/marketing-showcase";
import { MobileGuestHome } from "@/components/mobile-onboarding";
import { StudioApp } from "@/components/studio-app";
import { getHomePlaceholders } from "@/lib/home-placeholders";
import { getSessionUser } from "@/lib/session";

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
          </div>
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
