import { z } from "zod";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

export const MOTIVOS_CANCELAMENTO = [
  { value: "nao_utilizou", label: "Não utilizei o serviço" },
  { value: "nao_atendeu_expectativa", label: "Não atendeu minha expectativa" },
  { value: "dificuldade_uso", label: "Dificuldade em usar a plataforma" },
  { value: "preco", label: "Preço / custo elevado" },
  { value: "demora", label: "Demora no processo / atendimento" },
  { value: "mudanca_plano", label: "Mudei de plano / não preciso mais" },
  { value: "problema_pagamento", label: "Problema com pagamento ou cobrança" },
  { value: "outro", label: "Outro motivo" },
] as const;

export const SERVICOS_ESPERADOS = [
  { value: "credenciamento_sicaf", label: "Credenciamento / habilitação SICAF" },
  { value: "renovacao_sicaf", label: "Renovação do SICAF" },
  { value: "monitoramento_licitacoes", label: "Acompanhamento / monitoramento de licitações" },
  { value: "documentacao", label: "Assessoria documental e certidões" },
  { value: "suporte", label: "Suporte humano contínuo" },
  { value: "certificado_digital", label: "Certificado digital" },
  { value: "outro", label: "Outro serviço" },
] as const;

export const FORMAS_PAGAMENTO = [
  { value: "pix", label: "PIX" },
  { value: "cartao", label: "Cartão de crédito" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência bancária" },
  { value: "nao_lembro", label: "Não lembro / não sei informar" },
] as const;

const trackingSchema = z
  .object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
    gclid: z.string().optional(),
    landing_page: z.string().optional(),
    referrer: z.string().optional(),
    user_agent: z.string().optional(),
  })
  .partial();

export const cancelamentoPayloadSchema = z
  .object({
    clienteId: z.number().int().positive().optional().nullable(),
    documento: z.string().refine((v) => {
      const d = onlyDigits(v);
      return d.length === 11 || d.length === 14;
    }, "Informe um CPF ou CNPJ válido"),
    razaoSocial: z.string().trim().min(2, "Informe a razão social / nome").max(160),
    protocoloCadastro: z.string().trim().max(40).optional().nullable().default(null),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .default("")
      .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), "E-mail inválido"),
    telefone: z.string().trim().max(30).optional().default(""),
    cidade: z.string().trim().max(80).optional().default(""),
    estado: z.string().trim().max(2).optional().default(""),

    motivos: z.array(z.string()).min(1, "Selecione ao menos um motivo"),
    motivoOutro: z.string().trim().max(500).optional().default(""),
    motivoDetalhe: z.string().trim().min(10, "Descreva o motivo com pelo menos 10 caracteres").max(2000),

    servicoEsperado: z.string().min(1, "Informe o serviço esperado"),
    servicoEsperadoOutro: z.string().trim().max(500).optional().default(""),

    formaPagamento: z.string().min(1, "Informe a forma de pagamento"),
    titularPagamento: z.string().trim().min(2, "Informe o titular").max(160),
    chavePix: z.string().trim().max(160).optional().default(""),
    banco: z.string().trim().max(80).optional().default(""),
    agencia: z.string().trim().max(20).optional().default(""),
    conta: z.string().trim().max(30).optional().default(""),
    valorPago: z.string().trim().max(40).optional().default(""),
    dataPagamento: z.string().trim().max(20).optional().default(""),

    desejaMonitoramento: z.boolean(),
    reverterCancelamento: z.boolean(),

    declaracao: z.literal(true, {
      errorMap: () => ({ message: "É necessário confirmar a declaração" }),
    }),

    tracking: trackingSchema.optional().default({}),
  })
  .superRefine((data, ctx) => {
    if (data.motivos.includes("outro") && !data.motivoOutro.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["motivoOutro"],
        message: "Descreva o outro motivo",
      });
    }
    if (data.servicoEsperado === "outro" && !data.servicoEsperadoOutro.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["servicoEsperadoOutro"],
        message: "Descreva o serviço esperado",
      });
    }
    if (data.formaPagamento === "pix" && !data.chavePix.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["chavePix"],
        message: "Informe a chave PIX para reembolso",
      });
    }
    if (
      (data.formaPagamento === "transferencia" || data.formaPagamento === "boleto") &&
      (!data.banco.trim() || !data.agencia.trim() || !data.conta.trim())
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["banco"],
        message: "Informe banco, agência e conta para reembolso",
      });
    }
  });

export type CancelamentoPayload = z.infer<typeof cancelamentoPayloadSchema>;

export type CriarCancelamentoResult =
  | {
      success: true;
      protocolo: string;
      id: number;
      reverterCancelamento: boolean;
      desejaMonitoramento: boolean;
      emailEnviado?: boolean;
      emailErro?: string;
    }
  | { success: false; error: string };
