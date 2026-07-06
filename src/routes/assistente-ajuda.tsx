import { createFileRoute } from "@tanstack/react-router";

import { AssistenteAjudaContent } from "@/components/assistente/AssistenteAjudaContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/assistente-ajuda";
const TITLE = "Assistente de Ajuda — como acessar o SICAF passo a passo";
const DESCRIPTION =
  "Guia visual em 3 passos: acesse o Assistente CADBRASIL, entre no SICAF com certificado digital e use os menus Cadastro e Consulta.";

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
