import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/renovacao-sicaf")({
  head: () => ({
    meta: [
      { title: "Renovação SICAF — CADBRASIL" },
      { name: "description", content: "Renove o cadastro SICAF da sua empresa e mantenha a regularidade para licitações públicas." },
      { property: "og:title", content: "Renovação SICAF — CADBRASIL" },
      { property: "og:description", content: "Renovação SICAF assistida com acompanhamento especializado." },
    ],
  }),
  component: () => <CadastroWizard />,
});
