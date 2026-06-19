import { createFileRoute } from "@tanstack/react-router";
import { SicafLanding, faqJsonLd, type SicafFaq } from "@/components/seo/SicafLanding";

const URL = "https://cadbrasil-onboard-pro.lovable.app/credenciamento-sicaf";

const faq: SicafFaq[] = [
  {
    q: "O que é o credenciamento SICAF?",
    a: "O SICAF (Sistema de Cadastramento Unificado de Fornecedores) é o registro nacional obrigatório para empresas que desejam participar de licitações públicas federais, estaduais e municipais. Com o credenciamento ativo, sua empresa fica habilitada a vender para qualquer órgão público no Brasil.",
  },
  {
    q: "Quanto tempo leva o credenciamento SICAF?",
    a: "Com a CADBRASIL, o processo completo é concluído em até 48 horas úteis, desde o envio da documentação até a homologação no portal Comprasnet.",
  },
  {
    q: "Quais documentos preciso para o credenciamento?",
    a: "Documentos básicos da empresa (CNPJ, contrato social), certidões negativas federais, estaduais e municipais, certidão de FGTS, certidão trabalhista e dados bancários. Nossa equipe orienta a obtenção de todos os documentos.",
  },
  {
    q: "MEI pode se credenciar no SICAF?",
    a: "Sim. Microempreendedores Individuais podem e devem se credenciar no SICAF para participar de licitações destinadas a ME/EPP, que possuem cota exclusiva de 25% em compras públicas.",
  },
  {
    q: "Quanto custa o credenciamento SICAF?",
    a: "O credenciamento no portal SICAF é gratuito. A CADBRASIL cobra apenas pelo serviço assistido de organização documental, preenchimento e acompanhamento, com planos a partir de valores acessíveis.",
  },
];

export const Route = createFileRoute("/credenciamento-sicaf")({
  head: () => ({
    meta: [
      { title: "Credenciamento SICAF Online — Cadastro Completo em 48h | CADBRASIL" },
      { name: "description", content: "Credenciamento SICAF assistido em até 48 horas. Habilite sua empresa para licitações públicas federais, estaduais e municipais com a CADBRASIL." },
      { name: "keywords", content: "credenciamento sicaf, cadastro sicaf, sicaf online, comprasnet, licitação pública, fornecedor governo" },
      { property: "og:title", content: "Credenciamento SICAF Online em 48h — CADBRASIL" },
      { property: "og:description", content: "Habilite sua empresa para vender ao governo. Credenciamento SICAF assistido pela CADBRASIL." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(faq)) }],
  }),
  component: () => (
    <SicafLanding
      h1="Credenciamento SICAF: habilite sua empresa para licitações em até 48h"
      subtitle="Conduzimos todo o processo de cadastro no Sistema de Cadastramento Unificado de Fornecedores, com suporte especializado do início à homologação."
      intro={[
        "O credenciamento SICAF é o primeiro passo para qualquer empresa que deseja vender produtos ou serviços para órgãos públicos no Brasil. Sem ele, sua empresa não pode participar de pregões eletrônicos no portal Comprasnet nem assinar contratos com a administração pública federal.",
        "A CADBRASIL é especialista em credenciamento de fornecedores e acompanha todo o processo: análise documental, regularização de pendências, cadastro no portal e validação dos níveis I a VI do SICAF.",
      ]}
      benefits={[
        { icon: "clock", title: "Conclusão em 48 horas úteis", desc: "Equipe dedicada para concluir seu credenciamento de forma rápida e sem retrabalho." },
        { icon: "shield", title: "100% conforme as exigências legais", desc: "Atendimento à Lei 14.133/21 e à Instrução Normativa SLTI/MP nº 03/2018." },
        { icon: "check", title: "Validação dos 6 níveis SICAF", desc: "Credenciamento, habilitação jurídica, regularidade fiscal, qualificação econômica e mais." },
        { icon: "building", title: "Acesso a milhares de licitações", desc: "Habilitação para vender a órgãos federais, estaduais e municipais em todo o país." },
      ]}
      steps={[
        { title: "Envio de documentos", desc: "Você envia os documentos da empresa pelo nosso formulário seguro." },
        { title: "Análise e regularização", desc: "Nossa equipe revisa a documentação e indica eventuais pendências." },
        { title: "Cadastro no portal SICAF", desc: "Realizamos o cadastro completo no portal Comprasnet em nome da sua empresa." },
        { title: "Homologação e entrega", desc: "Você recebe o certificado SICAF homologado e instruções para participar de licitações." },
      ]}
      forWho={[
        "Empresas que desejam vender para o governo federal, estadual ou municipal",
        "Indústrias, distribuidoras e prestadores de serviço",
        "MEI, ME e EPP que querem aproveitar cotas exclusivas em licitações",
        "Empresas com SICAF vencido ou com pendências documentais",
        "Profissionais autônomos formalizados (pessoa jurídica)",
        "Cooperativas e associações habilitadas a contratar com a administração pública",
      ]}
      faq={faq}
      ctaTitle="Solicite seu credenciamento SICAF agora"
    />
  ),
});
