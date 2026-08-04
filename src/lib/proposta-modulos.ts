/** Módulos da proposta comercial CADBRASIL (valores anuais em R$). */

export const PROPOSTA_BASE_ANUAL = 985.5;

export type PropostaModulo = {
  id: string;
  nome: string;
  precoAnual: number;
  /** Incluído no pacote padrão (não removível). */
  inclusoBase: boolean;
  resumo: string;
  detalhes: string[];
  beneficios: string[];
};

/** Pacote padrão: SICAF + Gestor de certidões + Gestor de editais = R$ 985,50/ano */
export const PROPOSTA_MODULOS_BASE: PropostaModulo[] = [
  {
    id: "sicaf",
    nome: "SICAF gratuito",
    precoAnual: 0,
    inclusoBase: true,
    resumo:
      "Credenciamento assistido no Sistema de Cadastramento Unificado de Fornecedores, sem taxa extra no pacote.",
    detalhes: [
      "Orientação completa para habilitação nos níveis do SICAF.",
      "Protocolo e acompanhamento documental pela equipe CADBRASIL.",
      "Regularização e manutenção cadastral durante a vigência anual.",
    ],
    beneficios: [
      "Acesso ao Compras.gov.br e PNCP",
      "Assessoria humana no processo",
      "Incluso no pacote de R$ 985,50/ano",
    ],
  },
  {
    id: "gestor_certidoes",
    nome: "Gestor de certidões",
    precoAnual: 0,
    inclusoBase: true,
    resumo:
      "Monitoramento e organização das certidões necessárias para manter sua empresa apta a licitar.",
    detalhes: [
      "Controle de vencimentos de certidões federais, estaduais e municipais.",
      "Alertas para renovação antes do prazo crítico.",
      "Centralização dos documentos no portal do fornecedor.",
    ],
    beneficios: [
      "Menos risco de inabilitação",
      "Alertas de vencimento",
      "Incluso no pacote de R$ 985,50/ano",
    ],
  },
  {
    id: "gestor_editais",
    nome: "Gestor de editais",
    precoAnual: 0,
    inclusoBase: true,
    resumo:
      "Curadoria e acompanhamento de editais compatíveis com o perfil da sua empresa.",
    detalhes: [
      "Filtro de oportunidades por CNAE, região e porte.",
      "Acompanhamento de prazos e status dos editais de interesse.",
      "Envio organizado para você decidir onde participar.",
    ],
    beneficios: [
      "Editais alinhados ao seu perfil",
      "Visão clara de prazos",
      "Incluso no pacote de R$ 985,50/ano",
    ],
  },
];

/** Módulos opcionais — somam ao valor anual do pacote base. */
export const PROPOSTA_MODULOS_OPCIONAIS: PropostaModulo[] = [
  {
    id: "leitor_licitacoes",
    nome: "Leitor de licitações",
    precoAnual: 1150,
    inclusoBase: false,
    resumo:
      "Varredura contínua de portais públicos para encontrar licitações alinhadas ao seu negócio — sem você precisar caçar edital manualmente.",
    detalhes: [
      "Varre Compras.gov.br, PNCP e portais estaduais/municipais relevantes.",
      "Cruza o perfil da empresa (CNAE, região, porte) com novos editais publicados.",
      "Entrega oportunidades priorizadas para análise e decisão rápida.",
      "Reduz horas de busca manual e o risco de perder janelas de prazo.",
    ],
    beneficios: [
      "Mais oportunidades no radar",
      "Menos tempo perdido em busca",
      "Priorização por aderência",
    ],
  },
  {
    id: "leitura_edital_ia",
    nome: "Leitura de edital com IA",
    precoAnual: 250,
    inclusoBase: false,
    resumo:
      "A inteligência artificial lê o edital e destaca obrigações, documentos, prazos e pontos de atenção em linguagem clara.",
    detalhes: [
      "Resumo executivo do objeto, modalidade e valores.",
      "Lista de documentos e exigências de habilitação.",
      "Alertas sobre cláusulas críticas, restrições e prazos.",
      "Economiza horas de leitura técnica em cada oportunidade.",
    ],
    beneficios: [
      "Entenda o edital em minutos",
      "Menos erro de interpretação",
      "Foco no que importa para decidir",
    ],
  },
  {
    id: "gestao_contratos",
    nome: "Gestão de contratos das licitações",
    precoAnual: 200,
    inclusoBase: false,
    resumo:
      "Organize contratos firmados após as licitações: vigência, renovações, entregas e obrigações contratuais.",
    detalhes: [
      "Painel com contratos ativos, próximos a vencer e encerrados.",
      "Controle de prazos de execução e renovações.",
      "Histórico documental ligado a cada contrato.",
      "Visão gerencial para não perder obrigações pós-homologação.",
    ],
    beneficios: [
      "Contratos sob controle",
      "Alertas de vigência",
      "Histórico centralizado",
    ],
  },
  {
    id: "leitura_concorrentes",
    nome: "Leitura dos concorrentes nas licitações",
    precoAnual: 350,
    inclusoBase: false,
    resumo:
      "Análise de quem disputa os mesmos editais: histórico, padrões de lance e posicionamento competitivo.",
    detalhes: [
      "Identifica concorrentes recorrentes no seu nicho.",
      "Ajuda a entender o nível de agressividade de preço no segmento.",
      "Apoia estratégia de participação e formação de proposta.",
      "Transforma dados públicos em inteligência comercial.",
    ],
    beneficios: [
      "Inteligência competitiva",
      "Melhor formação de preço",
      "Decisões com mais contexto",
    ],
  },
  {
    id: "gerador_impugnacao",
    nome: "Gerador de impugnação",
    precoAnual: 190,
    inclusoBase: false,
    resumo:
      "Monte peças de impugnação e pedidos de esclarecimento com estrutura técnica e fundamentação alinhada à legislação de licitações.",
    detalhes: [
      "Modelos e estrutura para impugnação de edital.",
      "Orientação de fundamentos legais e pontos questionáveis.",
      "Agiliza a resposta dentro dos prazos curtos do edital.",
      "Reduz dependência de peças genéricas sem aderência ao caso.",
    ],
    beneficios: [
      "Peças mais rápidas",
      "Base legal estruturada",
      "Ação dentro do prazo",
    ],
  },
  {
    id: "assistente_sicaf",
    nome: "Assistente do SICAF digital Online",
    precoAnual: 200,
    inclusoBase: false,
    resumo:
      "Assistente digital para dúvidas e etapas do SICAF: status, documentos, renovação e próximos passos no portal.",
    detalhes: [
      "Orientações sob demanda sobre cadastro e manutenção SICAF.",
      "Ajuda a interpretar pendências e status de habilitação.",
      "Complementa o suporte humano com respostas imediatas.",
      "Ideal para o dia a dia operacional da equipe da empresa.",
    ],
    beneficios: [
      "Suporte 24/7 no fluxo SICAF",
      "Menos dúvidas operacionais",
      "Complemento à assessoria humana",
    ],
  },
  {
    id: "analise_completa",
    nome: "Análise completa do processo de licitação",
    precoAnual: 900,
    inclusoBase: false,
    resumo:
      "Avaliação aprofundada do processo licitatório — da viabilidade à estratégia de participação — com olhar técnico da equipe CADBRASIL.",
    detalhes: [
      "Análise de viabilidade: vale a pena participar deste edital?",
      "Revisão de riscos, exigências e pontos de atenção.",
      "Recomendações de documentos, prazos e postura competitiva.",
      "Acompanhamento consultivo para decisões de maior valor.",
    ],
    beneficios: [
      "Decisão com suporte especialista",
      "Menos risco de desclassificação",
      "Estratégia sob medida",
    ],
  },
];

export const TODOS_PROPOSTA_MODULOS = [
  ...PROPOSTA_MODULOS_BASE,
  ...PROPOSTA_MODULOS_OPCIONAIS,
];

export function formatPrecoBrl(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function calcularTotalProposta(idsOpcionaisAtivos: string[]): number {
  const extras = PROPOSTA_MODULOS_OPCIONAIS.filter((m) =>
    idsOpcionaisAtivos.includes(m.id),
  ).reduce((acc, m) => acc + m.precoAnual, 0);
  return PROPOSTA_BASE_ANUAL + extras;
}

/** Referência de mercado para comparação visual (pacotes fechados típicos). */
export const PROPOSTA_MERCADO_REF = 4500;
