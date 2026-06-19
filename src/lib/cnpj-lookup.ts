import { dedupeCnaes, normalizeCnaeCodigo, principalCnaeCodigo, type CnaeItem } from "./cnae";

export type CnpjLookupResult = {
  razao_social: string;
  nome_fantasia: string;
  inscricao_estadual: string;
  porte: string;
  porte_label: string;
  situacao: string;
  data_abertura: string;
  natureza_juridica: string;
  cnae_principal_codigo: string;
  cnae_fiscal_descricao: string;
  cnaes: CnaeItem[];
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  municipio: string;
  uf: string;
  ddd_telefone_1: string;
  email: string;
};

type OpenCnpjCnae = {
  codigo?: string | null;
  descricao?: string | null;
  is_principal?: boolean | null;
};

type OpenCnpjTelefone = {
  ddd?: string | null;
  numero?: string | null;
  is_fax?: boolean | null;
};

type OpenCnpjResponse = {
  cnpj?: string | null;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  situacao_cadastral?: string | null;
  data_inicio_atividade?: string | null;
  cnae_principal?: string | null;
  cnaes?: OpenCnpjCnae[] | null;
  natureza_juridica?: string | null;
  tipo_logradouro?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cep?: string | null;
  uf?: string | null;
  municipio?: string | null;
  email?: string | null;
  telefones?: OpenCnpjTelefone[] | null;
  porte_empresa?: string | null;
};

export function onlyDigitsCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

/** Normaliza o porte (texto da Receita) para o conjunto usado internamente. */
function normalizePorte(descricao?: string | null): string {
  const normalized = (descricao || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (normalized.includes("micro empreendedor") || normalized.includes("mei")) return "MEI";
  if (normalized.includes("pequeno")) return "EPP";
  if (normalized.includes("micro")) return "ME";
  return "MEDIA";
}

/** Label amigável do porte para exibição no formulário. */
function porteLabel(codigo: string, descricaoOriginal?: string | null): string {
  switch (codigo) {
    case "MEI":
      return "MEI - Microempreendedor Individual";
    case "ME":
      return "ME - Microempresa";
    case "EPP":
      return "EPP - Empresa de Pequeno Porte";
    default:
      return descricaoOriginal?.trim() || "Demais (Médio/Grande porte)";
  }
}

function buildLogradouro(tipo?: string | null, logradouro?: string | null): string {
  const t = (tipo || "").trim();
  const l = (logradouro || "").trim();
  // Evita duplicar o tipo quando o logradouro já começa com ele (ex.: "QUADRA SAUN...").
  if (t && l && l.toUpperCase().startsWith(t.toUpperCase())) return l;
  return [t, l].filter(Boolean).join(" ").trim();
}

function extractCnaes(items: OpenCnpjCnae[] | null | undefined): CnaeItem[] {
  if (!items?.length) return [];
  const mapped: CnaeItem[] = items
    .map((item) => ({
      codigo: normalizeCnaeCodigo(item.codigo),
      descricao: (item.descricao || "").trim(),
      tipo: (item.is_principal ? "principal" : "secundario") as CnaeItem["tipo"],
    }))
    .filter((item) => item.codigo && item.descricao);
  return dedupeCnaes(mapped);
}

function pickTelefone(telefones?: OpenCnpjTelefone[] | null): string {
  if (!telefones?.length) return "";
  const tel = telefones.find((t) => !t.is_fax) ?? telefones[0];
  if (!tel) return "";
  return `${tel.ddd || ""}${tel.numero || ""}`.trim();
}

/**
 * Consulta os dados do CNPJ na API pública OpenCNPJ (https://opencnpj.org).
 * Gratuita e sem token. Limite de 100 req/min. Dados de domínio público (Receita).
 */
export async function fetchCnpjFromProvider(cnpj: string): Promise<CnpjLookupResult | null> {
  const digits = onlyDigitsCnpj(cnpj);
  if (digits.length !== 14) return null;

  const response = await fetch(`https://api.opencnpj.org/${digits}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    if (response.status === 429) throw new Error("RATE_LIMIT");
    return null;
  }

  const data = (await response.json()) as OpenCnpjResponse;
  const cnaes = extractCnaes(data.cnaes);
  const principalCodigo = principalCnaeCodigo(cnaes) || normalizeCnaeCodigo(data.cnae_principal) || "";
  const principalDescricao = cnaes.find((c) => c.tipo === "principal")?.descricao || "";
  const porteCodigo = normalizePorte(data.porte_empresa);

  return {
    razao_social: data.razao_social || "",
    nome_fantasia: data.nome_fantasia || "",
    inscricao_estadual: "",
    porte: porteCodigo,
    porte_label: porteLabel(porteCodigo, data.porte_empresa),
    situacao: data.situacao_cadastral || "",
    data_abertura: data.data_inicio_atividade || "",
    natureza_juridica: data.natureza_juridica || "",
    cnae_principal_codigo: principalCodigo,
    cnae_fiscal_descricao: principalDescricao,
    cnaes,
    cep: data.cep || "",
    logradouro: buildLogradouro(data.tipo_logradouro, data.logradouro),
    numero: data.numero || "",
    complemento: data.complemento || "",
    bairro: data.bairro || "",
    municipio: data.municipio || "",
    uf: data.uf || "",
    ddd_telefone_1: pickTelefone(data.telefones),
    email: data.email || "",
  };
}

/** Mapeia código de porte para um label amigável (uso no client). */
export function mapPorteLabel(codigo: string): string {
  return porteLabel(codigo, null);
}
