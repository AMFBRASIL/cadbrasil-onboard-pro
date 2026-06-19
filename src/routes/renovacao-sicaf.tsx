import { createFileRoute } from "@tanstack/react-router";
import { SicafLanding, faqJsonLd, type SicafFaq } from "@/components/seo/SicafLanding";

const URL = "https://cadbrasil-onboard-pro.lovable.app/renovacao-sicaf";

const faq: SicafFaq[] = [
  {
    q: "Com que frequência o SICAF precisa ser renovado?",
    a: "O cadastro SICAF deve ser renovado anualmente, mas as certidões negativas que o compõem possuem validades menores (30, 90 ou 180 dias). A renovação efetiva acontece sempre que uma certidão vence.",
  },
  {
    q: "O que acontece se eu não renovar o SICAF?",
    a: "Sua empresa fica impedida de participar de novos pregões eletrônicos e de assinar contratos com a administração pública. Pregões em andamento podem ser perdidos por irregularidade cadastral.",
  },
  {
    q: "Quanto tempo leva a renovação SICAF?",
    a: "Com a CADBRASIL, a renovação completa é feita em até 24 horas úteis, desde que as certidões estejam disponíveis para emissão.",
  },
  {
    q: "Posso renovar o SICAF com pendências fiscais?",
    a: "Não. Pendências em certidões fiscais, trabalhistas ou de FGTS impedem a renovação. A CADBRASIL oferece serviço de regularização prévia para destravar o cadastro.",
  },
  {
    q: "Quanto custa renovar o SICAF pela CADBRASIL?",
    a: "Oferecemos planos de renovação anual com acompanhamento contínuo das certidões, alertando sua empresa antes do vencimento.",
  },
];

export const Route = createFileRoute("/renovacao-sicaf")({
  head: () => ({
    meta: [
      { title: "Renovação SICAF Online — Atualize seu Cadastro em 24h | CADBRASIL" },
      { name: "description", content: "Renove seu SICAF rapidamente e mantenha sua empresa apta a participar de licitações. Renovação assistida pela CADBRASIL em até 24 horas." },
      { name: "keywords", content: "renovação sicaf, atualizar sicaf, sicaf vencido, certidões sicaf, renovar cadastro fornecedor" },
      { property: "og:title", content: "Renovação SICAF em 24h — CADBRASIL" },
      { property: "og:description", content: "Mantenha sua empresa apta a licitar. Renovação SICAF assistida e sem dor de cabeça." },
      { property: "og:url", content: URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: URL }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(faqJsonLd(faq)) }],
  }),
  component: () => (
    <SicafLanding
      h1="Renovação SICAF: mantenha sua empresa habilitada para licitar sem interrupção"
      subtitle="Atualizamos seu cadastro e suas certidões em até 24 horas, evitando perda de pregões por documentação vencida."
      intro={[
        "O SICAF não é um cadastro estático: certidões de FGTS, regularidade federal, estadual, municipal e trabalhista vencem em períodos diferentes ao longo do ano. Qualquer uma dessas certidões vencida deixa sua empresa irregular e impedida de participar de licitações.",
        "A CADBRASIL monitora todas as certidões da sua empresa e executa a renovação sempre que necessário, garantindo continuidade total da sua habilitação para vender ao governo.",
      ]}
      benefits={[
        { icon: "clock", title: "Renovação em até 24 horas", desc: "Atualizamos seu SICAF rapidamente para você não perder nenhum pregão." },
        { icon: "shield", title: "Monitoramento contínuo", desc: "Avisamos com antecedência sobre vencimento de cada certidão." },
        { icon: "check", title: "Sem retrabalho", desc: "Nossa equipe cuida da coleta, atualização e validação documental completa." },
        { icon: "building", title: "Continuidade nos contratos", desc: "Mantenha contratos públicos ativos sem risco de suspensão por irregularidade." },
      ]}
      steps={[
        { title: "Diagnóstico do cadastro atual", desc: "Verificamos a situação do seu SICAF e identificamos o que precisa ser atualizado." },
        { title: "Emissão das certidões", desc: "Coletamos e validamos todas as certidões negativas necessárias." },
        { title: "Atualização no portal", desc: "Registramos as atualizações no portal SICAF/Comprasnet." },
        { title: "Confirmação e relatório", desc: "Você recebe a confirmação da renovação e o relatório com as próximas datas de vencimento." },
      ]}
      forWho={[
        "Empresas com SICAF próximo ao vencimento",
        "Fornecedores recorrentes do governo que não querem perder pregões",
        "Empresas que assinaram contratos administrativos de longa duração",
        "Empresas com certidões fiscais vencendo",
        "ME, EPP e MEI que participam de cotas exclusivas em licitações",
        "Empresas que tiveram o cadastro suspenso por irregularidade",
      ]}
      faq={faq}
      ctaTitle="Renove seu SICAF com a CADBRASIL"
    />
  ),
});
