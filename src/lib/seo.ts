export const SITE_URL = "https://cadastro.cadbrasil.com.br";
export const SITE_NAME = "CADBRASIL";

const OG_IMAGE = `${SITE_URL}/hero-bg.jpg`;

export type SeoHeadInput = {
  path: string;
  title: string;
  description: string;
  keywords?: string;
  ogType?: "website" | "article";
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
}: SeoHeadInput) {
  const url = `${SITE_URL}${path}`;
  return {
    meta: [
      { title },
      { name: "description", content: description },
      ...(keywords ? [{ name: "keywords", content: keywords }] : []),
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
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    links: [{ rel: "canonical", href: url }],
  };
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

export const SEO_PAGES: { path: string; label: string }[] = [
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
