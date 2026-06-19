import { loadEnvFile } from "./lib/load-env";

loadEnvFile();

import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

function isServerFnPath(pathname: string): boolean {
  return pathname.startsWith("/_serverFn/");
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!body.includes('"unhandled":true') || !body.includes('"message":"HTTPError"')) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

async function logServerFnError(pathname: string, response: Response): Promise<void> {
  if (!isServerFnPath(pathname) || response.status < 500) return;
  const body = await response.clone().text();
  const captured = consumeLastCapturedError();
  console.error("[serverFn]", pathname, response.status, captured ?? body.slice(0, 500));
}

async function healthResponse(): Promise<Response> {
  const { isDbConfigured, getConnection, getPool, mapMysqlErrorMessage } = await import("./lib/db-mysql");
  const configured = isDbConfigured();
  let connected = false;
  let writeOk = false;
  let dbError: string | undefined;
  let dbCode: string | undefined;

  if (configured) {
    let conn: Awaited<ReturnType<typeof getConnection>> | undefined;
    try {
      conn = await getConnection();
      await conn.query("SELECT 1");
      await conn.beginTransaction();
      await conn.query("SELECT id FROM usuarios LIMIT 1");
      await conn.query("SELECT id FROM clientes LIMIT 1");
      await conn.rollback();
      connected = true;
      writeOk = true;
    } catch (error) {
      dbCode =
        typeof error === "object" && error !== null && "code" in error
          ? String((error as { code: unknown }).code)
          : undefined;
      dbError = mapMysqlErrorMessage(error);
      try {
        await getPool().query("SELECT 1");
        connected = true;
      } catch {
        connected = false;
      }
    } finally {
      if (conn) conn.release();
    }
  }

  const body = {
    ok: configured && connected && writeOk,
    db: {
      configured,
      connected,
      writeOk,
      host: process.env.DB_HOST ?? null,
      name: process.env.DB_NAME ?? null,
      code: dbCode ?? null,
      error: dbError ?? null,
      hint:
        process.env.DB_HOST && process.env.DB_HOST !== "127.0.0.1" && process.env.DB_HOST !== "localhost"
          ? "Se MySQL está no mesmo VPS, tente DB_HOST=127.0.0.1"
          : null,
    },
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? null,
      port: process.env.PORT ?? null,
      cwd: process.cwd(),
    },
  };

  return Response.json(body, { status: body.ok ? 200 : 503 });
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/health") {
      return healthResponse();
    }

    const serverFn = isServerFnPath(pathname);

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      await logServerFnError(pathname, response);
      if (serverFn) return response;
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error("[server]", pathname, error);
      if (serverFn) {
        return Response.json(
          { success: false, error: "Erro interno no servidor. Tente novamente." },
          { status: 500, headers: { "content-type": "application/json" } },
        );
      }
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
