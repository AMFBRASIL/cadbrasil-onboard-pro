import { createFileRoute } from "@tanstack/react-router";

import { AssistenteContent } from "@/components/assistente/AssistenteContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/assistente";
const TITLE = "Assistente CADBRASIL — tutoriais em vídeo";
const DESCRIPTION =
  "Vídeos de apoio para instalar o Assistente CADBRASIL, atualizar o SICAF, enviar documentação e participar de licitações públicas.";

export const Route = createFileRoute("/assistente")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "assistente CADBRASIL, tutorial SICAF, como instalar assistente, documentação SICAF, licitações públicas, vídeo tutorial fornecedor",
    }),
  component: AssistentePage,
});

function AssistentePage() {
  return <AssistenteContent />;
}
