import { createFileRoute } from "@tanstack/react-router";
import { CadastroWizard } from "@/components/cadastro/CadastroWizard";

export const Route = createFileRoute("/cadastro-sicaf-mei")({
  head: () => ({
    meta: [
      { title: "Cadastro SICAF para MEI — CADBRASIL" },
      { name: "description", content: "Cadastro SICAF assistido para Microempreendedores Individuais (MEI) participarem de licitações públicas." },
      { property: "og:title", content: "Cadastro SICAF MEI — CADBRASIL" },
      { property: "og:description", content: "Credenciamento SICAF descomplicado para MEI." },
    ],
  }),
  component: () => <CadastroWizard />,
});
