import { createServerFn } from "@tanstack/react-start";
import {
  FORMAS_PAGAMENTO,
  MOTIVOS_CANCELAMENTO,
  SERVICOS_ESPERADOS,
  cancelamentoPayloadSchema,
  type CancelamentoPayload,
  type CriarCancelamentoResult,
} from "./cancelamento-types";
import { gerarProtocoloCancelamento } from "./protocolo";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

function maskDocumento(digits: string): string {
  if (digits.length === 11) {
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function docNormalizedExpr(column: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}

function labelFrom(
  list: readonly { value: string; label: string }[],
  value: string,
): string {
  return list.find((i) => i.value === value)?.label ?? value;
}

type ResultSetHeader = import("mysql2").ResultSetHeader;
type RowDataPacket = import("mysql2").RowDataPacket;

async function executarCriarCancelamento(rawInput: unknown): Promise<CriarCancelamentoResult> {
  const parsed = cancelamentoPayloadSchema.safeParse(rawInput);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos para o cancelamento.",
    };
  }

  const data: CancelamentoPayload = parsed.data;
  const { getPool, isDbConfigured, mapMysqlErrorMessage } = await import("./db-mysql");

  if (!isDbConfigured()) {
    return { success: false, error: "Banco de dados não configurado no servidor." };
  }

  const documentoDigits = onlyDigits(data.documento);
  const protocolo = gerarProtocoloCancelamento();
  const documentoMasked = maskDocumento(documentoDigits);
  const pool = getPool();

  try {
    let clienteId = data.clienteId ?? null;

    if (!clienteId) {
      const [rows] = await pool.query<(RowDataPacket & { id: number })[]>(
        `SELECT id FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documentoDigits],
      );
      if (rows[0]?.id) clienteId = Number(rows[0].id);
    }

    if (!clienteId) {
      return {
        success: false,
        error:
          "CNPJ/CPF não encontrado na base CADBRASIL. Verifique o documento ou fale com o suporte.",
      };
    }

    const motivosJson = JSON.stringify({
      motivos: data.motivos,
      motivoOutro: data.motivoOutro || null,
      motivoDetalhe: data.motivoDetalhe,
    });

    const reembolsoJson = JSON.stringify({
      formaPagamento: data.formaPagamento,
      titularPagamento: data.titularPagamento,
      chavePix: data.chavePix || null,
      banco: data.banco || null,
      agencia: data.agencia || null,
      conta: data.conta || null,
      valorPago: data.valorPago || null,
      dataPagamento: data.dataPagamento || null,
    });

    const trackingJson = JSON.stringify(data.tracking ?? {});

    const status = data.reverterCancelamento
      ? "Revertido_monitoramento"
      : data.desejaMonitoramento
        ? "Pendente_com_interesse_monitoramento"
        : "Pendente";

    const observacoes = [
      data.reverterCancelamento
        ? "Cliente optou por REVERTER o cancelamento e seguir com acompanhamento de licitações."
        : "Cliente solicitou cancelamento do serviço.",
      data.desejaMonitoramento
        ? "Manifestou interesse em monitoramento de licitações."
        : "Não manifestou interesse em monitoramento de licitações.",
      `Serviço esperado: ${data.servicoEsperado}${
        data.servicoEsperadoOutro ? ` — ${data.servicoEsperadoOutro}` : ""
      }`,
    ].join("\n");

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO solicitacoes_cancelamento (
        cliente_id, protocolo, documento, razao_social, protocolo_cadastro,
        email, telefone, cidade, estado,
        motivos_json, servico_esperado, servico_esperado_outro,
        dados_reembolso_json,
        deseja_monitoramento, reverter_cancelamento,
        status, observacoes, tracking_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clienteId,
        protocolo,
        documentoMasked,
        data.razaoSocial.trim(),
        data.protocoloCadastro || null,
        data.email.trim() ? data.email.trim().toLowerCase() : null,
        onlyDigits(data.telefone) || null,
        data.cidade?.trim() || null,
        data.estado?.trim()?.toUpperCase() || null,
        motivosJson,
        data.servicoEsperado,
        data.servicoEsperadoOutro || null,
        reembolsoJson,
        data.desejaMonitoramento ? 1 : 0,
        data.reverterCancelamento ? 1 : 0,
        status,
        observacoes,
        trackingJson,
      ],
    );

    const motivosLabels = data.motivos.map((m) =>
      m === "outro" && data.motivoOutro.trim()
        ? `Outro: ${data.motivoOutro.trim()}`
        : labelFrom(MOTIVOS_CANCELAMENTO, m),
    );

    let emailEnviado = false;
    let emailErro: string | undefined;
    try {
      const { dispararEmailsPosCancelamento } = await import("./email");
      const r = await dispararEmailsPosCancelamento({
        protocolo,
        status,
        documentoMasked,
        razaoSocial: data.razaoSocial.trim(),
        protocoloCadastro: data.protocoloCadastro || null,
        email: data.email.trim() || "",
        telefone: data.telefone.trim() || "",
        cidade: data.cidade?.trim() || "",
        estado: data.estado?.trim()?.toUpperCase() || "",
        motivosLabels,
        motivoOutro: data.motivoOutro || "",
        motivoDetalhe: data.motivoDetalhe,
        servicoEsperadoLabel: labelFrom(SERVICOS_ESPERADOS, data.servicoEsperado),
        servicoEsperadoOutro: data.servicoEsperadoOutro || "",
        formaPagamentoLabel: labelFrom(FORMAS_PAGAMENTO, data.formaPagamento),
        titularPagamento: data.titularPagamento,
        chavePix: data.chavePix || "",
        banco: data.banco || "",
        agencia: data.agencia || "",
        conta: data.conta || "",
        valorPago: data.valorPago || "",
        dataPagamento: data.dataPagamento || "",
        desejaMonitoramento: data.desejaMonitoramento,
        reverterCancelamento: data.reverterCancelamento,
        observacoes,
      });
      emailEnviado = r.success;
      if (!r.success) emailErro = r.error;
    } catch (e) {
      emailErro = e instanceof Error ? e.message : String(e);
      console.warn("[criarSolicitacaoCancelamento] e-mail falhou:", emailErro);
    }

    return {
      success: true,
      protocolo,
      id: result.insertId,
      reverterCancelamento: data.reverterCancelamento,
      desejaMonitoramento: data.desejaMonitoramento,
      emailEnviado,
      emailErro,
    };
  } catch (error) {
    console.error("[criarSolicitacaoCancelamento]", error);
    return {
      success: false,
      error:
        mapMysqlErrorMessage(error) ||
        "Não foi possível registrar a solicitação. Tente novamente.",
    };
  }
}

export const criarSolicitacaoCancelamento = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data: rawInput }): Promise<CriarCancelamentoResult> => {
    try {
      return await executarCriarCancelamento(rawInput);
    } catch (e) {
      console.error("[criarSolicitacaoCancelamento] unhandled", e);
      return {
        success: false,
        error: "Erro interno ao processar a solicitação. Tente novamente.",
      };
    }
  });
