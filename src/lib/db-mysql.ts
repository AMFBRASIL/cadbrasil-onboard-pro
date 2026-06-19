import mysql from "mysql2/promise";

/**
 * Pool de conexão MySQL (cadastro + consultas no servidor).
 * Carregado apenas em server functions — nunca no bundle do client.
 */

const globalForMysql = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function readDbEnv() {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME?.trim();
  const port = Number(process.env.DB_PORT || 3306);
  const connectionLimit = Number(process.env.DB_POOL_LIMIT || 10);
  const useSsl = process.env.DB_SSL === "true" || process.env.DB_SSL === "1";
  return { host, user, password, database, port, connectionLimit, useSsl };
}

/** Indica se as variáveis mínimas do banco estão configuradas. */
export function isDbConfigured(): boolean {
  const { host, user, password, database } = readDbEnv();
  return Boolean(host && user && password && database);
}

function isConnectionError(e: unknown): boolean {
  if (typeof e !== "object" || e === null || !("code" in e)) return false;
  const code = String((e as { code: unknown }).code);
  return [
    "ECONNREFUSED",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ECONNRESET",
    "EPIPE",
    "PROTOCOL_CONNECTION_LOST",
    "ER_HOST_NOT_PRIVILEGED",
    "ER_ACCESS_DENIED_ERROR",
  ].includes(code);
}

/** Encerra o pool atual (força reconexão na próxima operação). */
export function resetPool(): void {
  const pool = globalForMysql.mysqlPool;
  globalForMysql.mysqlPool = undefined;
  if (pool) void pool.end().catch(() => {});
}

function createPool(): mysql.Pool {
  const { host, user, password, database, port, connectionLimit, useSsl } = readDbEnv();
  if (!host || !user || !password || !database) {
    throw new Error(
      "Variáveis DB_HOST, DB_USER, DB_PASSWORD e DB_NAME são obrigatórias no .env.",
    );
  }

  return mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    waitForConnections: true,
    connectionLimit,
    maxIdle: 10,
    idleTimeout: 60_000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    connectTimeout: 20_000,
    ...(useSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  });
}

export function getPool(): mysql.Pool {
  if (!globalForMysql.mysqlPool) {
    globalForMysql.mysqlPool = createPool();
  }
  return globalForMysql.mysqlPool;
}

/** Obtém conexão com 1 retry após reset do pool em falha de rede. */
export async function getConnection(): Promise<mysql.PoolConnection> {
  const pool = getPool();
  try {
    return await pool.getConnection();
  } catch (first) {
    if (!isConnectionError(first)) throw first;
    console.warn("[db-mysql] reconectando após falha:", first);
    resetPool();
    return await getPool().getConnection();
  }
}

export function mapMysqlErrorMessage(e: unknown): string {
  const code =
    typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";

  if (code === "ER_ACCESS_DENIED_ERROR") {
    return "Credenciais do banco inválidas no servidor. Verifique DB_USER e DB_PASSWORD no .env.";
  }
  if (code === "ER_HOST_NOT_PRIVILEGED") {
    return "MySQL não autoriza este host. Se o banco está no mesmo VPS, use DB_HOST=127.0.0.1 no .env.";
  }
  if (code === "PROTOCOL_CONNECTION_LOST" || code === "ECONNRESET" || code === "EPIPE") {
    return "Conexão com o banco foi interrompida. Tente enviar o cadastro novamente.";
  }
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND") {
    return "Não foi possível alcançar o servidor MySQL. Verifique DB_HOST e DB_PORT no .env do VPS.";
  }
  return "Erro ao processar cadastro. Tente novamente.";
}
