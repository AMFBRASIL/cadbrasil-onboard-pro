import { createServerFn } from "@tanstack/react-start";
import { cadastroPayloadSchema, type CadastroPayload, type CriarCadastroResult } from "./cadastro-types";

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");

function docNormalizedExpr(column: string): string {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}

function iniciaisNome(nome: string): string {
  const p = nome.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "??";
  if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
  return (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

/** ENUM porte em clientes: MEI, ME, EPP, Média, Grande. */
function mapPorteSql(porte: string | undefined): string {
  const p = (porte || "").toUpperCase();
  if (p === "MEDIA") return "Média";
  if (p === "GRANDE") return "Grande";
  if (p === "MEI" || p === "ME" || p === "EPP") return p;
  return "ME";
}

function montarObservacoes(protocolo: string, data: CadastroPayload): string {
  const lines = [
    `Protocolo: ${protocolo}`,
    "Origem: site",
    "Tipo de serviço: novo",
  ];
  if (data.segmento?.trim()) lines.push(`Segmento: ${data.segmento.trim()}`);
  return lines.join("\n");
}

function isMysqlBadField(e: unknown): boolean {
  return typeof e === "object" && e !== null && "errno" in e && (e as { errno: number }).errno === 1054;
}

function isMysqlDup(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code: string }).code === "ER_DUP_ENTRY"
  );
}

type ResultSetHeader = import("mysql2").ResultSetHeader;
type RowDataPacket = import("mysql2").RowDataPacket;
type PoolConnection = import("mysql2/promise").PoolConnection;
type MysqlPool = import("mysql2/promise").Pool;

async function insertCliente(
  c: PoolConnection,
  p: {
    idUsuario: number;
    tipoDoc: string;
    docMasked: string;
    razao: string;
    nomeFantasia: string | null;
    ie: string | null;
    emailResponsavel: string;
    telefone: string | null;
    rua: string | null;
    numero: string | null;
    complemento: string | null;
    bairro: string | null;
    cidade: string;
    estado: string;
    cep: string;
    porteSql: string;
    ramo: string | null;
    cnaePrincipal: string | null;
    nomeResponsavel: string;
    cpfRespDigits: string | null;
    observacoes: string;
    protocolo: string;
  },
): Promise<number> {
  const baseCols = `usuario_id, tipo_documento, documento, razao_social, nome_fantasia, inscricao_estadual,
    email, telefone, celular, endereco, numero, complemento, bairro, cidade, estado, cep,
    porte, ramo_atividade, cnae_principal,
    responsavel_nome, responsavel_cpf, responsavel_email, responsavel_telefone,
    status, observacoes, protocolo_cadbrasil`;
  const baseVals = [
    p.idUsuario, p.tipoDoc, p.docMasked, p.razao, p.nomeFantasia, p.ie,
    p.emailResponsavel, p.telefone, p.telefone, p.rua, p.numero, p.complemento, p.bairro, p.cidade, p.estado, p.cep,
    p.porteSql, p.ramo, p.cnaePrincipal,
    p.nomeResponsavel, p.cpfRespDigits, p.emailResponsavel, p.telefone,
    "Ativo", p.observacoes, p.protocolo,
  ];
  try {
    const [r] = await c.execute<ResultSetHeader>(
      `INSERT INTO clientes (${baseCols}) VALUES (${baseVals.map(() => "?").join(",")})`,
      baseVals,
    );
    return r.insertId;
  } catch (e) {
    if (!isMysqlBadField(e)) throw e;
  }
  const cols2 = `usuario_id, tipo_documento, documento, razao_social, nome_fantasia, inscricao_estadual,
    email, telefone, celular, endereco, numero, complemento, bairro, cidade, estado, cep,
    porte, ramo_atividade,
    responsavel_nome, responsavel_cpf, responsavel_email, responsavel_telefone,
    status, observacoes, protocolo_cadbrasil`;
  const vals2 = [
    p.idUsuario, p.tipoDoc, p.docMasked, p.razao, p.nomeFantasia, p.ie,
    p.emailResponsavel, p.telefone, p.telefone, p.rua, p.numero, p.complemento, p.bairro, p.cidade, p.estado, p.cep,
    p.porteSql, p.ramo,
    p.nomeResponsavel, p.cpfRespDigits, p.emailResponsavel, p.telefone,
    "Ativo", p.observacoes, p.protocolo,
  ];
  const [r2] = await c.execute<ResultSetHeader>(
    `INSERT INTO clientes (${cols2}) VALUES (${vals2.map(() => "?").join(",")})`,
    vals2,
  );
  return r2.insertId;
}

async function insertContato(
  c: PoolConnection,
  clienteId: number,
  d: { nome: string; cpf: string | null; cargo: string | null; email: string; telefone: string | null },
): Promise<void> {
  // Schema atual não tem coluna cpf — tenta sem cpf primeiro.
  try {
    await c.execute<ResultSetHeader>(
      `INSERT INTO cliente_contatos (cliente_id, nome, cargo, email, telefone, principal) VALUES (?,?,?,?,?,1)`,
      [clienteId, d.nome, d.cargo, d.email, d.telefone],
    );
  } catch (e) {
    if (!isMysqlBadField(e)) throw e;
    await c.execute<ResultSetHeader>(
      `INSERT INTO cliente_contatos (cliente_id, nome, cpf, cargo, email, telefone, principal) VALUES (?,?,?,?,?,?,1)`,
      [clienteId, d.nome, d.cpf, d.cargo, d.email, d.telefone],
    );
  }
}

async function insertTrackingSessao(
  pool: MysqlPool,
  clienteId: number,
  usuarioId: number,
  tk: NonNullable<CadastroPayload["tracking"]>,
): Promise<void> {
  const norm = (v: string | undefined | null): string | null => {
    const s = (v ?? "").toString().trim();
    return s ? s.slice(0, 500) : null;
  };
  const sessionId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const sql = `INSERT INTO tracking_sessoes (
    session_id, cliente_id, usuario_id,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    gclid, gbraid, wbraid, gad_source, gad_campaignid, fbclid, msclkid, landing_page, referrer,
    user_agent, converted, conversion_type, conversion_at, funnel_step, last_activity_at
  ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,'signup',NOW(),'signup',NOW())`;

  const params = [
    sessionId,
    clienteId,
    usuarioId,
    norm(tk.utm_source),
    norm(tk.utm_medium),
    norm(tk.utm_campaign) ?? norm(tk.gad_campaignid),
    norm(tk.utm_term),
    norm(tk.utm_content),
    norm(tk.gclid),
    norm(tk.gbraid),
    norm(tk.wbraid),
    norm(tk.gad_source),
    norm(tk.gad_campaignid),
    norm(tk.fbclid),
    norm(tk.msclkid),
    norm(tk.landing_page),
    norm(tk.referrer),
    norm(tk.user_agent),
  ];

  try {
    await pool.execute<ResultSetHeader>(sql, params);
  } catch (e) {
    console.warn("[criarCadastro] tracking_sessoes (não bloqueante)", e);
  }
}

async function executarCriarCadastro(rawInput: unknown): Promise<CriarCadastroResult> {
  const parsed = cadastroPayloadSchema.safeParse(rawInput);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const campo = issue?.path?.length ? ` (${issue.path.join(".")})` : "";
    return { success: false, error: `Dados inválidos: ${issue?.message ?? "verifique os campos"}${campo}` };
  }
  const data = parsed.data;

  const { getConnection, isDbConfigured, mapMysqlErrorMessage } = await import("./db-mysql");
  const { gerarProtocoloCadbrasil } = await import("./protocolo");
  const { principalCnaeCodigo } = await import("./cnae");
  const bcrypt = (await import("bcryptjs")).default;

  if (!isDbConfigured()) {
    console.error("[criarCadastro] DB não configurado — verifique .env (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME)");
    return { success: false, error: "Banco de dados não configurado no servidor. Contate o suporte." };
  }

  const docDigits = data.tipoPessoa === "PJ" ? onlyDigits(data.cnpj) : onlyDigits(data.cpf);
  const docMasked = (data.tipoPessoa === "PJ" ? data.cnpj : data.cpf).trim();
  const tipoDoc = data.tipoPessoa === "PJ" ? "CNPJ" : "CPF";
  const razao = data.tipoPessoa === "PJ" ? data.razaoSocial.trim() : data.nomeResponsavel.trim();
  const emailResponsavel = data.email.trim().toLowerCase();
  const emailAcesso = data.emailAcesso.trim().toLowerCase();
  const telefone = onlyDigits(data.telefone) || null;
  const cpfRespDigits = onlyDigits(data.cpf) || null;
  const porteSql = data.tipoPessoa === "PJ" ? mapPorteSql(data.porte) : "ME";
  const ie = data.tipoPessoa === "PJ" ? data.inscricaoEstadual?.trim() || null : null;
  const cnaePrincipal = data.tipoPessoa === "PJ" ? principalCnaeCodigo(data.cnaes) : null;
  const protocolo = gerarProtocoloCadbrasil();
  const observacoes = montarObservacoes(protocolo, data);
  const senhaHash = await bcrypt.hash(data.senha, 10);

  let conn: PoolConnection | undefined;

  try {
    conn = await getConnection();
    await conn.beginTransaction();

    const [dupDoc] = await conn.query<RowDataPacket[]>(
      `SELECT id FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
      [docDigits],
    );
    if (dupDoc.length > 0) {
      await conn.rollback();
      return { success: false, error: "Já existe cliente com este CPF/CNPJ." };
    }

    const [dupEmail] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM usuarios WHERE email = ? LIMIT 1",
      [emailAcesso],
    );
    if (dupEmail.length > 0) {
      await conn.rollback();
      return {
        success: false,
        error: "Já existe cadastro com este e-mail de acesso. Use outro e-mail ou recupere a senha.",
      };
    }

    const [perfilRows] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM perfis_acesso WHERE tipo = 'cliente' AND ativo = 1 ORDER BY id ASC LIMIT 1",
    );
    const perfilId = perfilRows[0]?.id as number | undefined;
    if (!perfilId) {
      await conn.rollback();
      return { success: false, error: "Perfil de acesso do cliente não configurado na base." };
    }

    const [uRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO usuarios (nome, email, senha_hash, telefone, avatar_iniciais, departamento, perfil_id, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      [
        data.nomeResponsavel.trim(),
        emailAcesso,
        senhaHash,
        telefone,
        iniciaisNome(data.nomeResponsavel),
        "Portal Cliente",
        perfilId,
        "Ativo",
      ],
    );
    const idUsuario = uRes.insertId;

    const idCliente = await insertCliente(conn, {
      idUsuario,
      tipoDoc,
      docMasked,
      razao,
      nomeFantasia: data.nomeFantasia?.trim() || null,
      ie,
      emailResponsavel,
      telefone,
      rua: data.rua.trim() || null,
      numero: data.numero.trim() || null,
      complemento: data.complemento?.trim() || null,
      bairro: data.bairro.trim() || null,
      cidade: data.cidade.trim(),
      estado: data.estado.toUpperCase(),
      cep: onlyDigits(data.cep),
      porteSql,
      ramo: data.segmento?.trim() || null,
      cnaePrincipal,
      nomeResponsavel: data.nomeResponsavel.trim(),
      cpfRespDigits,
      observacoes,
      protocolo,
    });

    if (data.tipoPessoa === "PJ" && data.cnaes.length > 0) {
      const { normalizeCnaeCodigo } = await import("./cnae");
      let ordemSecundario = 1;
      for (const item of data.cnaes) {
        await conn.execute<ResultSetHeader>(
          `INSERT INTO clientes_cnaes (cliente_id, cnae_codigo, descricao, tipo, ordem) VALUES (?,?,?,?,?)`,
          [
            idCliente,
            normalizeCnaeCodigo(item.codigo),
            item.descricao.trim().slice(0, 255),
            item.tipo,
            item.tipo === "principal" ? 0 : ordemSecundario++,
          ],
        );
      }
    }

    const [sRes] = await conn.execute<ResultSetHeader>(
      `INSERT INTO sicaf_cadastros (cliente_id, status, completude, credenciamento_anual, manutencao_ativa, dias_validade, observacoes)
       VALUES (?,?,0,0,0,0,?)`,
      [idCliente, "Pendente", "Cadastro inicial via site CADBRASIL"],
    );
    const idSicaf = sRes.insertId;

    await conn.execute<ResultSetHeader>(
      `INSERT INTO sicaf_niveis (sicaf_id, nivel, habilitado) VALUES (?,?,0)`,
      [idSicaf, "I"],
    );

    await insertContato(conn, idCliente, {
      nome: data.nomeResponsavel.trim(),
      cpf: cpfRespDigits,
      cargo: data.cargo?.trim() || null,
      email: emailResponsavel,
      telefone,
    });

    const hoje = new Date();
    const inicio = hoje.toISOString().slice(0, 10);
    const fim = new Date(hoje);
    fim.setFullYear(fim.getFullYear() + 1);
    const vencimento = fim.toISOString().slice(0, 10);

    await conn.execute<ResultSetHeader>(
      `INSERT INTO contratos_digitais (
        cliente_id, plano, data_inicio, data_vencimento, status, assinado_em, assinado_por, observacoes
      ) VALUES (?,?,?,?,?,NOW(),?,?)`,
      [
        idCliente,
        "Licença + Manutenção",
        inicio,
        vencimento,
        "Assinado",
        data.nomeResponsavel.trim(),
        `Contrato digital automático — protocolo ${protocolo}`,
      ],
    );

    await conn.commit();
    const { getPool } = await import("./db-mysql");
    await insertTrackingSessao(getPool(), idCliente, idUsuario, data.tracking ?? {});

    void import("./email")
      .then(({ dispararEmailsPosCadastro }) =>
        dispararEmailsPosCadastro({
          emailResponsavel,
          nomeResponsavel: data.nomeResponsavel.trim(),
          razaoSocial: razao,
          documentoMasked: docMasked,
          emailAcesso,
          protocolo,
          servicoLabel: "Credenciamento SICAF",
        }),
      )
      .catch((e) => console.warn("[criarCadastro] envio de e-mails (background)", e));

    return { success: true, protocolo, idCliente, idUsuario };
  } catch (e) {
    if (conn) {
      try {
        await conn.rollback();
      } catch {
        /* ignore */
      }
    }
    if (isMysqlDup(e)) {
      return { success: false, error: "Dado duplicado. Verifique CPF/CNPJ ou e-mail de acesso." };
    }
    const code =
      typeof e === "object" && e !== null && "code" in e ? String((e as { code: unknown }).code) : "";
    const sqlMsg =
      typeof e === "object" && e !== null && "sqlMessage" in e
        ? String((e as { sqlMessage: unknown }).sqlMessage)
        : "";
    console.error("[criarCadastro]", code, sqlMsg || e);
    return { success: false, error: mapMysqlErrorMessage(e) };
  } finally {
    if (conn) conn.release();
  }
}

/**
 * Server function que cria o cadastro completo (SEM pagamento), numa transação:
 * usuarios + clientes + clientes_cnaes + cliente_contatos + sicaf_cadastros +
 * sicaf_niveis + contratos_digitais. Gera o protocolo SICAF-XXXXXXXX-9999.
 */
export const criarCadastro = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => input)
  .handler(async ({ data: rawInput }): Promise<CriarCadastroResult> => {
    try {
      return await executarCriarCadastro(rawInput);
    } catch (e) {
      console.error("[criarCadastro] unhandled", e);
      return { success: false, error: "Erro interno ao processar cadastro. Tente novamente." };
    }
  });
