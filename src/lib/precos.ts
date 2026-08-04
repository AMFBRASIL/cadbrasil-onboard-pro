/** Fallback se .env não definir o valor. */
const DEFAULT_TAXA_PROCESSO_ANUAL = 985.5;

function parseValorMonetario(raw: string | undefined | null): number | null {
  if (raw == null) return null;
  const cleaned = String(raw).trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readEnvValor(...keys: string[]): number | null {
  const viteEnv =
    (import.meta as unknown as { env?: Record<string, string | undefined> }).env ??
    {};

  for (const key of keys) {
    const fromVite = parseValorMonetario(viteEnv[key]);
    if (fromVite != null) return fromVite;

    if (typeof process !== "undefined") {
      const fromProcess = parseValorMonetario(process.env[key]);
      if (fromProcess != null) return fromProcess;
    }
  }
  return null;
}

/**
 * Taxa / valor anual do processo SICAF (conclusão, modal, fallback do boleto).
 * Fonte: VITE_TAXA_PROCESSO_ANUAL ou TAXA_PROCESSO_ANUAL no .env
 */
export function getTaxaProcessoAnual(): number {
  return (
    readEnvValor("VITE_TAXA_PROCESSO_ANUAL", "TAXA_PROCESSO_ANUAL") ??
    DEFAULT_TAXA_PROCESSO_ANUAL
  );
}

/**
 * Pacote base da proposta / licença CADBRASIL.
 * Fonte: VITE_PROPOSTA_BASE_ANUAL ou PROPOSTA_BASE_ANUAL; senão usa a taxa do processo.
 */
export function getPropostaBaseAnual(): number {
  return (
    readEnvValor("VITE_PROPOSTA_BASE_ANUAL", "PROPOSTA_BASE_ANUAL") ??
    getTaxaProcessoAnual()
  );
}

export function formatValorBrl(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatTaxaProcessoAnual(): string {
  return formatValorBrl(getTaxaProcessoAnual());
}
