import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/credenciamento-sicaf")({
  head: () => ({
    meta: [
      { title: "Credenciamento SICAF — CADBRASIL" },
      { name: "description", content: "Realize o credenciamento da sua empresa no SICAF de forma assistida pela plataforma CADBRASIL." },
      { property: "og:title", content: "Credenciamento SICAF — CADBRASIL" },
      { property: "og:description", content: "Credenciamento SICAF assistido para participação em licitações públicas." },
    ],
  }),
  component: () => <CadastroWizard />,
});
