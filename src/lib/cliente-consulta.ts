import { createServerFn } from "@tanstack/react-start";
import type { ConsultaDocumentoResult } from "./cliente-consulta-types";

export type {
  ClienteExistenteDetalhe,
  ConsultaDocumentoResult,
  EtapaSicaf,
  EtapaSicafStatus,
} from "./cliente-consulta-types";

function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Verifica se CPF/CNPJ já existe e, quando existir, retorna o status das etapas SICAF.
 */
export const consultarDocumentoExistente = createServerFn({ method: "GET" })
  .inputValidator((documento: string) => {
    const digits = onlyDigits(String(documento ?? ""));
    if (digits.length !== 11 && digits.length !== 14) {
      throw new Error("Documento inválido: informe um CPF (11) ou CNPJ (14).");
    }
    return digits;
  })
  .handler(async ({ data: documento }): Promise<ConsultaDocumentoResult> => {
    const { buscarClientePorDocumento } = await import("./cliente-consulta.server");
    return buscarClientePorDocumento(documento);
  });
