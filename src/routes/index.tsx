import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";
import { SITE_URL } from "@/lib/seo";
import { parseTrackingSearch } from "@/lib/tracking";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => parseTrackingSearch(search),
  head: () => ({
    meta: [
      { title: "CADBRASIL — Credenciamento Nacional de Fornecedores" },
      { name: "description", content: "Regularize sua empresa para participação em licitações públicas através da plataforma oficial CADBRASIL." },
      { property: "og:title", content: "CADBRASIL — Credenciamento Nacional de Fornecedores" },
      { property: "og:description", content: "Plataforma de credenciamento assistido para fornecedores do mercado público brasileiro." },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: Index,
});

function Index() {
  return <CadastroWizard />;
}
