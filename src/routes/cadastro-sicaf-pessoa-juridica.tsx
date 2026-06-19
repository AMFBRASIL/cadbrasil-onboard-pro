import { createFileRoute } from "@tanstack/react-router";
import { SicafLanding, faqJsonLd, type SicafFaq } from "@/components/seo/SicafLanding";

const URL = "https://cadbrasil-onboard-pro.lovable.app/cadastro-sicaf-pessoa-juridica";

const faq: SicafFaq[] = [
  {
    q: "Toda Pessoa Jurídica pode se cadastrar no SICAF?",
    a: "Sim. Qualquer Pessoa Jurídica regularmente constituída (ME, EPP, LTDA, EIRELI, S/A, Cooperativas, Associações) pode se credenciar no SICAF para participar de licitações públicas.",
  },
  {
    q: "Quais documentos a PJ precisa apresentar?",
    a: "Contrato social ou estatuto consolidado, CNPJ, RG/CPF dos sócios, certidões negativas (federal, estadual, municipal, FGTS, trabalhista), balanço patrimonial do último exercício e dados bancários da empresa.",
  },
  {
    q: "É obrigatório ter balanço patrimonial?",
    a: "Para os níveis IV (qualificação econômico-financeira) e V (qualificação técnica) do SICAF, sim. Empresas optantes pelo Simples Nacional podem apresentar DEFIS ou declarações simplificadas conforme o caso.",
  },
  {
    q: "Quanto tempo leva o cadastro SICAF para PJ?",
    a: "O cadastro completo de Pessoa Jurídica no SICAF, com todos os níveis, leva de 48 a 72 horas úteis quando feito com a CADBRASIL.",
  },
  {
    q: "Empresa nova (sem balanço) pode se cadastrar?",
    a: "Sim. Empresas constituídas no exercício corrente podem se cadastrar nos níveis I, II e III do SICAF e participar de licitações que não exijam comprovação de qualificação econômica avançada.",
  },
];

export const Route = createFileRoute("/cadastro-sicaf-pessoa-juridica")({
  head: () => ({
    meta: [
      { title: "Cadastro SICAF Pessoa Jurídica — Habilite sua Empresa | CADBRASIL" },
      { name: "description", content: "Cadastro SICAF completo para Pessoa Jurídica: ME, EPP, LTDA, S/A. Habilitação para licitações federais em até 72 horas com a CADBRASIL." },
      { name: "keywords", content: "sicaf pessoa juridica, sicaf pj, cadastro sicaf empresa, sicaf ltda, sicaf eireli, licitação pessoa juridica" },
      { property: "og:title", content: "Cadastro SICAF para Pessoa Jurídica — CADBRASIL" },
      { property: "og:description", content: "Habilite sua PJ para licitações públicas em todo o Brasil." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(faq)) }],
  }),
  component: () => (
    <SicafLanding
      h1="Cadastro SICAF Pessoa Jurídica: habilite sua empresa para vender ao governo"
      subtitle="Cadastro completo de PJ no SICAF — todos os níveis, todas as certidões, com suporte especializado da CADBRASIL."
      intro={[
        "O cadastro SICAF para Pessoa Jurídica é mais do que um simples preenchimento de formulário. Envolve análise contábil, validação de certidões, comprovação de qualificação econômico-financeira e técnica, e o cumprimento de exigências específicas da Lei 14.133/21 e da IN SLTI/MP 03/2018.",
        "A CADBRASIL atende empresas de todos os portes — de Microempresas a Sociedades Anônimas — com um processo padronizado, ágil e auditável, garantindo que sua PJ esteja habilitada nos seis níveis do SICAF.",
      ]}
      benefits={[
        { icon: "building", title: "Atendimento a todos os portes", desc: "ME, EPP, LTDA, EIRELI, S/A, Cooperativas e Associações." },
        { icon: "shield", title: "Habilitação nos 6 níveis SICAF", desc: "Credenciamento, jurídico, fiscal, econômico, técnico e trabalhista." },
        { icon: "clock", title: "Cadastro em até 72h", desc: "Processo otimizado para empresas que precisam licitar com urgência." },
        { icon: "check", title: "Suporte contábil incluso", desc: "Apoio na apresentação de balanço, índices contábeis e qualificação técnica." },
      ]}
      steps={[
        { title: "Diagnóstico documental", desc: "Avaliamos contrato social, certidões e demonstrações contábeis da empresa." },
        { title: "Regularização de pendências", desc: "Indicamos e ajudamos a resolver pendências fiscais, contábeis ou cadastrais." },
        { title: "Cadastro completo no SICAF", desc: "Realizamos o cadastro nos seis níveis do sistema, incluindo o econômico-financeiro." },
        { title: "Homologação e entrega", desc: "Entregamos o certificado SICAF e treinamos sua equipe para encontrar oportunidades." },
      ]}
      forWho={[
        "Microempresas (ME) e Empresas de Pequeno Porte (EPP)",
        "Sociedades Limitadas (LTDA) e EIRELI",
        "Sociedades Anônimas (S/A) e empresas de capital aberto",
        "Indústrias, distribuidoras e atacadistas",
        "Prestadoras de serviço, consultorias e empresas de tecnologia",
        "Cooperativas, associações e organizações habilitadas a contratar com o setor público",
      ]}
      faq={faq}
      ctaTitle="Cadastre sua Pessoa Jurídica no SICAF"
    />
  ),
});
