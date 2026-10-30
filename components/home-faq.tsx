import { homeFaqs } from "@/lib/site-seo";

export function HomeFaq() {
  return (
    <section id="faq" className="scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-center font-[family-name:var(--font-display)] text-[clamp(1.75rem,5vw,2.25rem)] font-normal text-balance text-foreground">
          Questions
        </h2>
        <span className="mx-auto mt-3 block h-px w-16 bg-primary" />
        <dl className="mt-8 divide-y divide-primary/15">
          {homeFaqs.map((item) => (
            <div key={item.question} className="py-5">
              <dt className="font-[family-name:var(--font-display)] text-xl text-foreground">
                {item.question}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-foreground/70">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
