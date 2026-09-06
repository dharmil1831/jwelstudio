import { StudioApp } from "@/components/studio-app";

const STEPS = [
  { n: "01", title: "Upload", body: "Add your jewelry photo" },
  { n: "02", title: "Style", body: "Pick format, model or background, then scene & mood" },
  { n: "03", title: "Generate", body: "AI creates a model shot or product still" },
  { n: "04", title: "Gallery", body: "View past shots in your account" },
] as const;

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-6xl px-6 pb-20 pt-10">
        <section className="mx-auto max-w-2xl text-center">
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-normal leading-tight text-foreground sm:text-5xl">
            Model-ready jewelry visuals in minutes
          </h1>
          <p className="mt-4 text-lg text-foreground/70">
            Upload your piece, choose the look, and generate campaign shots — 5 free
            generations for every new account.
          </p>
        </section>

        <section className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="rounded-xl border border-primary/20 bg-secondary/80 px-4 py-4 text-left"
            >
              <p className="text-xs font-bold text-primary">{s.n}</p>
              <p className="mt-1 font-medium text-foreground">{s.title}</p>
              <p className="mt-1 text-xs text-foreground/65">{s.body}</p>
            </div>
          ))}
        </section>

        <section id="studio" className="scroll-mt-20 mt-16">
          <StudioApp />
        </section>
      </main>
    </div>
  );
}
