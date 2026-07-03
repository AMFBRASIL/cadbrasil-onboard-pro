import { createFileRoute } from "@tanstack/react-router";

import { InstaladorAssistenteContent } from "@/components/procedimentos/InstaladorAssistenteContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/instalador-assistente-cadbrasil";
const TITLE = "Como instalar o Assistente CADBRASIL — guia passo a passo";
const DESCRIPTION =
  "Aprenda a instalar o Assistente CADBRASIL: acesse o Portal do Fornecedor, abra a Central de Ajuda e assista aos vídeos oficiais de instalação.";

export const Route = createFileRoute("/instalador-assistente-cadbrasil")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "instalar assistente CADBRASIL, instalador CADBRASIL, central de ajuda portal fornecedor, vídeo instalação assistente, software CADBRASIL",
    }),
  component: InstaladorAssistentePage,
});

function InstaladorAssistentePage() {
  return <InstaladorAssistenteContent />;
}
