import { createFileRoute } from "@tanstack/react-router";

import { ProcedimentosCadbrasilContent } from "@/components/procedimentos/ProcedimentosCadbrasilContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/procedimentos-cadbrasil";
const TITLE = "Procedimentos CADBRASIL — como funciona o credenciamento SICAF";
const DESCRIPTION =
  "Entenda passo a passo como funciona o processo CADBRASIL: cadastro inicial, portal, documentação e SICAF 100% ativado com segurança para licitações.";

export const Route = createFileRoute("/procedimentos-cadbrasil")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "procedimentos CADBRASIL, como funciona SICAF, credenciamento passo a passo, cadastro fornecedor governo, habilitação SICAF, licitações públicas",
    }),
  component: ProcedimentosCadbrasilPage,
});

function ProcedimentosCadbrasilPage() {
  return <ProcedimentosCadbrasilContent />;
}
