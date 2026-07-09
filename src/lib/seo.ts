export const SITE_URL = "https://cadastro.cadbrasil.com.br";
export const SITE_NAME = "CADBRASIL";

const OG_IMAGE = `${SITE_URL}/hero-bg.jpg`;

export type SeoHeadInput = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogType?: "website" | "article";
  /** Resumo estendido para crawlers e leitores de IA (meta abstract). */
  abstract?: string;
  /** Objetos Schema.org serializados no <head> (SSR). */
  jsonLd?: Record<string, unknown>[];
};

/**
 * Monta o objeto `head()` (meta + links) de uma rota com SEO completo:
 * title, description, keywords, robots (index/follow para buscadores e IA),
 * canonical único por página, Open Graph e Twitter Cards.
 */
export function buildSeoHead({
  path,
  title,
  description,
  keywords,
  ogType = "article",
  abstract,
  jsonLd,
}: SeoHeadInput) {
  const url = `${SITE_URL}${path}`;
  const meta = [
    { title },
    { name: "description", content: description },
    ...(keywords ? [{ name: "keywords", content: keywords }] : []),
    ...(abstract ? [{ name: "abstract", content: abstract }] : []),
    { name: "author", content: SITE_NAME },
    { name: "language", content: "pt-BR" },
    { name: "robots", content: "index, follow" },
    {
      name: "googlebot",
      content:
        "index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1",
    },
    { property: "og:type", content: ogType },
    { property: "og:locale", content: "pt_BR" },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: OG_IMAGE },
    {
      property: "og:image:alt",
      content: `${SITE_NAME} — credenciamento SICAF e licitações públicas`,
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
    {
      name: "twitter:image:alt",
      content: `${SITE_NAME} — credenciamento SICAF e licitações públicas`,
    },
  ];

  const links = [
    { rel: "canonical", href: url },
    {
      rel: "alternate",
      type: "text/plain",
      href: "/llms.txt",
      title: "LLMs.txt — guia para sistemas de IA",
    },
  ];

  const scripts = (jsonLd ?? []).map((data) => ({
    type: "application/ld+json" as const,
    children: JSON.stringify(data),
  }));

  return { meta, links, ...(scripts.length > 0 ? { scripts } : {}) };
}

/** Páginas de conteúdo/SEO usadas para links internos (footer e correlatas). */
export type ConclusaoStructuredDataInput = {
  protocolo: string;
  razaoSocial: string;
  documento: string;
  cidade: string;
  estado: string;
  sicafStatus?: string;
};

/** JSON-LD para página de confirmação pós-cadastro (Service + Breadcrumb). */
export function buildConclusaoStructuredData(input: ConclusaoStructuredDataInput) {
  const url = `${SITE_URL}/conclusao-cadastro`;

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Credenciamento SICAF CADBRASIL",
    description:
      "Protocolo de credenciamento no Sistema de Cadastramento Unificado de Fornecedores com assessoria CADBRASIL.",
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    areaServed: { "@type": "Country", name: "Brasil" },
    serviceType: "Credenciamento SICAF",
    identifier: input.protocolo,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Credenciamento recebido",
        item: url,
      },
    ],
  };

  const confirmation = {
    "@context": "https://schema.org",
    "@type": "Order",
    orderStatus: "https://schema.org/OrderProcessing",
    orderNumber: input.protocolo,
    customer: {
      "@type": "Organization",
      name: input.razaoSocial,
      taxID: input.documento,
      address: {
        "@type": "PostalAddress",
        addressLocality: input.cidade,
        addressRegion: input.estado,
        addressCountry: "BR",
      },
    },
    seller: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    ...(input.sicafStatus ? { description: `Status SICAF: ${input.sicafStatus}` } : {}),
  };

  return { service, breadcrumb, confirmation };
}

export type CredenciamentoStructuredDataInput = {
  title: string;
  description: string;
  abstract: string;
  path?: string;
  faqs: readonly { q: string; a: string }[];
  howToSteps: readonly { name: string; text: string }[];
};

/** JSON-LD completo para /credenciamento (WebPage, FAQ, HowTo, Service, Breadcrumb). */
export function buildCredenciamentoStructuredData({
  title,
  description,
  abstract,
  path = "/credenciamento",
  faqs,
  howToSteps,
}: CredenciamentoStructuredDataInput) {
  const url = `${SITE_URL}${path}`;
  const updated = "2026-07-09";

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    abstract,
    inLanguage: "pt-BR",
    isPartOf: { "@type": "WebSite", "@id": `${SITE_URL}#website`, name: SITE_NAME, url: SITE_URL },
    about: [
      { "@type": "Thing", name: "Credenciamento SICAF" },
      { "@type": "Thing", name: "Licitações públicas no Brasil" },
    ],
    primaryImageOfPage: { "@type": "ImageObject", url: OG_IMAGE },
    datePublished: "2026-06-01",
    dateModified: updated,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: `${SITE_URL}/logo-cadbrasil.png` },
    },
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: [".credenciamento-seo-lead", ".credenciamento-seo-faq summary"],
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Início", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Diagnóstico de credenciamento",
        item: url,
      },
    ],
  };

  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Diagnóstico gratuito de potencial em licitações",
    description: abstract,
    provider: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
    areaServed: { "@type": "Country", name: "Brasil" },
    serviceType: "Diagnóstico de aderência ao mercado público",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "BRL",
      description: "Diagnóstico interativo gratuito em aproximadamente 90 segundos",
    },
    url,
  };

  const howTo = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "Como fazer o diagnóstico de credenciamento CADBRASIL",
    description,
    totalTime: "PT2M",
    inLanguage: "pt-BR",
    step: howToSteps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.name,
      text: step.text,
      url: `${url}#passo-${index + 1}`,
    })),
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

  return { webPage, breadcrumb, service, howTo, faqPage };
}

export const SEO_PAGES: { path: string; label: string }[] = [
  { path: "/credenciamento", label: "Diagnóstico de credenciamento" },
  { path: "/assistente-ajuda", label: "Assistente — acesso ao SICAF" },
  { path: "/instalador-assistente-cadbrasil", label: "Instalar o Assistente" },
  { path: "/procedimento-login-senha", label: "Login e senha no portal" },
  { path: "/procedimentos-cadbrasil", label: "Procedimentos CADBRASIL" },
  { path: "/assistente", label: "Assistente — tutoriais em vídeo" },
  { path: "/credenciamento-sicaf", label: "Credenciamento SICAF" },
  { path: "/renovacao-sicaf", label: "Renovação do SICAF" },
  { path: "/empresa-inapta-sicaf", label: "Empresa Inapta no SICAF" },
  { path: "/cadastro-sicaf-mei", label: "Cadastro SICAF para MEI" },
  {
    path: "/cadastro-sicaf-pessoa-juridica",
    label: "Cadastro SICAF Pessoa Jurídica",
  },
];
