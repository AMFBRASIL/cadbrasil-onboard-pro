/**
 * Envio de e-mail via API HTTP (send.cadbr.com.br / sendCron), portado do sistema
 * legado (Antigo/src/lib/email-api.ts) e adaptado para este projeto.
 *
 * IMPORTANTE: este módulo é server-only (faz fetch externo e lê templates do
 * MySQL). Deve ser carregado dinamicamente apenas dentro do handler da server
 * function de cadastro — nunca importado por código client.
 */

export type EmailApiPayload = {
  email_destino: string;
  nome_destino: string;
  assunto: string;
  corpo_html: string;
  corpo_texto: string;
  prioridade: 1;
  max_tentativas: 3;
  id_dominio: null;
  data_agendamento: null;
};

export function escapeHtml(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** API considerada não configurada (placeholder em .env). */
export function isEmailApiPlaceholder(): boolean {
  const raw = process.env.EMAIL_API_URL?.trim() || "";
  return raw.includes("your-");
}

export function getEmailApiUrl(): string {
  const raw = process.env.EMAIL_API_URL?.trim();
  if (raw && !raw.includes("your-") && raw.length > 0) return raw;
  return "https://send.cadbr.com.br/sendCron";
}

function getPortalAccessUrl(): string {
  const url = process.env.PORTAL_URL?.trim();
  if (url) return url;
  return "https://fornecedor.cadbrasil.com.br";
}

function renderPlaceholders(
  template: string,
  vars: Record<string, string>,
  opts?: { escapeValues?: boolean },
): string {
  const map = Object.entries(vars).reduce<Record<string, string>>((acc, [k, v]) => {
    acc[k.toLowerCase()] = v ?? "";
    return acc;
  }, {});
  return template.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (full, key: string) => {
    const val = map[key.toLowerCase()];
    if (val === undefined) return full;
    return opts?.escapeValues ? escapeHtml(val) : val;
  });
}

type EmailTemplateRow = {
  id: number;
  nome: string;
  assunto: string | null;
  corpo_html: string | null;
  ativo: number;
};

async function getTemplateFromDb(templateId: number): Promise<EmailTemplateRow | null> {
  try {
    const { getPool, isDbConfigured } = await import("./db-mysql");
    if (!isDbConfigured()) return null;
    type RowDataPacket = import("mysql2").RowDataPacket;
    const pool = getPool();
    const [rows] = await pool.query<(EmailTemplateRow & RowDataPacket)[]>(
      "SELECT id, nome, assunto, corpo_html, ativo FROM templates_email WHERE id = ? LIMIT 1",
      [templateId],
    );
    if (!rows.length) return null;
    const row = rows[0];
    if (!row.ativo || !row.corpo_html) return null;
    return row;
  } catch (e) {
    console.warn(`[email] Falha ao carregar template id=${templateId} (usando fallback):`, e);
    return null;
  }
}

export async function postSendCron(payload: EmailApiPayload): Promise<unknown> {
  if (isEmailApiPlaceholder()) {
    throw new Error("EMAIL_API_URL contém placeholder (your-); envio desativado.");
  }
  const url = getEmailApiUrl();
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timeoutMs = 30_000;
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (e) {
      lastError = e;
      const retryable = isRetryableFetchError(e);
      const isLast = attempt === maxAttempts;
      console.warn(
        `[email] postSendCron tentativa ${attempt}/${maxAttempts} falhou` +
          (retryable && !isLast ? " (retry...)" : ""),
        formatFetchError(e),
      );
      if (!retryable || isLast) break;
      await sleep(attempt * 1500);
    } finally {
      clearTimeout(t);
    }
  }

  throw lastError;
}

function isRetryableFetchError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  if (e.name === "AbortError") return true;
  const cause = (e as Error & { cause?: { code?: string } }).cause;
  const code = cause?.code ?? "";
  return (
    e.message.includes("fetch failed") ||
    code === "ETIMEDOUT" ||
    code === "ECONNRESET" ||
    code === "ECONNREFUSED" ||
    code === "ENOTFOUND"
  );
}

function formatFetchError(e: unknown): string {
  if (!(e instanceof Error)) return String(e);
  const cause = (e as Error & { cause?: { code?: string; message?: string } }).cause;
  const code = cause?.code ? ` [${cause.code}]` : "";
  return `${e.message}${code}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ─── E-mail ao cliente: Início do processo (com protocolo) ─── */

type InicioProcessoData = {
  emailResponsavel: string;
  nomeResponsavel: string;
  razaoSocial: string;
  protocolo: string;
  emailAcesso: string;
  servicoLabel: string;
};

function assuntoInicioProcesso(protocolo: string): string {
  return `CADBRASIL — Cadastro inicial concluído | Próxima etapa: Documentação SICAF (${protocolo})`;
}

function getInicioProcessoHtml(d: InicioProcessoData): string {
  const nome = escapeHtml(d.nomeResponsavel);
  const empresa = escapeHtml(d.razaoSocial);
  const proto = escapeHtml(d.protocolo);
  const serv = escapeHtml(d.servicoLabel);
  const login = escapeHtml(d.emailAcesso);
  const portal = escapeHtml(getPortalAccessUrl());
  const dataHora = new Date().toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>CADBRASIL — Cadastro inicial concluído</title>
</head>
<body style="margin:0;padding:0;background-color:#e8edf2;font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#e8edf2;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background-color:#ffffff;border:1px solid #c5d0dc;box-shadow:0 2px 8px rgba(26,54,93,0.08);">

          <!-- Barra superior institucional -->
          <tr>
            <td style="background-color:#1a365d;padding:10px 28px;border-bottom:3px solid #d69e2e;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a0aec0;letter-spacing:0.08em;text-transform:uppercase;">
                    Plataforma Oficial de Credenciamento de Fornecedores
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a0aec0;">
                    ${escapeHtml(dataHora)}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cabeçalho -->
          <tr>
            <td style="background:linear-gradient(180deg,#1a365d 0%,#2c5282 100%);padding:32px 28px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="56" valign="top">
                    <div style="width:48px;height:48px;background-color:#d69e2e;border-radius:4px;text-align:center;line-height:48px;font-size:22px;color:#1a365d;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">&#9878;</div>
                  </td>
                  <td valign="top" style="padding-left:14px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#90cdf4;letter-spacing:0.14em;text-transform:uppercase;font-weight:600;">CADBRASIL</p>
                    <h1 style="margin:4px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:22px;color:#ffffff;font-weight:700;line-height:1.3;">
                      Credenciamento Nacional de Fornecedores
                    </h1>
                    <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#bee3f8;line-height:1.5;">
                      Sistema de Cadastramento Unificado de Fornecedores — SICAF
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Selo de status -->
          <tr>
            <td style="padding:24px 28px 0;">
              <table role="presentation" cellspacing="0" cellpadding="0" style="background-color:#f0fff4;border:1px solid #9ae6b4;border-left:4px solid #276749;border-radius:2px;width:100%;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#276749;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">
                      &#10003; Cadastro Inicial Concluído com Sucesso
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Corpo principal -->
          <tr>
            <td style="padding:24px 28px 8px;font-family:Georgia,'Times New Roman',serif;color:#2d3748;font-size:15px;line-height:1.75;">
              <p style="margin:0 0 16px;">Prezado(a) <strong style="color:#1a365d;">${nome}</strong>,</p>
              <p style="margin:0 0 16px;">
                Informamos que o <strong>cadastro inicial</strong> da empresa
                <strong style="color:#1a365d;">${empresa}</strong> foi registrado com sucesso
                em nossa plataforma de credenciamento CADBRASIL/SICAF.
              </p>
              <p style="margin:0 0 20px;">
                Para concluir a habilitação e permitir a participação em licitações públicas,
                é necessário prosseguir com a <strong>próxima etapa: envio e validação da
                documentação exigida pelo SICAF</strong>.
              </p>
            </td>
          </tr>

          <!-- Protocolo -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#ebf4ff;border:1px solid #90cdf4;border-radius:2px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2c5282;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;">
                      Número do Protocolo
                    </p>
                    <p style="margin:0;font-family:'Courier New',Courier,monospace;font-size:20px;color:#1a365d;font-weight:700;letter-spacing:0.04em;">
                      ${proto}
                    </p>
                    <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4a5568;">
                      Guarde este número para consultas e acompanhamento do processo.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Linha do tempo / etapas -->
          <tr>
            <td style="padding:0 28px 24px;">
              <p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#4a5568;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">
                Andamento do Processo
              </p>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="48%" valign="top" style="background-color:#f0fff4;border:1px solid #9ae6b4;border-radius:2px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#276749;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Etapa 1 — Concluída</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2d3748;font-weight:600;">Cadastro Inicial</p>
                    <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#276749;">&#10003; Dados cadastrais registrados</p>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" valign="top" style="background-color:#fffaf0;border:2px solid #d69e2e;border-radius:2px;padding:14px 16px;">
                    <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#b7791f;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;">Etapa 2 — Pendente</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2d3748;font-weight:600;">Documentação SICAF</p>
                    <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#b7791f;">&#9654; Ação necessária</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Próximos passos -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f7fafc;border:1px solid #e2e8f0;border-radius:2px;">
                <tr>
                  <td style="padding:18px 20px;">
                    <p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#1a365d;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;">
                      Próximos Passos
                    </p>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                      <tr>
                        <td valign="top" width="28" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2c5282;font-weight:700;padding:4px 0;">1.</td>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4a5568;line-height:1.6;padding:4px 0 10px;">
                          Acesse o <strong>Portal do Fornecedor</strong> com o e-mail <strong>${login}</strong> e a senha definida no cadastro.
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="28" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2c5282;font-weight:700;padding:4px 0;">2.</td>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4a5568;line-height:1.6;padding:4px 0 10px;">
                          Envie a <strong>documentação exigida pelo SICAF</strong> (certidões, contrato social, dados bancários e demais documentos de habilitação).
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="28" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2c5282;font-weight:700;padding:4px 0;">3.</td>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4a5568;line-height:1.6;padding:4px 0 10px;">
                          Aguarde a <strong>análise e validação</strong> pela equipe CADBRASIL. Você será notificado sobre o andamento.
                        </td>
                      </tr>
                      <tr>
                        <td valign="top" width="28" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2c5282;font-weight:700;padding:4px 0;">4.</td>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#4a5568;line-height:1.6;padding:4px 0;">
                          Após aprovação, sua empresa estará <strong>habilitada para participar de licitações públicas</strong>.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Resumo -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;border:1px solid #e2e8f0;">
                <tr style="background-color:#f7fafc;">
                  <td colspan="2" style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1a365d;letter-spacing:0.06em;text-transform:uppercase;font-weight:700;border-bottom:1px solid #e2e8f0;">
                    Resumo do Cadastro
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#718096;border-bottom:1px solid #edf2f7;width:38%;">Empresa</td>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2d3748;font-weight:600;border-bottom:1px solid #edf2f7;">${empresa}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#718096;border-bottom:1px solid #edf2f7;">Serviço</td>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2d3748;border-bottom:1px solid #edf2f7;">${serv}</td>
                </tr>
                <tr>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#718096;">E-mail de acesso</td>
                  <td style="padding:10px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2d3748;">${login}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 28px 28px;text-align:center;">
              <a href="${portal}" style="display:inline-block;background-color:#1a365d;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;text-decoration:none;padding:14px 36px;border-radius:2px;border-bottom:3px solid #d69e2e;letter-spacing:0.02em;">
                Acessar Portal e Enviar Documentação
              </a>
              <p style="margin:14px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#718096;">
                Ou acesse diretamente: <a href="${portal}" style="color:#2c5282;">${portal}</a>
              </p>
            </td>
          </tr>

          <!-- Aviso -->
          <tr>
            <td style="padding:0 28px 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fffaf0;border-left:4px solid #d69e2e;border-radius:2px;">
                <tr>
                  <td style="padding:14px 18px;">
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#744210;line-height:1.6;">
                      <strong>Importante:</strong> O cadastro inicial não substitui a habilitação completa no SICAF.
                      A documentação deve ser enviada o quanto antes para evitar atrasos na participação em licitações.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Rodapé institucional -->
          <tr>
            <td style="background-color:#1a365d;padding:20px 28px;border-top:3px solid #d69e2e;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#90cdf4;line-height:1.6;">
                    <strong style="color:#ffffff;">CADBRASIL</strong><br/>
                    Credenciamento Nacional de Fornecedores<br/>
                    Assessoria SICAF e Licitações Públicas
                  </td>
                  <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#718096;vertical-align:top;">
                    <span style="color:#a0aec0;">&#128274; LGPD</span><br/>
                    <span style="color:#a0aec0;">&#128274; SSL</span>
                  </td>
                </tr>
                <tr>
                  <td colspan="2" style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#718096;line-height:1.5;border-top:1px solid #2c5282;margin-top:14px;">
                    Este é um comunicado oficial referente ao seu processo de credenciamento.
                    Em caso de dúvidas, responda este e-mail ou entre em contato com nosso suporte.
                    Não compartilhe sua senha de acesso com terceiros.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function getInicioProcessoText(d: InicioProcessoData): string {
  return [
    "CADBRASIL — Credenciamento Nacional de Fornecedores",
    "Sistema de Cadastramento Unificado de Fornecedores (SICAF)",
    "",
    `[CONCLUÍDO] Cadastro Inicial`,
    "",
    `Prezado(a) ${d.nomeResponsavel},`,
    "",
    `Informamos que o cadastro inicial da empresa ${d.razaoSocial} foi registrado com sucesso.`,
    "",
    `PROTOCOLO: ${d.protocolo}`,
    `(Guarde este número para consultas e acompanhamento)`,
    "",
    "ANDAMENTO DO PROCESSO:",
    "  Etapa 1 — Cadastro Inicial ........... CONCLUÍDA",
    "  Etapa 2 — Documentação SICAF ........ PENDENTE (ação necessária)",
    "",
    "PRÓXIMOS PASSOS:",
    `  1. Acesse o Portal do Fornecedor: ${getPortalAccessUrl()}`,
    `  2. Faça login com o e-mail ${d.emailAcesso} e a senha definida no cadastro`,
    "  3. Envie a documentação exigida pelo SICAF (certidões, contrato social, etc.)",
    "  4. Aguarde a análise e validação pela equipe CADBRASIL",
    "",
    `Serviço: ${d.servicoLabel}`,
    "",
    "IMPORTANTE: O cadastro inicial não substitui a habilitação completa no SICAF.",
    "A documentação deve ser enviada o quanto antes.",
    "",
    "CADBRASIL — Assessoria SICAF e Licitações Públicas",
  ].join("\n");
}

/** E-mail de início de processo ao cliente. Falha → throw (caller faz catch). */
export async function enviarEmailInicioProcesso(d: InicioProcessoData): Promise<void> {
  if (isEmailApiPlaceholder()) {
    console.warn("[email] Envio de início de processo ignorado: EMAIL_API_URL é placeholder.");
    return;
  }

  const vars: Record<string, string> = {
    nome: d.nomeResponsavel,
    email: d.emailAcesso,
    empresa: d.razaoSocial,
    perfil: d.servicoLabel,
    link_acesso: getPortalAccessUrl(),
    protocolo: d.protocolo,
    servico: d.servicoLabel,
  };

  // Usa o template institucional embutido por padrão. Só consulta o banco se
  // EMAIL_TEMPLATE_INICIO_ID estiver explicitamente configurado no .env.
  const templateIdRaw = process.env.EMAIL_TEMPLATE_INICIO_ID?.trim();
  const dbTemplate =
    templateIdRaw && Number.isFinite(Number(templateIdRaw))
      ? await getTemplateFromDb(Number(templateIdRaw))
      : null;

  const assunto = dbTemplate?.assunto
    ? renderPlaceholders(dbTemplate.assunto, vars, { escapeValues: false })
    : assuntoInicioProcesso(d.protocolo);
  const corpoHtml = dbTemplate?.corpo_html
    ? renderPlaceholders(dbTemplate.corpo_html, vars, { escapeValues: true })
    : getInicioProcessoHtml(d);

  const payload: EmailApiPayload = {
    email_destino: d.emailResponsavel,
    nome_destino: d.razaoSocial,
    assunto,
    corpo_html: corpoHtml,
    corpo_texto: getInicioProcessoText(d),
    prioridade: 1,
    max_tentativas: 3,
    id_dominio: null,
    data_agendamento: null,
  };

  const result = await postSendCron(payload);
  console.log("[email] Início de processo enviado:", d.emailResponsavel, result);
}

/* ─── Notificação interna (equipe CADBRASIL) ─── */

type NotificacaoInternaData = {
  razaoSocial: string;
  documentoMasked: string;
  protocolo: string;
  servicoLabel: string;
  emailResponsavel: string;
};

function getNotificacaoInternaHtml(d: NotificacaoInternaData): string {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"/></head><body style="font-family:system-ui,sans-serif;padding:16px;">
<h2 style="color:#1e3a5f;">Novo cadastro — CADBRASIL</h2>
<table style="border-collapse:collapse;font-size:14px;">
<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Empresa</td><td><strong>${escapeHtml(d.razaoSocial)}</strong></td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Documento</td><td>${escapeHtml(d.documentoMasked)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Protocolo</td><td>${escapeHtml(d.protocolo)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Serviço</td><td>${escapeHtml(d.servicoLabel)}</td></tr>
<tr><td style="padding:6px 12px 6px 0;color:#64748b;">E-mail responsável</td><td>${escapeHtml(d.emailResponsavel)}</td></tr>
</table>
</body></html>`;
}

/** Notificação interna; não relança erro — retorna resultado. */
export async function enviarEmailNotificacaoInterna(
  d: NotificacaoInternaData,
): Promise<{ success: true } | { success: false; error: string }> {
  const destino = process.env.EMAIL_NOTIFICATION_EMAIL?.trim();
  if (!destino) {
    return { success: false, error: "EMAIL_NOTIFICATION_EMAIL não configurado." };
  }
  if (isEmailApiPlaceholder()) {
    return { success: false, error: "EMAIL_API_URL é placeholder." };
  }
  try {
    const payload: EmailApiPayload = {
      email_destino: destino,
      nome_destino: "Equipe CADBRASIL",
      assunto: `[CADBRASIL] Novo Cadastro - ${d.protocolo}`,
      corpo_html: getNotificacaoInternaHtml(d),
      corpo_texto: [
        "Novo cadastro",
        `Empresa: ${d.razaoSocial}`,
        `Documento: ${d.documentoMasked}`,
        `Protocolo: ${d.protocolo}`,
        `Serviço: ${d.servicoLabel}`,
        `E-mail responsável: ${d.emailResponsavel}`,
      ].join("\n"),
      prioridade: 1,
      max_tentativas: 3,
      id_dominio: null,
      data_agendamento: null,
    };
    await postSendCron(payload);
    console.log("[email] Notificação interna enviada para", destino);
    return { success: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[email] enviarEmailNotificacaoInterna", e);
    return { success: false, error: msg };
  }
}

/* ─── Orquestrador pós-cadastro ─── */

export type PosCadastroEmailData = {
  emailResponsavel: string;
  nomeResponsavel: string;
  razaoSocial: string;
  documentoMasked: string;
  emailAcesso: string;
  protocolo: string;
  servicoLabel: string;
  notificarEquipe?: boolean;
};

/**
 * Dispara, após o cadastro: e-mail de início de processo ao cliente e (opcional)
 * notificação interna à equipe. Envio sequencial (cliente primeiro) para evitar
 * timeouts por requisições paralelas à API.
 */
export async function dispararEmailsPosCadastro(d: PosCadastroEmailData): Promise<void> {
  // 1) E-mail ao cliente — prioridade máxima
  try {
    await enviarEmailInicioProcesso({
      emailResponsavel: d.emailResponsavel,
      nomeResponsavel: d.nomeResponsavel,
      razaoSocial: d.razaoSocial,
      protocolo: d.protocolo,
      emailAcesso: d.emailAcesso,
      servicoLabel: d.servicoLabel,
    });
  } catch (e) {
    console.error("[email] enviarEmailInicioProcesso", formatFetchError(e));
  }

  // 2) Notificação interna — após o e-mail do cliente
  if (d.notificarEquipe !== false) {
    const r = await enviarEmailNotificacaoInterna({
      razaoSocial: d.razaoSocial,
      documentoMasked: d.documentoMasked,
      protocolo: d.protocolo,
      servicoLabel: d.servicoLabel,
      emailResponsavel: d.emailResponsavel,
    });
    if (r.success === false) console.warn("[email] notificação interna:", r.error);
  }
}
