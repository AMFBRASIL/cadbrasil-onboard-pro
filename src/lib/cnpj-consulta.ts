import { createServerFn } from "@tanstack/react-start";
import type { CnpjLookupResult } from "./cnpj-lookup";

export type ConsultaCnpjResult =
  | { ok: true; data: CnpjLookupResult }
  | { ok: false; error: string };

/**
 * Server function que consulta os dados oficiais de um CNPJ na CNPJ.ws.
 * O acesso (token + fetch) fica no servidor; o client recebe só o resultado.
 */
export const consultarCnpj = createServerFn({ method: "GET" })
  .inputValidator((cnpj: string) => {
    const digits = String(cnpj ?? "").replace(/\D/g, "");
    if (digits.length !== 14) throw new Error("CNPJ inválido");
    return digits;
  })
  .handler(async ({ data: cnpj }): Promise<ConsultaCnpjResult> => {
    const { fetchCnpjFromProvider } = await import("./cnpj-lookup");
    try {
      const data = await fetchCnpjFromProvider(cnpj);
      if (!data) return { ok: false, error: "CNPJ não localizado" };
      return { ok: true, data };
    } catch (err) {
      const message = err instanceof Error ? err.message : "";
      if (message === "RATE_LIMIT") {
        return { ok: false, error: "Muitas consultas em sequência. Aguarde alguns segundos." };
      }
      return { ok: false, error: "Erro ao consultar CNPJ" };
    }
  });
