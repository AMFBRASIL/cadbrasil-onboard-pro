export type SicafNivelResumo = {
  nivel: string;
  habilitado: boolean;
};

export type CadastroPorProtocolo = {
  protocolo: string;
  cliente: {
    id: number;
    razaoSocial: string;
    nomeFantasia: string | null;
    documento: string;
    tipoDocumento: string;
    email: string;
    cidade: string;
    estado: string;
  };
  usuario: {
    emailAcesso: string;
  };
  sicaf: {
    status: string;
    completude: number;
    niveis: SicafNivelResumo[];
  } | null;
  contrato: {
    plano: string;
    dataInicio: string;
    dataVencimento: string;
    status: string;
  } | null;
};

export type ConsultaProtocoloResult =
  | { found: false; protocolo: string; error?: string }
  | { found: true; data: CadastroPorProtocolo };
