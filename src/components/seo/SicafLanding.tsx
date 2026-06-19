import { CadastroWizard } from "@/components/cadastro/CadastroWizard";
import { CheckCircle2, ShieldCheck, Clock, Building2 } from "lucide-react";

export interface SicafFaq {
  q: string;
  a: string;
}

export interface SicafLandingProps {
  h1: string;
  subtitle: string;
  intro: string[];
  benefits: { icon?: "check" | "shield" | "clock" | "building"; title: string; desc: string }[];
  steps: { title: string; desc: string }[];
  forWho: string[];
  faq: SicafFaq[];
  ctaTitle?: string;
}

const iconMap = {
  check: CheckCircle2,
  shield: ShieldCheck,
  clock: Clock,
  building: Building2,
};

export function SicafLanding({
  h1,
  subtitle,
  intro,
  benefits,
  steps,
  forWho,
  faq,
  ctaTitle = "Inicie agora seu cadastro assistido",
}: SicafLandingProps) {
  return (
    <>
      <section className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="max-w-5xl mx-auto px-4 py-12 md:py-16">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
            {h1}
          </h1>
          <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl">
            {subtitle}
          </p>
          <div className="mt-6 space-y-3 max-w-3xl">
            {intro.map((p, i) => (
              <p key={i} className="text-base text-foreground/80 leading-relaxed">
                {p}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Por que escolher a CADBRASIL</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {benefits.map((b, i) => {
            const Icon = iconMap[b.icon ?? "check"];
            return (
              <div key={i} className="flex gap-4 p-5 rounded-lg border bg-card">
                <Icon className="h-6 w-6 text-primary shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg">{b.title}</h3>
                  <p className="text-muted-foreground mt-1">{b.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="bg-muted/30 border-y">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">Como funciona o processo</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-4 p-4 rounded-lg bg-background border">
                <span className="flex items-center justify-center h-9 w-9 rounded-full bg-primary text-primary-foreground font-bold shrink-0">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="text-muted-foreground text-sm mt-1">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Para quem é indicado</h2>
        <ul className="grid md:grid-cols-2 gap-3">
          {forWho.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-foreground/90">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <section id="cadastro" className="bg-muted/20 border-y">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">{ctaTitle}</h2>
          <p className="text-muted-foreground mb-8">
            Preencha o formulário abaixo e nossa equipe conduzirá todo o processo para você.
          </p>
          <CadastroWizard />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-8">Perguntas frequentes</h2>
        <div className="space-y-4">
          {faq.map((f, i) => (
            <details key={i} className="group rounded-lg border bg-card p-5">
              <summary className="cursor-pointer font-semibold text-foreground list-none flex justify-between items-center">
                {f.q}
                <span className="ml-4 text-primary group-open:rotate-45 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-3 text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}

export function faqJsonLd(faq: SicafFaq[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
