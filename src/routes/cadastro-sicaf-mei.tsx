import { createFileRoute } from "@tanstack/react-router";
import { SicafLanding, faqJsonLd, type SicafFaq } from "@/components/seo/SicafLanding";

const URL = "https://cadbrasil-onboard-pro.lovable.app/cadastro-sicaf-mei";

const faq: SicafFaq[] = [
  {
    q: "MEI pode participar de licitações públicas?",
    a: "Sim. O Microempreendedor Individual pode participar de licitações e possui benefícios garantidos pela Lei Complementar 123/2006, como cota exclusiva de até 25% em compras públicas e preferência em empate ficto.",
  },
  {
    q: "MEI precisa se cadastrar no SICAF?",
    a: "Sim. Para vender ao governo federal, o MEI precisa estar credenciado no SICAF, mesmo que utilize a nota fiscal avulsa ou emita NF-e como MEI.",
  },
  {
    q: "Quais documentos o MEI precisa para o SICAF?",
    a: "CCMEI (Certificado da Condição de MEI), CNPJ, CPF do titular, certidão de regularidade do Simples Nacional, certidão negativa de débitos federais, FGTS e certidão trabalhista.",
  },
  {
    q: "Quanto fatura um MEI vendendo para o governo?",
    a: "O MEI segue o limite de faturamento de R$ 81.000 por ano. Vendas para o governo entram nesse limite. Caso ultrapasse, é recomendado migrar para Microempresa (ME) para continuar atendendo contratos públicos.",
  },
  {
    q: "Quanto tempo leva o cadastro SICAF para MEI?",
    a: "Com a CADBRASIL, o cadastro completo de um MEI no SICAF é finalizado em até 24 horas úteis.",
  },
];

export const Route = createFileRoute("/cadastro-sicaf-mei")({
  head: () => ({
    meta: [
      { title: "Cadastro SICAF para MEI — Venda para o Governo em 24h | CADBRASIL" },
      { name: "description", content: "MEI também vende para o governo. Cadastro SICAF assistido para Microempreendedores Individuais em até 24 horas pela CADBRASIL." },
      { name: "keywords", content: "sicaf mei, mei licitação, microempreendedor individual licitação, sicaf microempreendedor, cota mei governo" },
      { property: "og:title", content: "SICAF para MEI — Cadastro em 24h | CADBRASIL" },
      { property: "og:description", content: "MEI vende para o governo. Cadastre-se no SICAF com a CADBRASIL." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(faq)) }],
  }),
  component: () => (
    <SicafLanding
      h1="Cadastro SICAF para MEI: venda para o governo e aproveite a cota exclusiva de 25%"
      subtitle="O Microempreendedor Individual também pode lucrar com licitações públicas. Habilite seu CNPJ MEI no SICAF em até 24 horas."
      intro={[
        "A Lei Complementar 123/2006 garante a Microempreendedores Individuais, ME e EPP uma cota exclusiva de até 25% das compras governamentais. Isso significa que, em muitos pregões, somente empresas desse porte podem participar — uma oportunidade enorme para quem está formalizado como MEI.",
        "A CADBRASIL faz todo o cadastro do seu MEI no SICAF: organização dos documentos, emissão de certidões, preenchimento no Comprasnet e validação dos níveis do sistema. Tudo de forma simples, sem burocracia.",
      ]}
      benefits={[
        { icon: "check", title: "Cota exclusiva de 25%", desc: "Concorra em licitações destinadas apenas a ME, EPP e MEI." },
        { icon: "clock", title: "Cadastro em 24 horas", desc: "Rapidez para você começar a vender ao governo sem esperar semanas." },
        { icon: "shield", title: "Suporte total ao MEI", desc: "Orientação sobre limites de faturamento, emissão de NF-e e cumprimento de contratos." },
        { icon: "building", title: "Acesso a milhares de pregões", desc: "Participe de licitações de prefeituras, estados e órgãos federais." },
      ]}
      steps={[
        { title: "Envio do CCMEI e documentos", desc: "Você envia CCMEI, CPF, comprovante de endereço e dados bancários." },
        { title: "Coleta de certidões", desc: "Emitimos certidões negativas exigidas pelo SICAF em nome do MEI." },
        { title: "Cadastro no Comprasnet", desc: "Realizamos o cadastro completo no portal SICAF para o seu CNPJ MEI." },
        { title: "Orientação inicial", desc: "Você recebe um guia para encontrar e participar dos primeiros pregões." },
      ]}
      forWho={[
        "MEIs que querem vender produtos ou serviços para órgãos públicos",
        "Profissionais autônomos formalizados como MEI",
        "Prestadores de serviço (TI, manutenção, transporte, alimentação) com CNPJ MEI",
        "Pequenos comércios que desejam fornecer materiais para prefeituras e escolas",
        "MEIs que querem migrar para vendas recorrentes ao governo",
        "Empreendedores buscando aproveitar a cota exclusiva ME/EPP/MEI",
      ]}
      faq={faq}
      ctaTitle="Cadastre seu MEI no SICAF agora"
    />
  ),
});
