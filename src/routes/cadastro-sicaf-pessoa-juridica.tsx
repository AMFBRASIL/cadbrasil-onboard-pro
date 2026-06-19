import { createFileRoute } from "@tanstack/react-router";

import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildSeoHead } from "@/lib/seo";

const PATH = "/cadastro-sicaf-pessoa-juridica";
const TITLE = "Cadastro SICAF Pessoa Jurídica: habilite sua empresa para licitar";
const DESCRIPTION =
  "Cadastro SICAF para Pessoa Jurídica (ME, EPP e grande porte). Habilite seu CNPJ para vender ao governo e participar de licitações com a CADBRASIL.";

export const Route = createFileRoute("/cadastro-sicaf-pessoa-juridica")({
  head: () =>
    buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "cadastro SICAF pessoa jurídica, SICAF CNPJ, empresa licitação, habilitar empresa SICAF, ME EPP licitação, pessoa jurídica compras públicas, fornecedor governo PJ",
    }),
  component: CadastroSicafPj,
});

function CadastroSicafPj() {
  return (
    <SeoLanding
      path={PATH}
      eyebrow="Cadastro SICAF Pessoa Jurídica"
      title="Cadastro SICAF para Pessoa Jurídica"
      subtitle="Habilite o CNPJ da sua empresa no SICAF e participe de licitações públicas em todo o Brasil, com acompanhamento de especialistas."
      description={DESCRIPTION}
      lead="Empresas de todos os portes — microempresas, empresas de pequeno porte e companhias de médio e grande porte — precisam do cadastro no SICAF para fornecer ao setor público. O credenciamento da Pessoa Jurídica reúne a documentação do CNPJ e dos sócios e habilita a empresa a disputar contratos no Compras.gov.br e em outros portais."
      highlights={[
        "Habilitação válida para licitações federais, estaduais e municipais",
        "Atende ME, EPP e empresas de médio e grande porte",
        "Organização completa da documentação do CNPJ",
        "Suporte humano em todas as etapas do credenciamento",
      ]}
      sections={[
        {
          heading: "Por que a Pessoa Jurídica precisa do SICAF",
          paragraphs: [
            "O SICAF centraliza a habilitação da empresa, evitando a entrega repetida de documentos a cada licitação. Com o cadastro ativo e os níveis em dia, a Pessoa Jurídica ganha agilidade e credibilidade para contratar com a Administração Pública.",
          ],
        },
        {
          heading: "Níveis do SICAF para Pessoa Jurídica",
          bullets: [
            "Nível I — Credenciamento (dados básicos da empresa)",
            "Nível II — Habilitação jurídica",
            "Nível III — Regularidade fiscal e trabalhista federal",
            "Nível IV — Regularidade fiscal estadual e municipal",
            "Níveis complementares conforme a atividade e o edital",
          ],
        },
        {
          heading: "Documentos da empresa para o cadastro",
          bullets: [
            "Cartão CNPJ e contrato social ou estatuto atualizado",
            "Documentos dos sócios e do responsável legal",
            "Certidões de regularidade fiscal, trabalhista e FGTS",
            "Dados bancários e informações de contato da empresa",
          ],
        },
        {
          heading: "Credenciamento assistido pela CADBRASIL",
          paragraphs: [
            "Conduzimos todo o processo: organizamos a documentação, configuramos os níveis do SICAF e acompanhamos a habilitação até sua empresa estar pronta para licitar. Você informa os dados e nós cuidamos da burocracia.",
          ],
        },
      ]}
      faqs={[
        {
          q: "Toda empresa precisa do SICAF para licitar?",
          a: "Para a maioria das licitações federais o SICAF é exigido ou fortemente recomendado, pois centraliza a habilitação. Alguns editais aceitam documentação avulsa, mas o SICAF facilita a participação.",
        },
        {
          q: "Empresa de grande porte também usa o SICAF?",
          a: "Sim. O SICAF atende empresas de todos os portes, da microempresa às de grande porte, com os níveis ajustados à habilitação exigida.",
        },
        {
          q: "Quais níveis do SICAF minha empresa precisa ter?",
          a: "Depende do tipo de contratação. O ideal é manter os níveis de habilitação jurídica e regularidade fiscal completos. Nossa equipe orienta conforme o seu objetivo.",
        },
      ]}
      ctaTitle="Habilite sua empresa para licitar"
      ctaText="Faça o cadastro SICAF da sua Pessoa Jurídica e comece a participar de licitações públicas com apoio especializado."
      ctaLabel="Cadastrar minha empresa"
    />
  );
}
