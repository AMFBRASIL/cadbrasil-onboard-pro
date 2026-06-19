import { z } from "zod";

export function isValidCPF(raw: string): boolean {
  const cpf = (raw || "").replace(/\D/g, "");
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf[i], 10) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== parseInt(cpf[9], 10)) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf[i], 10) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === parseInt(cpf[10], 10);
}

const cnaeItemSchema = z.object({
  codigo: z.string().trim().min(1).max(10),
  descricao: z.string().trim().min(1).max(255),
  tipo: z.enum(["principal", "secundario"]),
});

/** Parâmetros de campanha/tracking capturados da URL (Google/Bing/Meta). */
const trackingSchema = z
  .object({
    utm_source: z.string().optional(),
    utm_medium: z.string().optional(),
    utm_campaign: z.string().optional(),
    utm_term: z.string().optional(),
    utm_content: z.string().optional(),
    gclid: z.string().optional(),
    gbraid: z.string().optional(),
    wbraid: z.string().optional(),
    gad_source: z.string().optional(),
    gad_campaignid: z.string().optional(),
    msclkid: z.string().optional(),
    fbclid: z.string().optional(),
    landing_page: z.string().optional(),
    referrer: z.string().optional(),
    user_agent: z.string().optional(),
  })
  .partial();

export type TrackingPayload = z.infer<typeof trackingSchema>;

export const cadastroPayloadSchema = z
  .object({
    tipoPessoa: z.enum(["PJ", "PF"]),
    cnpj: z.string().optional().default(""),
    razaoSocial: z.string().trim().max(160).optional().default(""),
    nomeFantasia: z.string().trim().max(160).optional().default(""),
    inscricaoEstadual: z.string().trim().max(30).optional().default(""),
    porte: z.string().optional().default(""),
    segmento: z.string().trim().max(160).optional().default(""),
    cnaes: z.array(cnaeItemSchema).optional().default([]),

    nomeResponsavel: z.string().trim().min(2, "Informe o nome").max(120),
    cpf: z.string().optional().default(""),
    cargo: z.string().trim().max(60).optional().default(""),
    telefone: z.string().refine((v) => v.replace(/\D/g, "").length >= 10, "Telefone inválido"),
    email: z.string().trim().email("E-mail inválido").max(160),

    cep: z.string().refine((v) => v.replace(/\D/g, "").length === 8, "CEP inválido"),
    rua: z.string().trim().min(2, "Informe a rua").max(160),
    numero: z.string().trim().min(1, "Nº").max(10),
    complemento: z.string().trim().max(60).optional().default(""),
    bairro: z.string().trim().min(2, "Informe o bairro").max(80),
    cidade: z.string().trim().min(2, "Informe a cidade").max(80),
    estado: z.string().trim().length(2, "UF"),

    emailAcesso: z.string().trim().email("E-mail de acesso inválido").max(160),
    senha: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres")
      .max(128)
      .refine((v) => /[A-Z]/.test(v), "Senha deve conter letra maiúscula")
      .refine((v) => /[a-z]/.test(v), "Senha deve conter letra minúscula")
      .refine((v) => /\d/.test(v), "Senha deve conter número")
      .refine((v) => /[^A-Za-z0-9]/.test(v), "Senha deve conter símbolo"),

    tracking: trackingSchema.optional().default({}),
  })
  .superRefine((data, ctx) => {
    if (data.tipoPessoa === "PJ") {
      if (!data.cnpj || data.cnpj.replace(/\D/g, "").length !== 14)
        ctx.addIssue({ code: "custom", path: ["cnpj"], message: "CNPJ inválido" });
      if (!data.razaoSocial || data.razaoSocial.trim().length < 2)
        ctx.addIssue({ code: "custom", path: ["razaoSocial"], message: "Informe a razão social" });
      if (!data.cpf || !isValidCPF(data.cpf))
        ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF do responsável inválido" });
    } else {
      if (!data.cpf || !isValidCPF(data.cpf))
        ctx.addIssue({ code: "custom", path: ["cpf"], message: "CPF inválido" });
    }
  });

export type CadastroPayload = z.infer<typeof cadastroPayloadSchema>;

export type CriarCadastroResult =
  | { success: true; protocolo: string; idCliente: number; idUsuario: number }
  | { success: false; error: string };
