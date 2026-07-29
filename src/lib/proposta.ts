import { createServerFn } from "@tanstack/react-start";
import {
  PROPOSTA_MODULOS_BASE,
} from "./proposta-modulos";
import {
  buildPropostaSnapshot,
  propostaPayloadSchema,
  type CriarPropostaResult,
  type PropostaPayload,
} from "./proposta-types";
import { gerarProtocoloProposta } from "./protocolo";

type ResultSetHeader = import("mysql2").ResultSetHeader;
type RowDataPacket = import("mysql2").RowDataPacket;

/** Status em que a proposta ainda pode ser reeditada (não gera nova linha). */
const STATUS_PROPOSTA_ABERTA = ["Gerada", "Em_negociacao"] as const;

async function executarSalvarProposta(rawInput: unknown): Promise<CriarPropostaResult> {
  const parsed = propostaPayloadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para a proposta.",
    };
  }

  const data: PropostaPayload = parsed.data;
  const { getPool, isDbConfigured, mapMysqlErrorMessage } = await import("./db-mysql");

  if (!isDbConfigured()) {
    return { success: false, error: "Banco de dados não configurado no servidor." };
  }

  const protocoloCadastro = data.protocoloCadastro.trim().toUpperCase();
  const snapshot = buildPropostaSnapshot(data.modulosExtrasIds);
  const pool = getPool();

  try {
    const [clientes] = await pool.query<
      (RowDataPacket & {
        id: number;
        razao_social: string | null;
        documento: string | null;
      })[]
    >(
      `SELECT id, razao_social, documento
       FROM clientes
       WHERE UPPER(TRIM(protocolo_cadbrasil)) = ?
       LIMIT 1`,
      [protocoloCadastro],
    );

    const cliente = clientes[0];
    if (!cliente?.id) {
      return {
        success: false,
        error:
          "Protocolo de cadastro não encontrado. Volte à página de conclusão ou fale com o suporte.",
      };
    }

    const clienteId = Number(cliente.id);
    const baseJson = JSON.stringify(
      PROPOSTA_MODULOS_BASE.map((m) => ({
        id: m.id,
        nome: m.nome,
        precoAnual: m.precoAnual,
      })),
    );
    const extrasJson = JSON.stringify(snapshot.extras);
    const trackingJson = JSON.stringify(data.tracking ?? {});
    const observacoes =
      data.observacoes?.trim() ||
      `Proposta gerada em /proposta com ${snapshot.extras.length} módulo(s) extra(s).`;

    // Reutiliza a proposta em aberto do cliente (não duplica linhas).
    const [existentes] = await pool.query<
      (RowDataPacket & { id: number; protocolo_proposta: string })[]
    >(
      `SELECT id, protocolo_proposta
       FROM propostas_comerciais
       WHERE cliente_id = ?
         AND status IN (?, ?)
       ORDER BY id DESC
       LIMIT 1`,
      [clienteId, STATUS_PROPOSTA_ABERTA[0], STATUS_PROPOSTA_ABERTA[1]],
    );

    const existente = existentes[0];

    if (existente?.id) {
      await pool.execute<ResultSetHeader>(
        `UPDATE propostas_comerciais SET
          protocolo_cadastro = ?,
          razao_social = ?,
          documento = ?,
          valor_base = ?,
          valor_extras = ?,
          valor_total = ?,
          periodicidade = 'anual',
          modulos_base_json = ?,
          modulos_extras_json = ?,
          status = 'Gerada',
          observacoes = ?,
          tracking_json = ?,
          updated_at = NOW()
         WHERE id = ?`,
        [
          protocoloCadastro,
          cliente.razao_social ?? null,
          cliente.documento ?? null,
          snapshot.valorBase,
          snapshot.valorExtras,
          snapshot.valorTotal,
          baseJson,
          extrasJson,
          observacoes,
          trackingJson,
          Number(existente.id),
        ],
      );

      return {
        success: true,
        id: Number(existente.id),
        clienteId,
        protocoloCadastro,
        protocoloProposta: String(existente.protocolo_proposta),
        valorBase: snapshot.valorBase,
        valorExtras: snapshot.valorExtras,
        valorTotal: snapshot.valorTotal,
      };
    }

    const protocoloProposta = gerarProtocoloProposta();
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO propostas_comerciais (
        cliente_id, protocolo_cadastro, protocolo_proposta,
        razao_social, documento,
        valor_base, valor_extras, valor_total, periodicidade,
        modulos_base_json, modulos_extras_json,
        status, observacoes, tracking_json
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        clienteId,
        protocoloCadastro,
        protocoloProposta,
        cliente.razao_social ?? null,
        cliente.documento ?? null,
        snapshot.valorBase,
        snapshot.valorExtras,
        snapshot.valorTotal,
        "anual",
        baseJson,
        extrasJson,
        "Gerada",
        observacoes,
        trackingJson,
      ],
    );

    return {
      success: true,
      id: Number(result.insertId),
      clienteId,
      protocoloCadastro,
      protocoloProposta,
      valorBase: snapshot.valorBase,
      valorExtras: snapshot.valorExtras,
      valorTotal: snapshot.valorTotal,
    };
  } catch (e) {
    console.error("[salvarProposta]", e);
    return {
      success: false,
      error: mapMysqlErrorMessage(e) || "Não foi possível gravar a proposta.",
    };
  }
}

export const salvarProposta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data: rawInput }): Promise<CriarPropostaResult> => {
    try {
      return await executarSalvarProposta(rawInput);
    } catch (e) {
      console.error("[salvarProposta] handler", e);
      return {
        success: false,
        error: e instanceof Error ? e.message : "Erro inesperado ao salvar a proposta.",
      };
    }
  });
