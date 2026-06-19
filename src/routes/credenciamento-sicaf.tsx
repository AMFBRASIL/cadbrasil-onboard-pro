import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/credenciamento-sicaf";
const TITLE = "Credenciamento SICAF: como cadastrar sua empresa para licitações";
const DESCRIPTION =
  "Saiba como fazer o credenciamento SICAF passo a passo e habilitar sua empresa para vender ao governo. Processo assistido pela CADBRASIL, rápido e seguro.";

export const Route = createFileRoute("/credenciamento-sicaf")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "credenciamento SICAF, como se cadastrar no SICAF, cadastro fornecedor governo, habilitação SICAF, Compras.gov.br, licitações públicas, credenciar empresa licitação",
    }),
  component: CredenciamentoSicaf,
});

function CredenciamentoSicaf() {
  return (
    <SeoLanding
      path={PATH}
      eyebrow="Credenciamento SICAF"
      title="Credenciamento SICAF para vender ao governo"
      subtitle="Habilite sua empresa no Sistema de Cadastramento Unificado de Fornecedores e participe de licitações em todo o Brasil com apoio especializado."
      description={DESCRIPTION}
      lead="O credenciamento no SICAF (Sistema de Cadastramento Unificado de Fornecedores) é o primeiro passo para que qualquer empresa possa fornecer produtos e serviços para órgãos públicos federais, estaduais e municipais. Com o cadastro ativo, sua empresa fica apta a participar de pregões e licitações no Compras.gov.br e em diversos portais públicos."
      highlights={[
        "Habilitação válida para licitações em todo o território nacional",
        "Acesso ao Compras.gov.br e a milhares de oportunidades públicas",
        "Processo assistido do início ao fim, sem burocracia",
        "Acompanhamento da documentação e dos níveis do SICAF",
      ]}
      sections={[
        {
          heading: "O que é o SICAF?",
          paragraphs: [
            "O SICAF é o cadastro oficial do Governo Federal que reúne, em um único sistema, as informações de fornecedores interessados em contratar com a Administração Pública. Ele substitui a apresentação repetida de documentos a cada licitação, centralizando a habilitação da empresa.",
            "Estar credenciado e com os níveis em dia agiliza a participação em pregões eletrônicos e demonstra que a empresa está regular perante os órgãos de fiscalização.",
          ],
        },
        {
          heading: "Quem pode se credenciar no SICAF",
          bullets: [
            "Microempreendedores Individuais (MEI)",
            "Microempresas (ME) e Empresas de Pequeno Porte (EPP)",
            "Empresas de médio e grande porte (Pessoa Jurídica)",
            "Pessoas físicas em situações específicas previstas em edital",
          ],
        },
        {
          heading: "Documentos normalmente exigidos",
          bullets: [
            "Cartão CNPJ e contrato social ou requerimento de empresário",
            "Certidões de regularidade fiscal federal, estadual e municipal",
            "Certidão de regularidade com o FGTS e a Justiça do Trabalho",
            "Dados bancários e informações dos sócios e responsáveis",
          ],
        },
        {
          heading: "Como a CADBRASIL conduz o seu credenciamento",
          paragraphs: [
            "Nossa equipe organiza a documentação, orienta sobre os níveis do SICAF e acompanha cada etapa até a empresa ficar apta a participar de licitações. Você informa os dados, nós cuidamos do processo e mantemos você atualizado a cada avanço.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Quanto tempo leva o credenciamento no SICAF?",
          a: "Com a documentação correta, o credenciamento costuma ser concluído em poucos dias úteis. Prazos podem variar conforme a regularidade fiscal da empresa.",
        },
        {
          q: "O credenciamento no SICAF tem validade?",
          a: "Sim. As certidões vinculadas aos níveis do SICAF têm prazos de validade e precisam ser renovadas periodicamente para que a empresa permaneça apta.",
        },
        {
          q: "Preciso de certificado digital para o SICAF?",
          a: "O acesso ao Compras.gov.br é feito com login Gov.br, e o certificado digital pode ser necessário para determinadas operações. Nossa equipe orienta o melhor caminho para o seu caso.",
        },
      ]}
      ctaTitle="Pronto para se credenciar no SICAF?"
      ctaText="Inicie agora o credenciamento assistido e deixe sua empresa apta a participar de licitações públicas em todo o Brasil."
      ctaLabel="Iniciar credenciamento"
    />
  );
}
