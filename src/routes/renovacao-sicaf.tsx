import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/renovacao-sicaf";
const TITLE = "Renovação do SICAF: mantenha sua empresa apta para licitar";
const DESCRIPTION =
  "Renove o SICAF da sua empresa e evite ficar impedido de licitar. Atualização de certidões e níveis com acompanhamento da CADBRASIL.";

export const Route = createFileRoute("/renovacao-sicaf")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "renovação SICAF, atualizar SICAF, renovar cadastro SICAF, certidões SICAF vencidas, atualização níveis SICAF, manter SICAF ativo, regularizar SICAF",
    }),
  component: RenovacaoSicaf,
});

function RenovacaoSicaf() {
  return (
    <SeoLanding
      path={PATH}
      eyebrow="Renovação do SICAF"
      title="Renovação do SICAF sem perder oportunidades"
      subtitle="Mantenha as certidões e os níveis do SICAF sempre atualizados para continuar participando de licitações sem interrupções."
      description={DESCRIPTION}
      lead="O SICAF não é um cadastro definitivo: as certidões vinculadas aos seus níveis têm prazos de validade. Quando elas vencem, a empresa pode ficar com a habilitação parcial ou totalmente bloqueada, perdendo oportunidades importantes de venda ao governo. A renovação mantém seu cadastro ativo e competitivo."
      highlights={[
        "Atualização das certidões antes do vencimento",
        "Revisão dos níveis do SICAF para manter a habilitação completa",
        "Prevenção de bloqueios e impedimentos em pregões",
        "Acompanhamento contínuo da regularidade da empresa",
      ]}
      sections={[
        {
          heading: "Por que renovar o SICAF é essencial",
          paragraphs: [
            "Uma certidão vencida pode inabilitar sua empresa em plena disputa de um pregão, mesmo que a proposta seja a melhor. Manter o SICAF renovado garante que você não seja surpreendido na hora de contratar com a Administração Pública.",
          ],
        },
        {
          heading: "Sinais de que está na hora de renovar",
          bullets: [
            "Certidões fiscais ou trabalhistas próximas do vencimento",
            "Níveis do SICAF aparecendo como pendentes ou irregulares",
            "Mensagens de habilitação parcial no Compras.gov.br",
            "Empresa há meses sem atualizar a documentação",
          ],
        },
        {
          heading: "Como funciona a renovação assistida",
          bullets: [
            "Diagnóstico da situação atual do seu SICAF",
            "Levantamento das certidões e documentos a atualizar",
            "Atualização dos níveis e regularização de pendências",
            "Confirmação de que a empresa voltou a ficar apta",
          ],
        },
        {
          heading: "Evite o impedimento de licitar",
          paragraphs: [
            "A CADBRASIL acompanha os prazos por você e atua de forma preventiva, evitando que a empresa fique impedida de participar de licitações por causa de documentação vencida.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Com que frequência preciso renovar o SICAF?",
          a: "A renovação acompanha a validade das certidões, que normalmente variam de 30 a 180 dias. O ideal é monitorar continuamente para não deixar nenhuma vencer.",
        },
        {
          q: "O que acontece se as certidões do SICAF vencerem?",
          a: "A empresa pode ficar com habilitação parcial e ser inabilitada em licitações. Por isso a renovação deve ser feita antes do vencimento.",
        },
        {
          q: "Posso renovar o SICAF mesmo com pendências fiscais?",
          a: "É preciso regularizar as pendências para atualizar os níveis. Nossa equipe orienta o passo a passo para resolver cada situação.",
        },
      ]}
      ctaTitle="Sua empresa precisa renovar o SICAF?"
      ctaText="Atualize agora as certidões e os níveis do seu cadastro e continue participando de licitações sem interrupções."
      ctaLabel="Renovar meu SICAF"
    />
  );
}
