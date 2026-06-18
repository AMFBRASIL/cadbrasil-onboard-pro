import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CADBRASIL — Credenciamento Nacional de Fornecedores" },
      { name: "description", content: "Regularize sua empresa para participação em licitações públicas através da plataforma oficial CADBRASIL." },
      { property: "og:title", content: "CADBRASIL — Credenciamento Nacional de Fornecedores" },
      { property: "og:description", content: "Plataforma de credenciamento assistido para fornecedores do mercado público brasileiro." },
    ],
  }),
  component: Index,
});

function Index() {
  return <CadastroWizard />;
}
