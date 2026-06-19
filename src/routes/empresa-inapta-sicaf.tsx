import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/empresa-inapta-sicaf";
const TITLE = "Empresa inapta no SICAF: como regularizar e voltar a licitar";
const DESCRIPTION =
  "Empresa inapta ou irregular no SICAF? Entenda as causas e regularize a situação para voltar a participar de licitações. Apoio especializado da CADBRASIL.";

export const Route = createFileRoute("/empresa-inapta-sicaf")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "empresa inapta SICAF, SICAF irregular, regularizar SICAF, empresa impedida de licitar, habilitação parcial SICAF, pendências SICAF, voltar a licitar",
    }),
  component: EmpresaInaptaSicaf,
});

function EmpresaInaptaSicaf() {
  return (
    <SeoLanding
      path={PATH}
      eyebrow="Empresa Inapta no SICAF"
      title="Empresa inapta no SICAF? Volte a licitar"
      subtitle="Identifique o que está impedindo sua empresa no SICAF e regularize a situação para voltar a disputar contratos públicos."
      description={DESCRIPTION}
      lead="Quando uma empresa aparece como inapta ou irregular no SICAF, ela fica impedida de participar de licitações até que a situação seja resolvida. Isso costuma acontecer por certidões vencidas, pendências fiscais ou níveis incompletos. A boa notícia é que, na maioria dos casos, a regularização é totalmente possível com a orientação correta."
      highlights={[
        "Diagnóstico completo do motivo da inaptidão",
        "Plano claro para regularizar cada pendência",
        "Reativação da habilitação para voltar a licitar",
        "Acompanhamento até a empresa ficar apta novamente",
      ]}
      sections={[
        {
          heading: "O que significa estar inapto no SICAF",
          paragraphs: [
            "A inaptidão indica que a empresa não atende, naquele momento, a algum dos requisitos de regularidade exigidos para contratar com o poder público. Enquanto isso não é corrigido, o sistema bloqueia a participação em pregões e licitações.",
          ],
        },
        {
          heading: "Principais causas de inaptidão",
          bullets: [
            "Certidões fiscais, trabalhistas ou do FGTS vencidas",
            "Débitos ou pendências junto à Receita Federal",
            "Níveis do SICAF incompletos ou desatualizados",
            "Dados cadastrais divergentes ou desatualizados",
            "Sanções e impedimentos registrados em sistemas oficiais",
          ],
        },
        {
          heading: "Passo a passo da regularização",
          bullets: [
            "Análise da situação atual da empresa no SICAF",
            "Identificação exata das pendências que geram o bloqueio",
            "Emissão e atualização das certidões necessárias",
            "Correção dos níveis e dos dados cadastrais",
            "Validação final da habilitação no Compras.gov.br",
          ],
        },
        {
          heading: "Conte com apoio especializado",
          paragraphs: [
            "A CADBRASIL faz o diagnóstico, indica o caminho mais rápido para resolver cada pendência e acompanha o processo até que sua empresa volte a ficar apta para licitar.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Empresa inapta no SICAF pode voltar a licitar?",
          a: "Sim. Na maioria dos casos, regularizando as certidões e pendências a empresa volta a ficar apta e pode participar normalmente de licitações.",
        },
        {
          q: "Quanto tempo leva para regularizar o SICAF?",
          a: "Depende das pendências. Questões de certidões costumam ser rápidas; pendências fiscais podem exigir prazos adicionais. O diagnóstico mostra o tempo estimado.",
        },
        {
          q: "Como sei por que minha empresa está inapta?",
          a: "É preciso analisar os níveis e as certidões no SICAF. Nossa equipe faz esse diagnóstico e aponta exatamente o que precisa ser resolvido.",
        },
      ]}
      ctaTitle="Sua empresa está inapta no SICAF?"
      ctaText="Faça o diagnóstico e regularize a situação para voltar a participar de licitações o quanto antes."
      ctaLabel="Regularizar minha empresa"
    />
  );
}
