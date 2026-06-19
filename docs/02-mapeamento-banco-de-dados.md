# Documento 02 — Mapeamento do Banco de Dados

> Base: SQL manual encontrado em `Antigo/src/lib/*` e `Antigo/src/app/api/**`.
>
> ⚠️ **Aviso de método:** o sistema legado **não possui ORM, migrations nem schema
> versionado**. O banco é **MySQL compartilhado com o portal administrativo**
> (`fornecedor.cadbrasil.com.br`); este projeto apenas faz `INSERT`/`SELECT`/`UPDATE`.
> Portanto **todo o schema abaixo foi inferido** a partir das queries. Tipos, tamanhos,
> índices, PKs e FKs marcados como *(inferido)* devem ser **confirmados com um `SHOW
> CREATE TABLE`** no banco real antes de qualquer migração (ver Documento 06).

---

## 1. SGBD e conexão

- **SGBD:** MySQL (driver `mysql2/promise`), porta padrão `3306`.
- **Pool** (em `src/lib/db.ts`): `connectionLimit` padrão 5 (`DB_POOL_LIMIT`),
  `maxIdle: 5000`, `enableKeepAlive: true`, `connectTimeout: 15000`.
- **Variáveis aceitas** (com prioridade para as `DB_WRITE_*`):
  `DB_WRITE_HOST|DB_HOST`, `DB_WRITE_USER|DB_USER`, `DB_WRITE_PASSWORD|DB_PASSWORD`,
  `DB_WRITE_NAME|DB_NAME`, `DB_WRITE_PORT|DB_PORT`, `DB_WRITE_POOL_MAX|DB_POOL_LIMIT`.
  → indica preparação para **separar conexão de escrita** (master/replica).
- Não há **procedures, triggers ou views** chamadas pelo código do site. A normalização
  de documento é feita em SQL inline (não como function do banco):
  `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(col,'.',''),'/',''),'-',''),' ',''),'_','')`.

---

## 2. Tabelas utilizadas pelo site

Resumo das **14 tabelas** referenciadas no código:

| Tabela | Operações no site | Papel |
|--------|-------------------|-------|
| `usuarios` | INSERT, SELECT | Conta de acesso ao portal (login/senha) |
| `perfis_acesso` | SELECT | Perfil/role do usuário (tipo `cliente`) |
| `clientes` | INSERT, SELECT | Cadastro principal do cliente/fornecedor |
| `clientes_cnaes` | INSERT | CNAEs do cliente (PJ) |
| `cliente_contatos` | INSERT | Contatos do cliente (responsável principal) |
| `sicaf_cadastros` | INSERT, SELECT | Registro do processo SICAF do cliente |
| `sicaf_niveis` | INSERT | Níveis do SICAF (I, II, ...) |
| `contratos_digitais` | INSERT, SELECT | Contrato digital "assinado" no cadastro |
| `taxas_sicaf` | INSERT, SELECT, UPDATE | Taxa/cobrança vinculada ao SICAF |
| `pagamentos_gerencianet` | INSERT, UPDATE | Cobranças Efí (boleto/PIX) |
| `tracking_sessoes` | INSERT | Marketing/UTM/conversão |
| `configuracoes_sistema` | SELECT | Configurações (valor da taxa) |
| `templates_email` | SELECT | Templates de e-mail (boas-vindas/licença) |

---

## 3. Detalhamento das tabelas (colunas inferidas)

### 3.1 `usuarios`
Conta de acesso do cliente ao portal.

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK AUTO_INCREMENT | retornado como `insertId` |
| `nome` | VARCHAR | nome do responsável |
| `email` | VARCHAR **UNIQUE** | e-mail de acesso (login); checado por duplicidade |
| `senha_hash` | VARCHAR | bcrypt (custo 10) |
| `telefone` | VARCHAR NULL | dígitos |
| `avatar_iniciais` | VARCHAR | iniciais do nome (`iniciaisNome()`) |
| `departamento` | VARCHAR | gravado fixo: `"Portal Cliente"` |
| `perfil_id` | BIGINT FK → `perfis_acesso.id` | |
| `status` | VARCHAR/ENUM | gravado `"Ativo"` |

`INSERT`: `nome, email, senha_hash, telefone, avatar_iniciais, departamento, perfil_id, status`.

### 3.2 `perfis_acesso`
Perfis/roles do sistema (mantido pelo portal admin).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `tipo` | VARCHAR | filtrado por `= 'cliente'` |
| `ativo` | TINYINT(1) | filtrado por `= 1` |

`SELECT id FROM perfis_acesso WHERE tipo='cliente' AND ativo=1 ORDER BY id ASC LIMIT 1`.

### 3.3 `clientes`
Cadastro principal. **Tabela com mais variações de schema** (vários fallbacks).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK AUTO_INCREMENT | |
| `usuario_id` | BIGINT FK → `usuarios.id` | |
| `tipo_documento` | ENUM('CPF','CNPJ') | |
| `documento` | VARCHAR | **mascarado** (ex.: `12.345.678/0001-90`); comparado por versão normalizada |
| `razao_social` | VARCHAR | PJ: razão social · PF: nome do responsável |
| `nome_fantasia` | VARCHAR NULL | |
| `inscricao_estadual` | VARCHAR NULL | |
| `email` | VARCHAR | e-mail do responsável |
| `telefone` | VARCHAR NULL | |
| `celular` | VARCHAR NULL | recebe o mesmo telefone |
| `endereco` | VARCHAR | logradouro (ou endereço completo, no fallback legado) |
| `numero` | VARCHAR NULL | *(coluna pode não existir em schema antigo → fallback)* |
| `complemento` | VARCHAR NULL | *(idem)* |
| `bairro` | VARCHAR NULL | *(idem)* |
| `cidade` | VARCHAR | |
| `estado` | CHAR(2) | UF |
| `cep` | VARCHAR | **somente dígitos** |
| `porte` | ENUM('MEI','ME','EPP','Média','Grande') | mapeado por `mapPorteSql()` |
| `ramo_atividade` | VARCHAR NULL | recebe `segmento` |
| `cnae_principal` | VARCHAR NULL | *(coluna pode não existir → fallback)* |
| `responsavel_nome` | VARCHAR | |
| `responsavel_cpf` | VARCHAR NULL | somente dígitos |
| `responsavel_email` | VARCHAR | |
| `responsavel_telefone` | VARCHAR NULL | |
| `status` | VARCHAR/ENUM | gravado `"Ativo"` |
| `observacoes` | TEXT | bloco formatado (protocolo, origem, tipo serviço, SICAF, segmento) |
| `protocolo_cadbrasil` | VARCHAR | formato `SICAF-XXXXXXXX-9999`; **chave de busca** |
| `protocoloCadbrasil` | VARCHAR | *(variação legada de nome — usada no fallback final)* |

> **Variações de schema tratadas no `insertCliente()`:**
> 1. schema novo (com `numero/complemento/bairro/cnae_principal`);
> 2. mesmo sem `cnae_principal`;
> 3. schema legado: endereço unificado em `endereco` + coluna `protocoloCadbrasil`.

### 3.4 `clientes_cnaes`
CNAEs do cliente (apenas PJ).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `cnae_codigo` | VARCHAR(7) | normalizado p/ 7 dígitos (subclasse) |
| `descricao` | VARCHAR(255) | |
| `tipo` | ENUM('principal','secundario') | |
| `ordem` | INT | principal=0, secundários 1..n |

### 3.5 `cliente_contatos`
Contatos do cliente; o responsável é inserido como `principal=1`.

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `nome` | VARCHAR | |
| `cpf` | VARCHAR NULL | *(coluna pode não existir → fallback sem `cpf`)* |
| `cargo` | VARCHAR NULL | |
| `email` | VARCHAR | |
| `telefone` | VARCHAR NULL | |
| `principal` | TINYINT(1) | gravado `1` |

### 3.6 `sicaf_cadastros`
Processo SICAF do cliente.

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `status` | VARCHAR/ENUM | gravado `"Pendente"` |
| `completude` | INT/DECIMAL | gravado `0` |
| `credenciamento_anual` | TINYINT(1) | gravado `0` |
| `manutencao_ativa` | TINYINT(1) | gravado `0` |
| `dias_validade` | INT | gravado `0` |
| `observacoes` | VARCHAR/TEXT | texto de origem |

### 3.7 `sicaf_niveis`
Níveis vinculados ao SICAF.

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `sicaf_id` | BIGINT FK → `sicaf_cadastros.id` | |
| `nivel` | VARCHAR | gravado `"I"` |
| `habilitado` | TINYINT(1) | gravado `0` |

### 3.8 `contratos_digitais`
Contrato digital "assinado" automaticamente no cadastro.

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `plano` | VARCHAR | gravado `"Licença + Manutenção"` |
| `data_inicio` | DATE | hoje |
| `data_vencimento` | DATE | hoje + 1 ano |
| `status` | VARCHAR/ENUM | gravado `"Assinado"` |
| `assinado_em` | DATETIME | `NOW()` |
| `assinado_por` | VARCHAR | nome do responsável |
| `ip_assinatura` | VARCHAR NULL | `x-forwarded-for`/`x-real-ip` |
| `observacoes` | VARCHAR/TEXT | "Contrato digital automático — protocolo ..." |

### 3.9 `taxas_sicaf`
Taxa de cobrança vinculada ao SICAF (uma por ano/protocolo/status pendente).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `sicaf_id` | BIGINT FK → `sicaf_cadastros.id` | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `descricao` | VARCHAR | "Taxa cadastro portal CADBRASIL — {protocolo}" |
| `valor` | DECIMAL(10,2) | em reais |
| `ano_referencia` | INT | ano corrente |
| `status` | VARCHAR/ENUM | `"Pendente"` |
| `forma_pagamento` | VARCHAR NULL | `"Boleto"` ou `"PIX"` (no UPDATE pós-geração) |
| `codigo_barras` | VARCHAR NULL | boleto (linha digitável) |
| `chave_pix` | VARCHAR(255) NULL | copia-e-cola PIX (se ≤ 255 chars) |

> **Idempotência:** antes de inserir, o código procura taxa existente por
> `(sicaf_id, cliente_id, ano_referencia, status='Pendente', descricao)`.

### 3.10 `pagamentos_gerencianet`
Registro detalhado das cobranças Efí (boleto/PIX).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `origem` | VARCHAR | gravado `"sicaf"` |
| `origem_id` | BIGINT | = `taxas_sicaf.id` |
| `tipo` | ENUM('boleto','pix') | |
| `valor` | DECIMAL(10,2) | reais |
| `valor_centavos` | INT | centavos |
| `descricao` | VARCHAR(500) | |
| `protocolo` | VARCHAR(100) | |
| `data_vencimento` | DATE NULL | boleto (null no PIX) |
| `status` | ENUM('aguardando','gerado','erro') | ciclo de vida |
| `cliente_nome` | VARCHAR(255) | snapshot |
| `cliente_documento` | VARCHAR(20) | snapshot (dígitos) |
| `cliente_email` | VARCHAR(255) | snapshot |
| `gn_charge_id` | BIGINT NULL | id da cobrança (boleto) |
| `gn_barcode` | VARCHAR NULL | linha digitável |
| `gn_link` | VARCHAR NULL | link do boleto |
| `gn_pdf` | VARCHAR NULL | URL do PDF |
| `gn_txid` | VARCHAR NULL | txid (PIX) |
| `gn_loc_id` | BIGINT NULL | loc.id (PIX) |
| `gn_qrcode_text` | TEXT NULL | copia-e-cola (PIX) |
| `gn_qrcode_image` | TEXT/LONGTEXT NULL | QR Code base64 (data URL) |
| `gn_response` | JSON/LONGTEXT NULL | resposta bruta da Efí (stringify) |
| `gn_error` | TEXT NULL | mensagem de erro (até ~65000 chars) |

### 3.11 `tracking_sessoes`
Marketing/UTM/conversão (gravado pós-commit, não bloqueante).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | |
| `session_id` | VARCHAR | UUID/gerado |
| `cliente_id` | BIGINT FK → `clientes.id` | |
| `usuario_id` | BIGINT FK → `usuarios.id` | |
| `utm_source`,`utm_medium`,`utm_campaign`,`utm_term`,`utm_content` | VARCHAR NULL | |
| `gclid`,`gbraid`,`wbraid`,`gad_source`,`gad_campaignid`,`fbclid`,`msclkid` | VARCHAR NULL | |
| `landing_page`,`referrer` | VARCHAR/TEXT NULL | |
| `user_agent` | VARCHAR/TEXT NULL | |
| `converted` | TINYINT(1) | gravado `1` |
| `conversion_type` | VARCHAR | gravado `"signup"` |
| `conversion_at` | DATETIME | `NOW()` |
| `funnel_step` | VARCHAR | gravado `"signup"` |
| `last_activity_at` | DATETIME | `NOW()` |

### 3.12 `configuracoes_sistema`
Configurações chave/valor (compartilhadas com o portal).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `chave` | VARCHAR | usado: `valor_cadastro_sicaf` |
| `valor` | VARCHAR | valor da taxa em reais (ex.: `"99,00"`/`"99.00"`) |

`SELECT valor FROM configuracoes_sistema WHERE chave='valor_cadastro_sicaf' LIMIT 1`.

### 3.13 `templates_email`
Templates de e-mail (renderizados com placeholders `{{var}}`).

| Coluna | Tipo (inferido) | Observações |
|--------|------------------|-------------|
| `id` | BIGINT PK | usados: **id=1** (boas-vindas), **id=23** (licença ativada) |
| `nome` | VARCHAR | |
| `assunto` | VARCHAR NULL | |
| `corpo_html` | TEXT/LONGTEXT NULL | |
| `ativo` | TINYINT(1) | só usa se ativo=1 e corpo presente; senão usa fallback embutido |

---

## 4. Relacionamentos (modelo inferido)

```
perfis_acesso 1──N usuarios 1──1 clientes
                                  │
   clientes 1──N clientes_cnaes   │
   clientes 1──N cliente_contatos │
   clientes 1──N contratos_digitais
   clientes 1──N sicaf_cadastros 1──N sicaf_niveis
                       │
                       └──N taxas_sicaf 1──N pagamentos_gerencianet
   clientes 1──N tracking_sessoes
```

Observações:
- `clientes.usuario_id` é praticamente **1:1** (um usuário por cliente no fluxo do site).
- `pagamentos_gerencianet.origem_id` aponta para `taxas_sicaf.id` (sem FK formal garantida).
- `configuracoes_sistema` e `templates_email` não têm relacionamento — são tabelas de apoio.

---

## 5. Chaves, índices, procedures, triggers e views

| Item | Situação no código |
|------|--------------------|
| **Chaves primárias** | `id` AUTO_INCREMENT em todas as tabelas transacionais *(inferido)* |
| **Chaves estrangeiras** | inferidas pelas colunas `*_id`; **não confirmadas** (precisa `SHOW CREATE TABLE`) |
| **Índices** | há evidência de **UNIQUE** em `usuarios.email` (tratamento `ER_DUP_ENTRY`); recomendado também UNIQUE em `clientes.protocolo_cadbrasil` e índice na versão normalizada de `documento` (hoje a busca usa função em `WHERE`, o que **impede uso de índice** — ver Doc 05/06) |
| **Procedures** | nenhuma chamada pelo site |
| **Triggers** | nenhuma referenciada pelo site |
| **Views** | nenhuma referenciada pelo site |

> ⚠️ A query de duplicidade usa `REPLACE(...)` na coluna `documento`, então **não usa
> índice** (full scan). Em produção com volume, isso é um gargalo. Recomendação no
> Documento 05: armazenar uma coluna `documento_normalizado` indexada.

---

## 6. Pendência obrigatória antes da migração

Executar no banco de produção e anexar a este documento:

```sql
SHOW CREATE TABLE usuarios;
SHOW CREATE TABLE perfis_acesso;
SHOW CREATE TABLE clientes;
SHOW CREATE TABLE clientes_cnaes;
SHOW CREATE TABLE cliente_contatos;
SHOW CREATE TABLE sicaf_cadastros;
SHOW CREATE TABLE sicaf_niveis;
SHOW CREATE TABLE contratos_digitais;
SHOW CREATE TABLE taxas_sicaf;
SHOW CREATE TABLE pagamentos_gerencianet;
SHOW CREATE TABLE tracking_sessoes;
SHOW CREATE TABLE configuracoes_sistema;
SHOW CREATE TABLE templates_email;
```

Isso é o que permitirá gerar o `schema.prisma` por **introspecção** (`prisma db pull`)
sem risco de divergência (ver Documento 05 e 06).
