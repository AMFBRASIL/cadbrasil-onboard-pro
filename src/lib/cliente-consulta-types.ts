export type EtapaSicafStatus = "pendente" | "em_andamento" | "concluida";

export type EtapaSicaf = {
  numero: 1 | 2 | 3;
  titulo: string;
  subtitulo: string;
  descricao: string;
  statusTexto: string;
  status: EtapaSicafStatus;
  icone: "rocket" | "scale" | "gavel";
};

export type SicafNivelDetalhe = {
  nivel: string;
  habilitado: boolean;
};

export type SicafDetalheConsulta = {
  status: string;
  completude: number;
  credenciamentoAnual: boolean;
  manutencaoAtiva: boolean;
  diasValidade: number;
  observacoes: string | null;
  niveis: SicafNivelDetalhe[];
};

export type ContratoDetalheConsulta = {
  plano: string;
  dataInicio: string;
  dataVencimento: string;
  status: string;
  assinadoPor: string | null;
};

export type PagamentoDetalheConsulta = {
  origem: "taxa_sicaf" | "gerencianet";
  id: number;
  descricao: string;
  valor: number;
  status: string;
  formaPagamento: string | null;
  tipo: string | null;
  dataVencimento: string | null;
  protocolo: string | null;
  anoReferencia: number | null;
};

export type ClienteExistenteDetalhe = {
  id: number;
  razaoSocial: string;
  documento: string;
  tipoDocumento: "CPF" | "CNPJ";
  protocolo: string | null;
  statusCliente: string;
  sicafStatus: string | null;
  completude: number;
  email: string | null;
  telefone: string | null;
  cidade: string | null;
  estado: string | null;
  etapas: EtapaSicaf[];
  etapasConcluidas: number;
  totalEtapas: number;
  /** Detalhes do SICAF (níveis, manutenção, completude). */
  sicafDetalhe: SicafDetalheConsulta | null;
  /** Último contrato digital. */
  contrato: ContratoDetalheConsulta | null;
  /** Histórico recente de taxas/pagamentos. */
  pagamentos: PagamentoDetalheConsulta[];
};

export type ConsultaDocumentoResult = {
  exists: boolean;
  configured: boolean;
  documento: string;
  cliente?: ClienteExistenteDetalhe;
};
