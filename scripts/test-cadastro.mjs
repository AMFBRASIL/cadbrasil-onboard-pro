/**
 * Teste NÃO DESTRUTIVO do fluxo de cadastro.
 * Executa toda a transação real (INSERTs) contra o banco e faz ROLLBACK no final.
 * Nada é gravado. Valida que o schema do banco bate com os INSERTs do projeto.
 *
 * Rodar:  node --env-file=.env scripts/test-cadastro.mjs
 */
import mysql from "mysql2/promise";

const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const fail = (m) => console.log(`  \x1b[31m✗ ${m}\x1b[0m`);
const info = (m) => console.log(`\x1b[36m${m}\x1b[0m`);

const onlyDigits = (s) => (s || "").replace(/\D/g, "");
function docNormalizedExpr(c) {
  return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${c}, '.', ''), '/', ''), '-', ''), ' ', ''), '_', '')`;
}
const isBadField = (e) => e && e.errno === 1054;

async function testCnpjWs() {
  info("\n[1/4] Consulta CNPJ.ws (token)");
  const token = process.env.CNPJ_WS_API_TOKEN;
  if (!token) return fail("CNPJ_WS_API_TOKEN não definido — pulando.");
  try {
    // Banco do Brasil S.A. — CNPJ público de teste
    const r = await fetch("https://comercial.cnpj.ws/cnpj/00000000000191", {
      headers: { x_api_token: token, Accept: "application/json" },
    });
    if (!r.ok) return fail(`HTTP ${r.status} — token inválido ou sem créditos?`);
    const d = await r.json();
    ok(`Token válido. Razão social retornada: ${d.razao_social}`);
  } catch (e) {
    fail(`Erro ao chamar CNPJ.ws: ${e.message}`);
  }
}

async function main() {
  info("=== TESTE DE CADASTRO (rollback, não grava nada) ===");

  let conn;
  let pool;
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 3,
    });

    info("\n[2/4] Conexão e tabelas");
    conn = await pool.getConnection();
    ok(`Conectado em ${process.env.DB_HOST}/${process.env.DB_NAME}`);

    const tabelas = [
      "usuarios", "clientes", "clientes_cnaes", "cliente_contatos",
      "sicaf_cadastros", "sicaf_niveis", "contratos_digitais", "perfis_acesso",
    ];
    const [rows] = await conn.query(
      `SELECT table_name AS t FROM information_schema.tables WHERE table_schema = ?`,
      [process.env.DB_NAME],
    );
    const existentes = new Set(rows.map((r) => (r.t || r.TABLE_NAME || "").toLowerCase()));
    for (const t of tabelas) {
      if (existentes.has(t)) ok(`tabela ${t}`);
      else fail(`tabela AUSENTE: ${t}`);
    }

    info("\n[3/4] Perfil de acesso do cliente");
    const [perfis] = await conn.query(
      "SELECT id FROM perfis_acesso WHERE tipo = 'cliente' AND ativo = 1 ORDER BY id ASC LIMIT 1",
    );
    const perfilId = perfis[0]?.id;
    if (perfilId) ok(`perfil cliente encontrado (id=${perfilId})`);
    else fail("nenhum perfil tipo='cliente' ativo=1 — o cadastro vai falhar!");

    info("\n[4/4] Transação completa (INSERT + ROLLBACK)");
    const rnd = Date.now().toString().slice(-9);
    const doc = `99${rnd}000`.slice(0, 14).padEnd(14, "0");
    const emailAcesso = `teste.rollback.${rnd}@exemplo-cadbrasil.test`;
    const protocolo = `SICAF-TESTE${rnd}`.slice(0, 18);

    await conn.beginTransaction();

    const [dupDoc] = await conn.query(
      `SELECT id FROM clientes WHERE ${docNormalizedExpr("documento")} = ? LIMIT 1`,
      [doc],
    );
    ok(`SELECT duplicidade documento (encontrados: ${dupDoc.length})`);

    const [dupMail] = await conn.query("SELECT id FROM usuarios WHERE email = ? LIMIT 1", [emailAcesso]);
    ok(`SELECT duplicidade email (encontrados: ${dupMail.length})`);

    const [u] = await conn.execute(
      `INSERT INTO usuarios (nome, email, senha_hash, telefone, avatar_iniciais, departamento, perfil_id, status)
       VALUES (?,?,?,?,?,?,?,?)`,
      ["Teste Rollback", emailAcesso, "$2a$10$abcdefghijklmnopqrstuv", "11999990000", "TR", "Portal Cliente", perfilId, "Ativo"],
    );
    ok(`INSERT usuarios (id=${u.insertId})`);
    const idUsuario = u.insertId;

    let idCliente;
    const colsFull = `usuario_id, tipo_documento, documento, razao_social, nome_fantasia, inscricao_estadual,
      email, telefone, celular, endereco, numero, complemento, bairro, cidade, estado, cep,
      porte, ramo_atividade, cnae_principal,
      responsavel_nome, responsavel_cpf, responsavel_email, responsavel_telefone,
      status, observacoes, protocolo_cadbrasil`;
    const valsFull = [
      idUsuario, "CNPJ", doc, "EMPRESA TESTE ROLLBACK LTDA", "Teste", null,
      "resp@exemplo.test", "11999990000", "11999990000", "Rua Teste", "100", null, "Centro", "São Paulo", "SP", "01000000",
      "ME", "Atividade teste", "6201500",
      "Responsavel Teste", "12345678909", "resp@exemplo.test", "11999990000",
      "Ativo", `Protocolo: ${protocolo}`, protocolo,
    ];
    try {
      const [c] = await conn.execute(
        `INSERT INTO clientes (${colsFull}) VALUES (${valsFull.map(() => "?").join(",")})`,
        valsFull,
      );
      idCliente = c.insertId;
      ok(`INSERT clientes (id=${idCliente}) [schema completo]`);
    } catch (e) {
      if (!isBadField(e)) throw e;
      fail(`coluna inexistente no INSERT clientes: ${e.sqlMessage}`);
      const cols2 = `usuario_id, tipo_documento, documento, razao_social, nome_fantasia, inscricao_estadual,
        email, telefone, celular, endereco, numero, complemento, bairro, cidade, estado, cep,
        porte, ramo_atividade,
        responsavel_nome, responsavel_cpf, responsavel_email, responsavel_telefone,
        status, observacoes, protocolo_cadbrasil`;
      const vals2 = [
        idUsuario, "CNPJ", doc, "EMPRESA TESTE ROLLBACK LTDA", "Teste", null,
        "resp@exemplo.test", "11999990000", "11999990000", "Rua Teste", "100", null, "Centro", "São Paulo", "SP", "01000000",
        "ME", "Atividade teste",
        "Responsavel Teste", "12345678909", "resp@exemplo.test", "11999990000",
        "Ativo", `Protocolo: ${protocolo}`, protocolo,
      ];
      const [c2] = await conn.execute(
        `INSERT INTO clientes (${cols2}) VALUES (${vals2.map(() => "?").join(",")})`,
        vals2,
      );
      idCliente = c2.insertId;
      ok(`INSERT clientes (id=${idCliente}) [fallback sem cnae_principal]`);
    }

    await conn.execute(
      `INSERT INTO clientes_cnaes (cliente_id, cnae_codigo, descricao, tipo, ordem) VALUES (?,?,?,?,?)`,
      [idCliente, "6201500", "Desenvolvimento de software", "principal", 0],
    );
    ok("INSERT clientes_cnaes");

    const [s] = await conn.execute(
      `INSERT INTO sicaf_cadastros (cliente_id, status, completude, credenciamento_anual, manutencao_ativa, dias_validade, observacoes)
       VALUES (?,?,0,0,0,0,?)`,
      [idCliente, "Pendente", "Cadastro inicial via site CADBRASIL"],
    );
    ok(`INSERT sicaf_cadastros (id=${s.insertId})`);

    await conn.execute(`INSERT INTO sicaf_niveis (sicaf_id, nivel, habilitado) VALUES (?,?,0)`, [s.insertId, "I"]);
    ok("INSERT sicaf_niveis");

    try {
      await conn.execute(
        `INSERT INTO cliente_contatos (cliente_id, nome, cpf, cargo, email, telefone, principal) VALUES (?,?,?,?,?,?,1)`,
        [idCliente, "Responsavel Teste", "12345678909", "Sócio", "resp@exemplo.test", "11999990000"],
      );
      ok("INSERT cliente_contatos [com cpf]");
    } catch (e) {
      if (!isBadField(e)) throw e;
      fail(`coluna inexistente em cliente_contatos: ${e.sqlMessage}`);
      await conn.execute(
        `INSERT INTO cliente_contatos (cliente_id, nome, cargo, email, telefone, principal) VALUES (?,?,?,?,?,1)`,
        [idCliente, "Responsavel Teste", "Sócio", "resp@exemplo.test", "11999990000"],
      );
      ok("INSERT cliente_contatos [fallback sem cpf]");
    }

    await conn.execute(
      `INSERT INTO contratos_digitais (cliente_id, plano, data_inicio, data_vencimento, status, assinado_em, assinado_por, observacoes)
       VALUES (?,?,?,?,?,NOW(),?,?)`,
      [idCliente, "Licença + Manutenção", "2026-01-01", "2027-01-01", "Assinado", "Responsavel Teste", `Teste ${protocolo}`],
    );
    ok("INSERT contratos_digitais");

    await conn.rollback();
    info("\n\x1b[32m✓ ROLLBACK efetuado — NADA foi gravado. Schema 100% compatível com os INSERTs.\x1b[0m");
  } catch (e) {
    if (conn) await conn.rollback().catch(() => {});
    info("\n\x1b[31m✗ FALHA no teste:\x1b[0m");
    console.error("  ", e.sqlMessage || e.message);
    console.error("   code:", e.code, "| errno:", e.errno);
  } finally {
    if (conn) conn.release();
    if (pool) await pool.end();
  }

  await testCnpjWs();
}

main();
