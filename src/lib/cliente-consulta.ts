import { createServerFn } from "@tanstack/react-start";

/** Mantém apenas dígitos (remove máscara de CPF/CNPJ). */
function onlyDigits(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Expressão SQL que normaliza a coluna `documento` (gravada com máscara)
 * removendo pontos, barras, hífens, espaços e sublinhados — para comparar com os
 * dígitos puros informados. Mesma regra usada no sistema legado.
 */
function docNormalizedExpr(column: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}

export type ConsultaDocumentoResult = {
  /** true se o CPF/CNPJ já existe na base de clientes. */
  exists: boolean;
  /** false quando o banco não está configurado no servidor. */
  configured: boolean;
  /** documento (somente dígitos) que foi consultado. */
  documento: string;
};

/**
 * Server function (SOMENTE LEITURA) que verifica se um CPF (11 díg.) ou
 * CNPJ (14 díg.) já está cadastrado na base de clientes.
 *
 * Comportamento "fail-open": se o banco não estiver configurado ou ocorrer erro,
 * retorna `exists: false` para NÃO bloquear o usuário no formulário. O alerta de
 * "já cadastrado" só aparece quando há confirmação positiva no banco.
 *
 * O acesso ao banco (`mysql2`, Node-only) é carregado dinamicamente dentro do
 * handler para nunca vazar para o bundle do client.
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
    const { getPool, isDbConfigured } = await import("./db-mysql");

    if (!isDbConfigured()) {
      return { exists: false, configured: false, documento };
    }

    try {
      const pool = getPool();
      const [rows] = await pool.query(
        `SELECT id FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
        [documento],
      );
      const exists = Array.isArray(rows) && rows.length > 0;
      return { exists, configured: true, documento };
    } catch (error) {
      console.error("[consultarDocumentoExistente]", error);
      // fail-open: não bloqueia o cadastro se a consulta falhar.
      return { exists: false, configured: true, documento };
    }
  });
