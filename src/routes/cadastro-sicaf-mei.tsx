import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/cadastro-sicaf-mei";
const TITLE = "Cadastro SICAF para MEI: como o microempreendedor vende ao governo";
const DESCRIPTION =
  "MEI também pode vender para o governo. Veja como fazer o cadastro SICAF do microempreendedor individual e participar de licitações com a CADBRASIL.";

export const Route = createFileRoute("/cadastro-sicaf-mei")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "cadastro SICAF MEI, MEI licitação, microempreendedor individual governo, SICAF microempreendedor, MEI vender para o governo, MEI compras públicas",
    }),
  component: CadastroSicafMei,
});

function CadastroSicafMei() {
  return (
    <SeoLanding
      path={PATH}
      eyebrow="Cadastro SICAF para MEI"
      title="Cadastro SICAF para MEI: venda para o governo"
      subtitle="Sim, o Microempreendedor Individual pode participar de licitações. Faça o cadastro SICAF do seu MEI e acesse oportunidades no setor público."
      description={DESCRIPTION}
      lead="Muitos microempreendedores não sabem, mas o MEI pode fornecer produtos e serviços para órgãos públicos. Além disso, o MEI conta com tratamento diferenciado em licitações, garantido por lei. Para aproveitar essas oportunidades, é preciso ter o cadastro no SICAF em dia."
      highlights={[
        "MEI pode participar de licitações em todo o Brasil",
        "Tratamento diferenciado garantido a ME e EPP/MEI",
        "Processo simplificado e assistido do início ao fim",
        "Acesso ao Compras.gov.br e a oportunidades públicas",
      ]}
      sections={[
        {
          heading: "MEI pode participar de licitações?",
          paragraphs: [
            "Pode, sim. O Microempreendedor Individual é equiparado às microempresas para fins de licitação e tem direito a benefícios como prioridade de contratação em caso de empate e prazos especiais para regularização fiscal.",
            "O que muitos MEIs precisam é justamente do cadastro SICAF para se tornarem visíveis e aptos a vender ao governo.",
          ],
        },
        {
          heading: "Vantagens do MEI nas compras públicas",
          bullets: [
            "Direito de preferência em situações de empate",
            "Licitações e cotas exclusivas para ME, EPP e MEI",
            "Prazo diferenciado para regularização de documentos",
            "Concorrência muitas vezes menor em contratos de menor valor",
          ],
        },
        {
          heading: "Documentos do MEI para o SICAF",
          bullets: [
            "Certificado da Condição de Microempreendedor Individual (CCMEI)",
            "Cartão CNPJ e dados de contato atualizados",
            "Certidões de regularidade fiscal e trabalhista",
            "Dados bancários do microempreendedor",
          ],
        },
        {
          heading: "Como a CADBRASIL ajuda o MEI",
          paragraphs: [
            "Cuidamos de todo o processo de credenciamento do seu MEI no SICAF, orientando sobre a documentação e mantendo o cadastro regular para que você foque no seu negócio enquanto disputa novas oportunidades.",
          ],
        },
      ]}
      faqs={[
        {
          q: "MEI precisa de contador para se cadastrar no SICAF?",
          a: "Não é obrigatório. O cadastro pode ser feito com a documentação do MEI, e a CADBRASIL orienta cada etapa do processo.",
        },
        {
          q: "Qual o limite de faturamento do MEI em licitações?",
          a: "O MEI deve respeitar o limite anual de faturamento da categoria. Contratos públicos contam para esse teto, então é importante planejar a participação.",
        },
        {
          q: "Quanto custa para o MEI participar de licitações?",
          a: "Participar de licitações em si não tem custo de inscrição. Há apenas a necessidade de manter o cadastro e a documentação regulares.",
        },
      ]}
      ctaTitle="É MEI e quer vender para o governo?"
      ctaText="Faça agora o cadastro SICAF do seu MEI e comece a participar de licitações públicas com apoio especializado."
      ctaLabel="Cadastrar meu MEI"
    />
  );
}
