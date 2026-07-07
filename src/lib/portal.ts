const DEFAULT_PORTAL_URL = "https://fornecedor.cadbrasil.com.br";

/** URL do Portal do Fornecedor (client-safe via VITE_PORTAL_URL). */
export function getPortalUrl(): string {
  const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
  const url = env.VITE_PORTAL_URL?.trim();
  return url || DEFAULT_PORTAL_URL;
}

/** Link principal para envio de documentos / acesso pós-cadastro. */
export function getPortalDocumentosUrl(): string {
  const base = getPortalUrl().replace(/\/$/, "");
  return `${base}/auth`;
}

/** Recuperação de senha no Portal do Fornecedor. */
export function getPortalEsqueciSenhaUrl(): string {
  const base = getPortalUrl().replace(/\/$/, "");
  return `${base}/esqueci-senha`;
}

/** Central de Ajuda dentro do Portal do Fornecedor. */
export function getPortalCentralAjudaUrl(): string {
  const base = getPortalUrl().replace(/\/$/, "");
  return `${base}/ajuda`;
}

/** Página Assistente SICAF no Portal do Fornecedor. */
export function getPortalAssistenteSicafUrl(): string {
  const base = getPortalUrl().replace(/\/$/, "");
  return `${base}/assistente`;
}

/** Login oficial do SICAF (gov.br / certificado digital). */
export const SICAF_LOGIN_URL =
  "https://www3.comprasnet.gov.br/seguro/loginPortalFornecedor.asp";
