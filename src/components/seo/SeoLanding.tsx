import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Clock,
  HeadphonesIcon,
  FileCheck2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Header, TopBar } from "@/components/cadastro/LayoutParts";
import { SEO_PAGES, SITE_NAME, SITE_URL } from "@/lib/seo";

export type SeoSection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type SeoFaq = { q: string; a: string };

export type SeoLandingProps = {
  path: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  lead: string;
  highlights?: string[];
  sections: SeoSection[];
  faqs: SeoFaq[];
  ctaTitle: string;
  ctaText: string;
  ctaLabel?: string;
  /** Texto da página para o JSON-LD do Article/WebPage. */
  description: string;
  updatedAt?: string;
};

const TRUST = [
  { icon: ShieldCheck, label: "Processo 100% seguro" },
  { icon: Clock, label: "Atendimento ágil" },
  { icon: HeadphonesIcon, label: "Suporte humano" },
  { icon: FileCheck2, label: "Conformidade LGPD" },
];

export function SeoLanding(props: SeoLandingProps) {
  const {
    path,
    eyebrow,
    title,
    subtitle,
    lead,
    highlights = [],
    sections,
    faqs,
    ctaTitle,
    ctaText,
    ctaLabel = "Iniciar credenciamento",
  } = props;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary-deep via-primary to-primary-deep text-primary-foreground">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(60rem 30rem at 80% -10%, white, transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-16 text-center lg:px-8 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              {eyebrow}
            </span>
            <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-primary-foreground/85 sm:text-lg">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" variant="secondary" className="font-semibold">
                <Link to="/">
                  {ctaLabel}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <a
                href="https://wa.me/5500000000000"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/30 px-6 text-sm font-medium text-primary-foreground transition-colors hover:bg-white/10"
              >
                Falar com um especialista
              </a>
            </div>

            <ul className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-primary-foreground/90">
              {TRUST.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="h-4 w-4" /> {label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Breadcrumb */}
        <nav
          aria-label="Você está em"
          className="border-b border-border bg-card"
        >
          <div className="mx-auto max-w-3xl px-4 py-3 text-xs text-muted-foreground lg:px-8">
            <Link to="/" className="hover:text-primary">
              Início
            </Link>{" "}
            <span className="px-1">/</span>
            <span className="text-foreground">{eyebrow}</span>
          </div>
        </nav>

        {/* Conteúdo */}
        <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
          <p className="text-lg leading-relaxed text-foreground/90">{lead}</p>

          {highlights.length > 0 && (
            <ul className="mt-8 grid gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 text-sm text-foreground"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-12 space-y-12">
            {sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                  {section.heading}
                </h2>
                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="mt-3 text-base leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-base text-foreground">
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          {/* CTA intermediário */}
          <div className="mt-14 overflow-hidden rounded-xl border border-primary/20 bg-primary-soft/60 p-6 text-center sm:p-8">
            <h2 className="text-xl font-bold tracking-tight text-primary-deep sm:text-2xl">
              {ctaTitle}
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/80 sm:text-base">
              {ctaText}
            </p>
            <Button asChild size="lg" className="mt-6 font-semibold">
              <Link to="/">
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          {/* FAQ */}
          {faqs.length > 0 && (
            <section className="mt-16">
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Perguntas frequentes
              </h2>
              <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
                {faqs.map((faq) => (
                  <details key={faq.q} className="group p-5">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-foreground">
                      {faq.q}
                      <span className="text-primary transition-transform group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>

      <SeoFooter currentPath={path} />
      <SeoStructuredData {...props} />
    </div>
  );
}

function SeoFooter({ currentPath }: { currentPath: string }) {
  const related = SEO_PAGES.filter((page) => page.path !== currentPath);
  return (
    <footer className="border-t border-border bg-primary-deep text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em]">
              {SITE_NAME}
            </p>
            <p className="mt-3 max-w-xs text-sm text-primary-foreground/75">
              Credenciamento assistido de fornecedores para o mercado público
              brasileiro. SICAF, licitações e habilitação com suporte humano.
            </p>
          </div>
          <div>
            <p className="text-sm font-semibold">Guias e serviços</p>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
              {related.map((page) => (
                <li key={page.path}>
                  <a href={page.path} className="hover:text-primary-foreground">
                    {page.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold">Comece agora</p>
            <ul className="mt-3 space-y-2 text-sm text-primary-foreground/75">
              <li>
                <Link to="/" className="hover:text-primary-foreground">
                  Iniciar credenciamento
                </Link>
              </li>
              <li>
                <a
                  href="https://fornecedor.cadbrasil.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-foreground"
                >
                  Portal do Fornecedor
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} {SITE_NAME}. Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}

function SeoStructuredData({
  path,
  title,
  description,
  faqs,
  eyebrow,
  updatedAt,
}: SeoLandingProps) {
  const url = `${SITE_URL}${path}`;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    inLanguage: "pt-BR",
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    author: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/logo-cadbrasil.png`,
      },
    },
    image: `${SITE_URL}/hero-bg.jpg`,
    datePublished: updatedAt ?? "2026-01-01",
    dateModified: updatedAt ?? "2026-06-18",
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: eyebrow, item: url },
    ],
  };

  const faqPage =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(article) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      {faqPage && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPage) }}
        />
      )}
    </>
  );
}
