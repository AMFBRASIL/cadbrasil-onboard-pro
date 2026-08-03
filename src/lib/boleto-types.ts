export type SolicitarBoletoInput = {
  cnpj: string;
};

export type BoletoApiResponse = {
  ok: boolean;
  possuiCadastro?: boolean;
  clienteId?: number;
  cnpj?: string;
  razaoSocial?: string;
  pendentePagamento?: boolean;
  valor?: number;
  valorFormatado?: string;
  linkBoleto?: string | null;
  codigoBarras?: string | null;
  protocolo?: string | null;
  dataVencimento?: string | null;
  taxaId?: number;
  pagamentoId?: number;
  payCode?: string | null;
  urlPagamento?: string | null;
  URLpagamento?: string | null;
  boletoReutilizado?: boolean;
  geradoAgora?: boolean;
  renovacaoAntecipada?: boolean;
  diasParaRenovacao?: number | null;
  sicafValidoAte?: string | null;
  message?: string | null;
  emailEnviado?: boolean;
  emailPara?: string | null;
  emailAssunto?: string | null;
  emailSimulado?: boolean;
  emailErro?: string | null;
  error?: string;
};

export type SolicitarBoletoResult =
  | {
      success: true;
      urlPagamento: string;
      valor: number;
      valorFormatado: string;
      protocoloSicaf: string | null;
      codigoBarras: string | null;
      dataVencimento: string | null;
      message: string | null;
      geradoAgora: boolean;
      boletoReutilizado: boolean;
      emailEnviado: boolean;
      emailPara: string | null;
      razaoSocial: string | null;
      cnpj: string;
    }
  | { success: false; error: string };
