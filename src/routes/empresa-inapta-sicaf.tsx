import { createFileRoute } from "@tanstack/react-router";
import { SicafLanding, faqJsonLd, type SicafFaq } from "@/components/seo/SicafLanding";

const URL = "https://cadbrasil-onboard-pro.lovable.app/empresa-inapta-sicaf";

const faq: SicafFaq[] = [
  {
    q: "O que significa empresa inapta no SICAF?",
    a: "Empresa inapta é aquela cujo cadastro foi suspenso por irregularidade fiscal, omissão de declarações obrigatórias, certidões vencidas ou outras pendências legais. Nessa situação, a empresa fica impedida de participar de licitações e contratar com o poder público.",
  },
  {
    q: "Como saber se minha empresa está inapta no SICAF?",
    a: "Você pode consultar gratuitamente no portal Comprasnet (consulta SICAF) ou enviar o CNPJ para a CADBRASIL fazer o diagnóstico completo da situação cadastral.",
  },
  {
    q: "É possível regularizar uma empresa inapta?",
    a: "Sim. A regularização envolve identificar a causa da inaptidão (fiscal, documental ou cadastral), corrigir a pendência junto ao órgão competente (Receita Federal, FGTS, INSS, etc.) e atualizar o cadastro no SICAF.",
  },
  {
    q: "Quanto tempo leva para regularizar uma empresa inapta?",
    a: "Depende da causa da inaptidão. Pendências cadastrais simples são resolvidas em 24 a 72 horas. Pendências fiscais complexas, como parcelamentos ou retificações de declaração, podem levar de 7 a 30 dias.",
  },
  {
    q: "Posso participar de licitações enquanto regularizo?",
    a: "Não. Empresas inaptas são automaticamente inabilitadas em qualquer certame. A CADBRASIL prioriza a regularização para você voltar a competir o quanto antes.",
  },
];

export const Route = createFileRoute("/empresa-inapta-sicaf")({
  head: () => ({
    meta: [
      { title: "Empresa Inapta no SICAF — Regularização Especializada | CADBRASIL" },
      { name: "description", content: "Empresa inapta no SICAF? Regularize sua situação cadastral e volte a participar de licitações públicas com a CADBRASIL." },
      { name: "keywords", content: "empresa inapta sicaf, regularizar sicaf, cnpj inapto, regularização fiscal, sicaf suspenso, baixa inaptidão" },
      { property: "og:title", content: "Regularize sua Empresa Inapta no SICAF — CADBRASIL" },
      { property: "og:description", content: "Diagnóstico e regularização completa para empresas inaptas no SICAF." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(faq)) }],
  }),
  component: () => (
    <SicafLanding
      h1="Empresa inapta no SICAF? Regularize agora e volte a participar de licitações"
      subtitle="Diagnóstico completo, regularização documental e fiscal e reabilitação do seu cadastro SICAF com acompanhamento especializado."
      intro={[
        "A condição de inapta no SICAF impede sua empresa de participar de pregões, assinar contratos e receber pagamentos de órgãos públicos. A causa pode ser fiscal (declarações omitidas, débitos com a União, FGTS ou INSS), documental (certidões vencidas) ou cadastral (dados desatualizados).",
        "A CADBRASIL diagnostica a origem da inaptidão, organiza a regularização junto aos órgãos competentes e reativa seu cadastro no SICAF, devolvendo sua empresa ao mercado de compras públicas.",
      ]}
      benefits={[
        { icon: "shield", title: "Diagnóstico técnico gratuito", desc: "Identificamos a causa exata da inaptidão antes de qualquer cobrança." },
        { icon: "check", title: "Regularização completa", desc: "Cuidamos de pendências fiscais, documentais e cadastrais em um único processo." },
        { icon: "clock", title: "Reabilitação ágil", desc: "Em até 72 horas após a regularização, sua empresa volta a estar apta a licitar." },
        { icon: "building", title: "Suporte com Receita e órgãos", desc: "Equipe experiente em DCTF, ECF, parcelamentos e baixa de pendências." },
      ]}
      steps={[
        { title: "Consulta da situação cadastral", desc: "Verificamos no SICAF, Receita Federal e demais órgãos qual o motivo da inaptidão." },
        { title: "Plano de regularização", desc: "Apresentamos um plano com prazos e custos para cada pendência identificada." },
        { title: "Execução da regularização", desc: "Atuamos junto aos órgãos para baixar débitos, retificar declarações e renovar certidões." },
        { title: "Reativação do SICAF", desc: "Atualizamos seu cadastro no portal e confirmamos a reabilitação para licitações." },
      ]}
      forWho={[
        "Empresas com CNPJ marcado como inapto na Receita Federal",
        "Fornecedores suspensos por irregularidade fiscal",
        "Empresas com débitos de FGTS, INSS ou Receita Federal",
        "Empresas que deixaram de entregar DCTF, ECF ou DEFIS",
        "Empresas com certidões vencidas há mais de 90 dias",
        "Empresas que querem voltar a participar de licitações públicas",
      ]}
      faq={faq}
      ctaTitle="Solicite o diagnóstico da sua empresa"
    />
  ),
});
