import { createFileRoute } from "@tanstack/react-router";

import { ProcedimentoLoginSenhaContent } from "@/components/procedimentos/ProcedimentoLoginSenhaContent";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/procedimento-login-senha";
const TITLE = "Login e senha — Portal CADBRASIL";
const DESCRIPTION =
  "Saiba como acessar o Portal do Fornecedor CADBRASIL e recuperar sua senha pelo link Esqueci minha senha em fornecedor.cadbrasil.com.br.";

export const Route = createFileRoute("/procedimento-login-senha")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "login CADBRASIL, esqueci senha portal fornecedor, recuperar senha SICAF, acesso fornecedor.cadbrasil.com.br, credenciais portal",
    }),
  component: ProcedimentoLoginSenhaPage,
});

function ProcedimentoLoginSenhaPage() {
  return <ProcedimentoLoginSenhaContent />;
}
