import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/cadastro-sicaf-pessoa-juridica")({
  head: () => ({
    meta: [
      { title: "Cadastro SICAF Pessoa Jurídica — CADBRASIL" },
      { name: "description", content: "Cadastro SICAF assistido para Pessoa Jurídica participar de licitações públicas em todo o Brasil." },
      { property: "og:title", content: "Cadastro SICAF PJ — CADBRASIL" },
      { property: "og:description", content: "Credenciamento SICAF completo para Pessoas Jurídicas." },
    ],
  }),
  component: () => <CadastroWizard />,
});
