import { Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CREDENCIAMENTO_ABSTRACT,
  CREDENCIAMENTO_FAQS,
  CREDENCIAMENTO_HOWTO_STEPS,
  CREDENCIAMENTO_SECTIONS,
  CREDENCIAMENTO_TITLE,
} from "@/lib/credenciamento-seo-content";
import {
  getCredenciamentoCtaCadastroSearch,
  persistUtmFromSearchParams,
} from "@/lib/tracking";
import { SEO_PAGES, SITE_NAME, SITE_URL } from "@/lib/seo";

const RELATED_PATHS = new Set([
  "/credenciamento-sicaf",
  "/cadastro-sicaf-mei",
  "/cadastro-sicaf-pessoa-juridica",
  "/renovacao-sicaf",
]);

export function CredenciamentoSeoBlock() {
  const related = SEO_PAGES.filter((p) => RELATED_PATHS.has(p.path));
  const cadastroSearch = getCredenciamentoCtaCadastroSearch();

  function handleCadastroClick() {
    persistUtmFromSearchParams(cadastroSearch);
  }

  return (
    <>
      <noscript>
        <section className="mx-auto max-w-3xl px-4 py-8 text-sm leading-relaxed text-foreground">
          <h1>{CREDENCIAMENTO_TITLE}</h1>
          <p>{CREDENCIAMENTO_ABSTRACT}</p>
          <p>
            Acesse {SITE_URL}/credenciamento com JavaScript habilitado para o
            diagnóstico interativo ou inicie o cadastro em {SITE_URL}.
          </p>
        </section>
      </noscript>

      <section
        aria-labelledby="credenciamento-seo-heading"
        className="border-t border-border bg-muted/30"
      >
        <nav
          aria-label="Você está em"
          className="border-b border-border bg-card"
        >
          <div className="mx-auto max-w-3xl px-4 py-3 text-xs text-muted-foreground lg:px-8">
            <Link to="/" className="hover:text-primary">
              Início
            </Link>{" "}
            <span className="px-1">/</span>
            <span className="text-foreground">Diagnóstico de credenciamento</span>
          </div>
        </nav>

        <article className="mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
            Guia CADBRASIL
          </p>
          <h2
            id="credenciamento-seo-heading"
            className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
          >
            Diagnóstico gratuito para vender ao governo
          </h2>
          <p className="credenciamento-seo-lead mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
            {CREDENCIAMENTO_ABSTRACT}
          </p>

          <div className="mt-10 space-y-10">
            <section>
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Passos do diagnóstico
              </h3>
              <ol className="mt-4 space-y-4">
                {CREDENCIAMENTO_HOWTO_STEPS.map((step, index) => (
                  <li
                    key={step.name}
                    id={`passo-${index + 1}`}
                    className="rounded-lg border border-border bg-card p-4"
                  >
                    <p className="text-sm font-semibold text-foreground">
                      {index + 1}. {step.name}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {step.text}
                    </p>
                  </li>
                ))}
              </ol>
            </section>

            {CREDENCIAMENTO_SECTIONS.map((section) => (
              <section key={section.heading}>
                <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                  {section.heading}
                </h3>
                {section.paragraphs.map((p, i) => (
                  <p
                    key={i}
                    className="mt-3 text-base leading-relaxed text-muted-foreground"
                  >
                    {p}
                  </p>
                ))}
                {"bullets" in section && section.bullets && (
                  <ul className="mt-4 space-y-2.5">
                    {section.bullets.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-3 text-base text-foreground"
                      >
                        <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-primary" />
                        <span className="text-muted-foreground">{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border border-primary/20 bg-primary-soft/50 p-6 text-center sm:p-8">
            <h3 className="text-lg font-bold text-primary-deep sm:text-xl">
              Pronto para o credenciamento SICAF?
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-sm text-foreground/80 sm:text-base">
              Após o diagnóstico, inicie o cadastro assistido e deixe sua empresa
              apta a participar de licitações em todo o Brasil.
            </p>
            <Button asChild size="lg" className="mt-6 font-semibold">
              <Link to="/" search={cadastroSearch} onClick={handleCadastroClick}>
                Iniciar credenciamento
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <section className="credenciamento-seo-faq mt-14">
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Perguntas frequentes sobre o diagnóstico
            </h3>
            <div className="mt-6 divide-y divide-border rounded-xl border border-border bg-card">
              {CREDENCIAMENTO_FAQS.map((faq) => (
                <details key={faq.q} className="group p-5" id={slugify(faq.q)}>
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

          <section className="mt-14">
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Conteúdo relacionado
            </h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {related.map((page) => (
                <li key={page.path}>
                  <a
                    href={page.path}
                    className="text-sm text-primary hover:underline underline-offset-4"
                  >
                    {page.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>

          <p className="mt-10 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {SITE_NAME}. Conteúdo em português
            (Brasil) para fornecedores do mercado público. Índice para sistemas
            de IA:{" "}
            <a href="/llms.txt" className="text-primary hover:underline">
              llms.txt
            </a>
            .
          </p>
        </article>
      </section>
    </>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
