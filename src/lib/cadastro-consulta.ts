import { createServerFn } from "@tanstack/react-start";
import type { ConsultaProtocoloResult } from "./cadastro-consulta-types";
import { normalizeProtocolo } from "./protocolo-validation";

export type {
  CadastroPorProtocolo,
  ConsultaProtocoloResult,
  SicafNivelResumo,
} from "./cadastro-consulta-types";

/**
 * Server function (GET) — mesma regra do legado GET /api/cadastro/[protocolo].
 */
export const consultarCadastroPorProtocolo = createServerFn({ method: "GET" })
  .inputValidator((protocolo: string) => {
    const normalized = normalizeProtocolo(protocolo);
    if (!normalized) throw new Error("Protocolo inválido.");
    return normalized;
  })
  .handler(async ({ data: protocolo }): Promise<ConsultaProtocoloResult> => {
    const { buscarCadastroPorProtocolo } = await import("./cadastro-consulta.server");
    return buscarCadastroPorProtocolo(protocolo);
  });
