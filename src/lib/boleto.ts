import { createServerFn } from "@tanstack/react-start";
import type {
  BoletoApiResponse,
  SolicitarBoletoResult,
} from "./boleto-types";
import { formatValorBrl, getTaxaProcessoAnual } from "./precos";

const DEFAULT_BOLETO_API_URL =
  "https://fornecedor.cadbrasil.com.br/api/clients/solicitar-boleto";

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function resolveBoletoApiUrl(): string {
  const fromEnv = process.env.PORTAL_BOLETO_API_URL?.trim();
  if (fromEnv) return fromEnv;
  const portal = process.env.PORTAL_URL?.trim()?.replace(/\/$/, "");
  if (portal) return `${portal}/api/clients/solicitar-boleto`;
  return DEFAULT_BOLETO_API_URL;
}

function resolveBoletoApiKey(): string | null {
  const key = process.env.PORTAL_BOLETO_API_KEY?.trim();
  return key || null;
}

function pickUrlPagamento(data: BoletoApiResponse): string | null {
  const candidates = [data.urlPagamento, data.URLpagamento, data.linkBoleto];
  for (const raw of candidates) {
    const url = typeof raw === "string" ? raw.trim() : "";
    if (url.startsWith("http")) return url;
  }
  return null;
}

async function executarSolicitarBoleto(
  cnpj: string,
): Promise<SolicitarBoletoResult> {
  const apiKey = resolveBoletoApiKey();
  if (!apiKey) {
    return {
      success: false,
      error:
        "API de boleto não configurada no servidor (PORTAL_BOLETO_API_KEY).",
    };
  }

  const url = new URL(resolveBoletoApiUrl());
  url.searchParams.set("cnpj", cnpj);

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
        "x-api-key": apiKey,
      },
      cache: "no-store",
    });

    const rawText = await res.text();
    let data: BoletoApiResponse | null = null;
    try {
      data = JSON.parse(rawText) as BoletoApiResponse;
    } catch {
      data = null;
    }

    if (!res.ok) {
      const msg =
        data?.message ||
        data?.error ||
        `Não foi possível gerar a guia (HTTP ${res.status}).`;
      return { success: false, error: msg };
    }

    if (!data?.ok) {
      return {
        success: false,
        error:
          data?.message ||
          data?.error ||
          "A API não confirmou a geração do boleto.",
      };
    }

    const urlPagamento = pickUrlPagamento(data);
    if (!urlPagamento) {
      return {
        success: false,
        error:
          data.message ||
          "Boleto processado, mas o link de pagamento não foi retornado.",
      };
    }

    // Valor de exibição segue o .env (não o retorno antigo da API do portal).
    const valor = getTaxaProcessoAnual();

    return {
      success: true,
      urlPagamento,
      valor,
      valorFormatado: formatValorBrl(valor),
      protocoloSicaf: data.protocolo?.trim() || null,
      codigoBarras: data.codigoBarras?.trim() || null,
      dataVencimento: data.dataVencimento || null,
      message: data.message?.trim() || null,
      geradoAgora: Boolean(data.geradoAgora),
      boletoReutilizado: Boolean(data.boletoReutilizado),
      emailEnviado: Boolean(data.emailEnviado),
      emailPara: data.emailPara?.trim() || null,
      razaoSocial: data.razaoSocial?.trim() || null,
      cnpj: data.cnpj?.trim() || cnpj,
    };
  } catch (err) {
    console.error("[solicitarBoleto]", err);
    return {
      success: false,
      error: "Falha de comunicação ao solicitar o boleto. Tente novamente.",
    };
  }
}

/**
 * Gera/reutiliza boleto da taxa SICAF no Portal do Fornecedor.
 * A API key permanece apenas no servidor.
 */
export const solicitarBoleto = createServerFn({ method: "POST" })
  .inputValidator((input: { cnpj: string }) => {
    const cnpj = onlyDigits(String(input?.cnpj ?? ""));
    if (cnpj.length !== 14) {
      throw new Error("CNPJ inválido para gerar a guia.");
    }
    return { cnpj };
  })
  .handler(async ({ data }): Promise<SolicitarBoletoResult> => {
    return executarSolicitarBoleto(data.cnpj);
  });
