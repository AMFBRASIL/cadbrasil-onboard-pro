import type { ConsultaProtocoloResult, SicafNivelResumo } from "./cadastro-consulta-types";

export type { CadastroPorProtocolo, ConsultaProtocoloResult, SicafNivelResumo } from "./cadastro-consulta-types";

function isMysqlBadField(e: unknown): boolean {
  return typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1054;
}

type RowDataPacket = import("mysql2").RowDataPacket;

/**
 * Busca cadastro no MySQL (server-only). Usado pelo loader SSR e pela server function.
 */
export async function buscarCadastroPorProtocolo(
  protocolo: string,
): Promise<ConsultaProtocoloResult> {
  const { getPool, isDbConfigured } = await import("./db-mysql");

  if (!isDbConfigured()) {
    return { found: false, protocolo, error: "Banco de dados não configurado." };
  }

  try {
    const pool = getPool();

    type ClienteRow = RowDataPacket & {
      id: number;
      tipo_documento: string;
      documento: string;
      razao_social: string;
      nome_fantasia: string | null;
      email: string;
      cidade: string;
      estado: string;
      usuario_id: number;
      email_acesso: string | null;
    };

    let clienteRows: ClienteRow[];

    try {
      const [rows] = await pool.query<ClienteRow[]>(
        `SELECT c.id, c.tipo_documento, c.documento, c.razao_social, c.nome_fantasia,
                c.email, c.cidade, c.estado, c.usuario_id,
                u.email AS email_acesso
         FROM clientes c
         LEFT JOIN usuarios u ON u.id = c.usuario_id
         WHERE c.protocolo_cadbrasil = ?
         LIMIT 1`,
        [protocolo],
      );
      clienteRows = rows;
    } catch (e) {
      if (!isMysqlBadField(e)) throw e;
      const [rows] = await pool.query<ClienteRow[]>(
        `SELECT c.id, c.tipo_documento, c.documento, c.razao_social, c.nome_fantasia,
                c.email, c.cidade, c.estado, c.usuario_id,
                u.email AS email_acesso
         FROM clientes c
         LEFT JOIN usuarios u ON u.id = c.usuario_id
         WHERE c.protocoloCadbrasil = ?
         LIMIT 1`,
        [protocolo],
      );
      clienteRows = rows;
    }

    if (!clienteRows.length) {
      return { found: false, protocolo };
    }

    const c = clienteRows[0];

    const [contratoRows] = await pool.query<
      (RowDataPacket & {
        plano: string;
        data_inicio: string;
        data_vencimento: string;
        status: string;
      })[]
    >(
      `SELECT plano, data_inicio, data_vencimento, status
       FROM contratos_digitais
       WHERE cliente_id = ?
       ORDER BY id DESC
       LIMIT 1`,
      [c.id],
    );

    const [sicafRows] = await pool.query<
      (RowDataPacket & { id: number; status: string; completude: number })[]
    >(
      `SELECT id, status, completude FROM sicaf_cadastros WHERE cliente_id = ? ORDER BY id DESC LIMIT 1`,
      [c.id],
    );

    let niveis: SicafNivelResumo[] = [];
    const sicafRow = sicafRows[0];
    if (sicafRow) {
      const [nivelRows] = await pool.query<(RowDataPacket & { nivel: string; habilitado: number })[]>(
        `SELECT nivel, habilitado FROM sicaf_niveis WHERE sicaf_id = ? ORDER BY nivel ASC`,
        [sicafRow.id],
      );
      niveis = nivelRows.map((n) => ({
        nivel: String(n.nivel),
        habilitado: Boolean(n.habilitado),
      }));
    }

    const contrato = contratoRows[0];

    return {
      found: true,
      data: {
        protocolo,
        cliente: {
          id: c.id,
          razaoSocial: c.razao_social,
          nomeFantasia: c.nome_fantasia,
          documento: c.documento,
          tipoDocumento: c.tipo_documento,
          email: c.email,
          cidade: c.cidade,
          estado: c.estado,
        },
        usuario: {
          emailAcesso: c.email_acesso ?? c.email,
        },
        sicaf: sicafRow
          ? {
              status: sicafRow.status,
              completude: Number(sicafRow.completude) || 0,
              niveis,
            }
          : null,
        contrato: contrato
          ? {
              plano: contrato.plano,
              dataInicio: String(contrato.data_inicio).slice(0, 10),
              dataVencimento: String(contrato.data_vencimento).slice(0, 10),
              status: contrato.status,
            }
          : null,
      },
    };
  } catch (e) {
    console.error("[buscarCadastroPorProtocolo]", e);
    return { found: false, protocolo, error: "Erro ao consultar o protocolo." };
  }
}
