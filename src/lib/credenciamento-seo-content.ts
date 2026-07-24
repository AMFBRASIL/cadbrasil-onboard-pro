/** Conteúdo estático para SEO, JSON-LD e leitura por LLMs — /credenciamento */

export const CREDENCIAMENTO_PATH = "/credenciamento";

export const CREDENCIAMENTO_TITLE =
  "Diagnóstico gratuito de potencial em licitações públicas — CADBRASIL";

export const CREDENCIAMENTO_DESCRIPTION =
  "Em cerca de 90 segundos, descubra quanto sua empresa pode faturar participando de licitações. Diagnóstico gratuito de aderência ao SICAF, editais compatíveis e próximos passos para credenciamento assistido CADBRASIL.";

export const CREDENCIAMENTO_ABSTRACT =
  "Ferramenta interativa gratuita da CADBRASIL que avalia o perfil da empresa (CNPJ ou CPF), meta de faturamento com licitações, situação do SICAF, certificado digital e urgência para receber editais. Ao final, o usuário vê um score de prontidão, estimativa de oportunidades e pode iniciar o credenciamento SICAF assistido em cadastro.cadbrasil.com.br.";

export const CREDENCIAMENTO_KEYWORDS =
  "diagnóstico licitações, potencial licitações públicas, credenciamento SICAF, participar de licitações, editais públicos, Compras.gov.br, habilitação fornecedor, quiz licitações, CADBRASIL, SICAF ativo, certificado digital e-CNPJ";

export const CREDENCIAMENTO_FAQS = [
  {
    q: "O que é o diagnóstico de credenciamento da CADBRASIL?",
    a: "É um questionário interativo gratuito com cinco perguntas sobre perfil da empresa, meta de faturamento com licitações, situação do SICAF, certificado digital e prazo para começar. Em cerca de 90 segundos você recebe um score de prontidão e uma estimativa de editais compatíveis com o seu perfil.",
  },
  {
    q: "Quem pode participar de licitações — CPF ou CNPJ?",
    a: "Empresas com CNPJ (MEI, ME, EPP, LTDA e demais pessoas jurídicas) acessam a maior parte dos editais federais, estaduais e municipais. Pessoas físicas com CPF podem participar apenas de modalidades e valores específicos previstos em edital. A CADBRASIL pode abrir MEI em até 24h para ampliar oportunidades.",
  },
  {
    q: "O que é o SICAF e por que é obrigatório?",
    a: "O SICAF (Sistema de Cadastramento Unificado de Fornecedores) é o cadastro oficial que comprova a habilitação da empresa para participar de licitações da Administração Pública. Sem SICAF ativo e em dia, a proposta costuma ser bloqueada em portais como Compras.gov.br e PNCP.",
  },
  {
    q: "Preciso de certificado digital para licitar?",
    a: "Sim. O certificado digital e-CNPJ (empresa) ou e-CPF (pessoa física) é exigido para acessar portais de compras públicas, assinar propostas e comprovar representação legal. A CADBRASIL orienta a emissão ou renovação quando necessário.",
  },
  {
    q: "Quanto tempo leva para começar a receber editais?",
    a: "Após o credenciamento assistido, o monitoramento de editais compatíveis pode ser ativado em até 24 horas para quem deseja começar imediatamente. O envio inclui resumo, prazo e link para participação.",
  },
  {
    q: "O diagnóstico substitui o cadastro no SICAF?",
    a: "Não. O diagnóstico indica seu potencial e próximos passos. O credenciamento formal no SICAF é feito no fluxo de cadastro da CADBRASIL, com assessoria documental e acompanhamento até a habilitação.",
  },
] as const;

export const CREDENCIAMENTO_HOWTO_STEPS = [
  {
    name: "Informe seu perfil (CNPJ ou CPF)",
    text: "Indique se você vende como empresa com CNPJ ou como pessoa física. Empresas acessam mais editais; sem CNPJ, a CADBRASIL pode orientar abertura de MEI.",
  },
  {
    name: "Defina sua meta de faturamento com licitações",
    text: "Escolha a faixa de faturamento desejada em 12 meses para calibrar editais compatíveis com o porte e histórico da empresa.",
  },
  {
    name: "Informe a situação do SICAF",
    text: "Diga se o SICAF está ativo, vencido ou se ainda não existe. O SICAF é obrigatório para a maioria das licitações federais.",
  },
  {
    name: "Confirme seu certificado digital",
    text: "Informe se possui e-CNPJ ou e-CPF válido, vencido ou se ainda não tem certificado digital.",
  },
  {
    name: "Escolha quando quer começar",
    text: "Selecione se deseja receber editais imediatamente, em até 30 dias ou se ainda está avaliando. Veja o score de prontidão e ative o credenciamento.",
  },
] as const;

export const CREDENCIAMENTO_SECTIONS = [
  {
    heading: "Como funciona o diagnóstico",
    paragraphs: [
      "O diagnóstico CADBRASIL foi criado para empresas e empreendedores que querem participar de licitações mas não sabem por onde começar. Em cinco perguntas objetivas, avaliamos aderência ao mercado público, gaps de habilitação (SICAF, certificado digital) e urgência comercial.",
      "Ao concluir, você visualiza um índice de prontidão, estimativa de oportunidades de editais alinhadas ao seu perfil e um caminho claro para o credenciamento assistido — sem custo para realizar o diagnóstico.",
    ],
  },
  {
    heading: "Por que o mercado público importa",
    paragraphs: [
      "O setor público brasileiro movimenta dezenas de bilhões de reais por ano em licitações de produtos e serviços. Pregões eletrônicos, dispensas e concorrências estão disponíveis no Compras.gov.br, PNCP e portais estaduais e municipais.",
      "Estar credenciado no SICAF e com documentação em dia é o pré-requisito para transformar esse mercado em receita previsível para sua empresa.",
    ],
  },
  {
    heading: "Próximo passo após o diagnóstico",
    paragraphs: [
      "Se o resultado indicar boa aderência, você pode iniciar o credenciamento SICAF assistido pela CADBRASIL em poucos cliques. Nossa equipe organiza documentos, acompanha os níveis de habilitação e mantém você informado até a empresa ficar apta a participar de licitações.",
    ],
    bullets: [
      "Credenciamento assistido do início ao protocolo",
      "Orientação sobre SICAF, certificado digital e níveis de habilitação",
      "Monitoramento de editais compatíveis após ativação",
      "Suporte humano em português, processo em conformidade com a LGPD",
    ],
  },
] as const;
