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
export const SEO_PAGES: { path: string; label: string }[] = [
  { path: "/credenciamento-sicaf", label: "Credenciamento SICAF" },
  { path: "/renovacao-sicaf", label: "Renovação do SICAF" },
  { path: "/empresa-inapta-sicaf", label: "Empresa Inapta no SICAF" },
  { path: "/cadastro-sicaf-mei", label: "Cadastro SICAF para MEI" },
  {
    path: "/cadastro-sicaf-pessoa-juridica",
    label: "Cadastro SICAF Pessoa Jurídica",
  },
];
