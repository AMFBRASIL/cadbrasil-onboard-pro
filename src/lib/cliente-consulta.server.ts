import type { ClienteExistenteDetalhe, ConsultaDocumentoResult, EtapaSicaf } from "./cliente-consulta-types";

function docNormalizedExpr(column: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}

function isMysqlBadField(e: unknown): boolean {
  return typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1054;
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
    };

    let rows: ClienteRow[];

    try {
      const [r] = await pool.query<ClienteRow[]>(
        `SELECT id, tipo_documento, documento, razao_social, status, protocolo_cadbrasil
         FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documento],
      );
      rows = r;
    } catch (e) {
      if (!isMysqlBadField(e)) throw e;
      const [r] = await pool.query<ClienteRow[]>(
        `SELECT id, tipo_documento, documento, razao_social, status, protocoloCadbrasil AS protocolo_cadbrasil
         FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documento],
      );
      rows = r;
    }

    if (!rows.length) {
      return { exists: false, configured: true, documento };
    }

    const c = rows[0];

    const [contratoRows] = await pool.query<(RowDataPacket & { status: string })[]>(
      `SELECT status FROM contratos_digitais WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [c.id],
    );

    const [sicafRows] = await pool.query<
      (RowDataPacket & { id: number; status: string; completude: number })[]
    >(
      `SELECT id, status, completude FROM sicaf_cadastros WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [c.id],
    );

    let niveisHabilitados = 0;
    const sicafRow = sicafRows[0];
    if (sicafRow) {
      const [nivelRows] = await pool.query<(RowDataPacket & { habilitado: number })[]>(
        `SELECT habilitado FROM sicaf_niveis WHERE sicaf_id = ? AND habilitado = 1`,
        [sicafRow.id],
      );
      niveisHabilitados = nivelRows.length;
    }

    const etapas = deriveEtapas({
      contratoStatus: contratoRows[0]?.status ?? null,
      temContrato: contratoRows.length > 0,
      sicafStatus: sicafRow?.status ?? null,
      completude: Number(sicafRow?.completude) || 0,
      niveisHabilitados,
    });

    const etapasConcluidas = etapas.filter((e) => e.status === "concluida").length;

    const cliente: ClienteExistenteDetalhe = {
      razaoSocial: c.razao_social,
      documento: c.documento,
      tipoDocumento: c.tipo_documento === "CPF" ? "CPF" : "CNPJ",
      protocolo: c.protocolo_cadbrasil,
      statusCliente: c.status,
      sicafStatus: sicafRow?.status ?? null,
      completude: Number(sicafRow?.completude) || 0,
      etapas,
      etapasConcluidas,
      totalEtapas: etapas.length,
    };

    return { exists: true, configured: true, documento, cliente };
  } catch (error) {
    console.error("[buscarClientePorDocumento]", error);
    return { exists: false, configured: true, documento };
  }
}
