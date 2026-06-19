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

async function healthResponse(): Promise<Response> {
  const { isDbConfigured, getPool } = await import("./lib/db-mysql");
  const configured = isDbConfigured();
  let connected = false;
  let dbError: string | undefined;

  if (configured) {
    try {
      const pool = getPool();
      await pool.query("SELECT 1");
      connected = true;
    } catch (error) {
      dbError = error instanceof Error ? error.message : String(error);
    }
  }

  const body = {
    ok: configured && connected,
    db: {
      configured,
      connected,
      host: process.env.DB_HOST ?? null,
      name: process.env.DB_NAME ?? null,
      error: dbError ?? null,
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

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return new Response(renderErrorPage(), {
        status: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }
  },
};
