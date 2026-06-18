import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/empresa-inapta-sicaf")({
  head: () => ({
    meta: [
      { title: "Regularização de Empresa Inapta no SICAF — CADBRASIL" },
      { name: "description", content: "Regularize sua empresa inapta no SICAF e retome a participação em licitações públicas." },
      { property: "og:title", content: "Empresa Inapta no SICAF — CADBRASIL" },
      { property: "og:description", content: "Regularização especializada para empresas inaptas no SICAF." },
    ],
  }),
  component: () => <CadastroWizard />,
});
