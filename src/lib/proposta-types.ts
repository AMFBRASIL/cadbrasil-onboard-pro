import { z } from "zod";
import {
  PROPOSTA_BASE_ANUAL,
  PROPOSTA_MODULOS_OPCIONAIS,
  calcularTotalProposta,
} from "./proposta-modulos";

const moduloSnapshotSchema = z.object({
  id: z.string().min(1).max(80),
  nome: z.string().min(1).max(160),
  precoAnual: z.number().min(0),
});

export const propostaPayloadSchema = z
  .object({
    protocoloCadastro: z.string().trim().min(8).max(40),
    modulosExtrasIds: z.array(z.string().min(1).max(80)).default([]),
    observacoes: z.string().trim().max(2000).optional(),
    tracking: z.record(z.string(), z.string()).optional(),
  })
  .superRefine((data, ctx) => {
    const validIds = new Set(PROPOSTA_MODULOS_OPCIONAIS.map((m) => m.id));
    for (const id of data.modulosExtrasIds) {
      if (!validIds.has(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["modulosExtrasIds"],
          message: `Módulo inválido: ${id}`,
        });
      }
    }
  });

export type PropostaPayload = z.infer<typeof propostaPayloadSchema>;

export type CriarPropostaResult =
  | {
      success: true;
      protocoloProposta: string;
      protocoloCadastro: string;
      clienteId: number;
      valorBase: number;
      valorExtras: number;
      valorTotal: number;
      id: number;
    }
  | { success: false; error: string };

export function buildPropostaSnapshot(modulosExtrasIds: string[]) {
  const valorBase = PROPOSTA_BASE_ANUAL;
  const valorTotal = calcularTotalProposta(modulosExtrasIds);
  const valorExtras = valorTotal - valorBase;

  const extras = PROPOSTA_MODULOS_OPCIONAIS.filter((m) =>
    modulosExtrasIds.includes(m.id),
  ).map((m) => ({
    id: m.id,
    nome: m.nome,
    precoAnual: m.precoAnual,
  }));

  return { valorBase, valorExtras, valorTotal, extras };
}

export { moduloSnapshotSchema };
