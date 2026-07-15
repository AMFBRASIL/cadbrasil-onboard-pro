import { createFileRoute } from "@tanstack/react-router";

import { CancelamentoWizard } from "@/components/cancelamento/CancelamentoWizard";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/solicitacao-cancelamento";
const TITLE = "Solicitação de Cancelamento — CADBRASIL";
const DESCRIPTION =
  "Abra um protocolo de cancelamento CADBRASIL: consulte o CNPJ, informe motivos, dados de reembolso e, se preferir, reverta para acompanhamento de licitações.";

export const Route = createFileRoute("/solicitacao-cancelamento")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "cancelamento CADBRASIL, solicitar cancelamento, reembolso SICAF, protocolo cancelamento, desistir credenciamento",
      ogType: "website",
    }),
  component: SolicitacaoCancelamentoPage,
});

function SolicitacaoCancelamentoPage() {
  return <CancelamentoWizard />;
}
