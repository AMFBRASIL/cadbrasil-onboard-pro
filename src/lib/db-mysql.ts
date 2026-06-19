import mysql from "mysql2/promise";

/**
 * Pool de conexão com o MySQL compartilhado (mesmo banco do portal administrativo).
 *
 * Neste projeto o banco é usado APENAS para leitura (verificar se um CPF/CNPJ já
 * existe). Nenhum pagamento ou escrita é realizado aqui — o cadastro/pagamento
 * efetivos acontecem no admin.
 *
 * IMPORTANTE: este módulo usa `mysql2` (Node-only) e NÃO deve ser importado de
 * código client. Ele é carregado dinamicamente apenas dentro do handler da
 * server function (`cliente-consulta.ts`).
 */

const globalForMysql = globalThis as unknown as {
  mysqlPool: mysql.Pool | undefined;
};

function readDbEnv() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASSWORD;
  const database = process.env.DB_NAME;
  const port = Number(process.env.DB_PORT || 3306);
  const connectionLimit = Number(process.env.DB_POOL_LIMIT || 5);
  return { host, user, password, database, port, connectionLimit };
}

/** Indica se as variáveis mínimas do banco estão configuradas. */
export function isDbConfigured(): boolean {
  const { host, user, password, database } = readDbEnv();
  return Boolean(host && user && password !== undefined && database);
}

function createPool(): mysql.Pool {
  const { host, user, password, database, port, connectionLimit } = readDbEnv();
  if (!host || !user || password === undefined || !database) {
    throw new Error(
      "Variáveis DB_HOST, DB_USER, DB_PASSWORD e DB_NAME são obrigatórias.",
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
    maxIdle: 5000,
    enableKeepAlive: true,
    connectTimeout: 15000,
  });
}

export function getPool(): mysql.Pool {
  if (!globalForMysql.mysqlPool) {
    globalForMysql.mysqlPool = createPool();
  }
  return globalForMysql.mysqlPool;
}
