import { createFileRoute } from "@tanstack/react-router";

import { AssistenteAjudaContent } from "@/components/assistente/AssistenteAjudaContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/assistente-ajuda";
const TITLE = "Assistente de Ajuda — guia completo SICAF e atualização CADBRASIL";
const DESCRIPTION =
  "Guia visual em 6 passos: acesse o SICAF, baixe a Situação do Fornecedor em PDF, envie no Assistente CADBRASIL e acompanhe o resultado atualizado.";

export const Route = createFileRoute("/assistente-ajuda")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "assistente ajuda SICAF, acessar SICAF certificado digital, menu cadastro SICAF, consulta CRC, Assistente CADBRASIL, gov.br fornecedor",
    }),
  component: AssistenteAjudaPage,
});

function AssistenteAjudaPage() {
  return <AssistenteAjudaContent />;
}
