import type {
  ClienteExistenteDetalhe,
  ConsultaDocumentoResult,
  ContratoDetalheConsulta,
  EtapaSicaf,
  PagamentoDetalheConsulta,
  SicafDetalheConsulta,
  SicafNivelDetalhe,
} from "./cliente-consulta-types";

function docNormalizedExpr(column: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}

function isMysqlBadField(e: unknown): boolean {
  return typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1054;
}

function toDateStr(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toNumber(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function deriveEtapas(input: {
  contratoStatus: string | null;
  temContrato: boolean;
  sicafStatus: string | null;
  completude: number;
  niveisHabilitados: number;
}): EtapaSicaf[] {
  const contratoAssinado = input.contratoStatus === "Assinado";
  const sicafAtivo = /ativo|habilitado|regular/i.test(input.sicafStatus ?? "");
  const temProgressoSicaf = input.completude > 0 || input.niveisHabilitados > 0;

  const etapa1Status: EtapaSicaf["status"] = contratoAssinado
    ? "concluida"
    : input.temContrato
      ? "em_andamento"
      : "pendente";

  const etapa2Status: EtapaSicaf["status"] =
    temProgressoSicaf || sicafAtivo
      ? "concluida"
      : etapa1Status === "concluida"
        ? "em_andamento"
        : "pendente";

  const etapa3Status: EtapaSicaf["status"] =
    input.completude >= 100 || sicafAtivo
      ? "concluida"
      : etapa2Status === "concluida"
        ? "em_andamento"
        : "pendente";

  const statusTexto = (s: EtapaSicaf["status"], pendente: string, andamento: string, ok: string) => {
    if (s === "concluida") return ok;
    if (s === "em_andamento") return andamento;
    return pendente;
  };

  return [
    {
      numero: 1,
      titulo: "Ativação SICAF",
      subtitulo: "Licença e início do processo",
      descricao:
        "Confirmação da licença CADBRASIL e abertura do processo de credenciamento no Sistema de Cadastramento Unificado de Fornecedores.",
      icone: "rocket",
      status: etapa1Status,
      statusTexto: statusTexto(
        etapa1Status,
        "Aguardando confirmação da Licença CADBRASIL e início do processo de habilitação.",
        "Licença em processamento. Nossa equipe está concluindo a ativação.",
        "Licença confirmada e processo SICAF iniciado.",
      ),
    },
    {
      numero: 2,
      titulo: "Habilitação Jurídica",
      subtitulo: "Documentação societária e certidões",
      descricao:
        "Validação de contrato social, certidões fiscais e documentos de habilitação jurídica exigidos pelo SICAF.",
      icone: "scale",
      status: etapa2Status,
      statusTexto: statusTexto(
        etapa2Status,
        "Ainda não validado. Será validado após conclusão da etapa anterior.",
        "Documentação em análise pela equipe CADBRASIL.",
        "Habilitação jurídica validada nos níveis exigidos.",
      ),
    },
    {
      numero: 3,
      titulo: "Habilitação para Licitações Federais",
      subtitulo: "Acesso completo ao mercado público",
      descricao:
        "Liberação final para participação em licitações no Compras.gov.br e demais portais de compras públicas.",
      icone: "gavel",
      status: etapa3Status,
      statusTexto: statusTexto(
        etapa3Status,
        "Aguardando conclusão das etapas anteriores para habilitação completa.",
        "Finalização cadastral em andamento. Em breve liberação total.",
        "Empresa habilitada para licitações federais.",
      ),
    },
  ];
}

type RowDataPacket = import("mysql2").RowDataPacket;
type MysqlPool = import("mysql2/promise").Pool;

async function carregarContrato(
  pool: MysqlPool,
  clienteId: number,
): Promise<{ status: string | null; temContrato: boolean; detalhe: ContratoDetalheConsulta | null }> {
  try {
    const [rows] = await pool.query<
      (RowDataPacket & {
        plano: string;
        data_inicio: string | Date;
        data_vencimento: string | Date;
        status: string;
        assinado_por: string | null;
      })[]
    >(
      `SELECT plano, data_inicio, data_vencimento, status, assinado_por
       FROM contratos_digitais WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [clienteId],
    );
    const row = rows[0];
    if (!row) return { status: null, temContrato: false, detalhe: null };
    return {
      status: row.status,
      temContrato: true,
      detalhe: {
        plano: row.plano,
        dataInicio: toDateStr(row.data_inicio),
        dataVencimento: toDateStr(row.data_vencimento),
        status: row.status,
        assinadoPor: row.assinado_por,
      },
    };
  } catch (e) {
    if (!isMysqlBadField(e)) throw e;
    const [rows] = await pool.query<(RowDataPacket & { status: string })[]>(
      `SELECT status FROM contratos_digitais WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [clienteId],
    );
    return {
      status: rows[0]?.status ?? null,
      temContrato: rows.length > 0,
      detalhe: rows[0]
        ? {
            plano: "—",
            dataInicio: "",
            dataVencimento: "",
            status: rows[0].status,
            assinadoPor: null,
          }
        : null,
    };
  }
}

async function carregarSicaf(
  pool: MysqlPool,
  clienteId: number,
): Promise<{
  status: string | null;
  completude: number;
  niveisHabilitados: number;
  detalhe: SicafDetalheConsulta | null;
}> {
  type SicafRow = RowDataPacket & {
    id: number;
    status: string;
    completude: number;
    credenciamento_anual?: number;
    manutencao_ativa?: number;
    dias_validade?: number;
    observacoes?: string | null;
  };

  let sicafRows: SicafRow[];
  try {
    const [r] = await pool.query<SicafRow[]>(
      `SELECT id, status, completude, credenciamento_anual, manutencao_ativa, dias_validade, observacoes
       FROM sicaf_cadastros WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [clienteId],
    );
    sicafRows = r;
  } catch (e) {
    if (!isMysqlBadField(e)) throw e;
    const [r] = await pool.query<SicafRow[]>(
      `SELECT id, status, completude FROM sicaf_cadastros WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [clienteId],
    );
    sicafRows = r;
  }

  const sicafRow = sicafRows[0];
  if (!sicafRow) {
    return { status: null, completude: 0, niveisHabilitados: 0, detalhe: null };
  }

  let niveis: SicafNivelDetalhe[] = [];
  try {
    const [nivelRows] = await pool.query<(RowDataPacket & { nivel: string; habilitado: number })[]>(
      `SELECT nivel, habilitado FROM sicaf_niveis WHERE sicaf_id = ? ORDER BY nivel ASC`,
      [sicafRow.id],
    );
    niveis = nivelRows.map((n) => ({
      nivel: String(n.nivel),
      habilitado: Boolean(n.habilitado),
    }));
  } catch {
    niveis = [];
  }

  const niveisHabilitados = niveis.filter((n) => n.habilitado).length;
  const completude = toNumber(sicafRow.completude);

  return {
    status: sicafRow.status,
    completude,
    niveisHabilitados,
    detalhe: {
      status: sicafRow.status,
      completude,
      credenciamentoAnual: Boolean(sicafRow.credenciamento_anual),
      manutencaoAtiva: Boolean(sicafRow.manutencao_ativa),
      diasValidade: toNumber(sicafRow.dias_validade),
      observacoes: sicafRow.observacoes ?? null,
      niveis,
    },
  };
}

async function carregarPagamentos(
  pool: MysqlPool,
  clienteId: number,
): Promise<PagamentoDetalheConsulta[]> {
  const pagamentos: PagamentoDetalheConsulta[] = [];

  try {
    const [taxas] = await pool.query<
      (RowDataPacket & {
        id: number;
        descricao: string;
        valor: number;
        ano_referencia: number;
        status: string;
        forma_pagamento: string | null;
      })[]
    >(
      `SELECT id, descricao, valor, ano_referencia, status, forma_pagamento
       FROM taxas_sicaf
       WHERE cliente_id = ?
       ORDER BY id DESC
       LIMIT 8`,
      [clienteId],
    );
    for (const t of taxas) {
      pagamentos.push({
        origem: "taxa_sicaf",
        id: Number(t.id),
        descricao: t.descricao || "Taxa SICAF",
        valor: toNumber(t.valor),
        status: t.status,
        formaPagamento: t.forma_pagamento,
        tipo: null,
        dataVencimento: null,
        protocolo: null,
        anoReferencia: t.ano_referencia != null ? Number(t.ano_referencia) : null,
      });
    }
  } catch (e) {
    if (!isMysqlBadField(e)) {
      console.warn("[carregarPagamentos] taxas_sicaf", e);
    }
  }

  try {
    const [gn] = await pool.query<
      (RowDataPacket & {
        id: number;
        tipo: string;
        valor: number;
        descricao: string;
        protocolo: string | null;
        data_vencimento: string | Date | null;
        status: string;
      })[]
    >(
      `SELECT id, tipo, valor, descricao, protocolo, data_vencimento, status
       FROM pagamentos_gerencianet
       WHERE cliente_id = ?
       ORDER BY id DESC
       LIMIT 8`,
      [clienteId],
    );
    for (const p of gn) {
      pagamentos.push({
        origem: "gerencianet",
        id: Number(p.id),
        descricao: p.descricao || "Pagamento",
        valor: toNumber(p.valor),
        status: p.status,
        formaPagamento: p.tipo ? String(p.tipo).toUpperCase() : null,
        tipo: p.tipo ? String(p.tipo) : null,
        dataVencimento: p.data_vencimento ? toDateStr(p.data_vencimento) : null,
        protocolo: p.protocolo,
        anoReferencia: null,
      });
    }
  } catch (e) {
    if (!isMysqlBadField(e)) {
      console.warn("[carregarPagamentos] pagamentos_gerencianet", e);
    }
  }

  // Prefer denser history: taxa first then GN; already limited per source.
  return pagamentos.slice(0, 12);
}

export async function buscarClientePorDocumento(documento: string): Promise<ConsultaDocumentoResult> {
  const { getPool, isDbConfigured } = await import("./db-mysql");

  if (!isDbConfigured()) {
    return { exists: false, configured: false, documento };
  }

  try {
    const pool = getPool();

    type ClienteRow = RowDataPacket & {
      id: number;
      tipo_documento: string;
      documento: string;
      razao_social: string;
      status: string;
      protocolo_cadbrasil: string | null;
      email: string | null;
      telefone: string | null;
      cidade: string | null;
      estado: string | null;
    };

    let rows: ClienteRow[];

    try {
      const [r] = await pool.query<ClienteRow[]>(
        `SELECT id, tipo_documento, documento, razao_social, status, protocolo_cadbrasil,
                email, telefone, cidade, estado
         FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documento],
      );
      rows = r;
    } catch (e) {
      if (!isMysqlBadField(e)) throw e;
      const [r] = await pool.query<ClienteRow[]>(
        `SELECT id, tipo_documento, documento, razao_social, status, protocoloCadbrasil AS protocolo_cadbrasil,
                email, telefone, cidade, estado
         FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documento],
      );
      rows = r;
    }

    if (!rows.length) {
      return { exists: false, configured: true, documento };
    }

    const c = rows[0];
    const contrato = await carregarContrato(pool, c.id);
    const sicaf = await carregarSicaf(pool, c.id);
    const pagamentos = await carregarPagamentos(pool, c.id);

    const etapas = deriveEtapas({
      contratoStatus: contrato.status,
      temContrato: contrato.temContrato,
      sicafStatus: sicaf.status,
      completude: sicaf.completude,
      niveisHabilitados: sicaf.niveisHabilitados,
    });

    const etapasConcluidas = etapas.filter((e) => e.status === "concluida").length;

    const cliente: ClienteExistenteDetalhe = {
      id: Number(c.id),
      razaoSocial: c.razao_social,
      documento: c.documento,
      tipoDocumento: c.tipo_documento === "CPF" ? "CPF" : "CNPJ",
      protocolo: c.protocolo_cadbrasil,
      statusCliente: c.status,
      sicafStatus: sicaf.status,
      completude: sicaf.completude,
      email: c.email ?? null,
      telefone: c.telefone ?? null,
      cidade: c.cidade ?? null,
      estado: c.estado ?? null,
      etapas,
      etapasConcluidas,
      totalEtapas: etapas.length,
      sicafDetalhe: sicaf.detalhe,
      contrato: contrato.detalhe,
      pagamentos,
    };

    return { exists: true, configured: true, documento, cliente };
  } catch (error) {
    console.error("[buscarClientePorDocumento]", error);
    return { exists: false, configured: true, documento };
  }
}
