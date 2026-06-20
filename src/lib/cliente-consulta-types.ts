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

export type ClienteExistenteDetalhe = {
  razaoSocial: string;
  documento: string;
  tipoDocumento: "CPF" | "CNPJ";
  protocolo: string | null;
  statusCliente: string;
  sicafStatus: string | null;
  completude: number;
  etapas: EtapaSicaf[];
  etapasConcluidas: number;
  totalEtapas: number;
};

export type ConsultaDocumentoResult = {
  exists: boolean;
  configured: boolean;
  documento: string;
  cliente?: ClienteExistenteDetalhe;
};
