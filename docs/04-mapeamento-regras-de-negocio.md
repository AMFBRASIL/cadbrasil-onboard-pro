# Documento 04 — Mapeamento das Regras de Negócio

> Todas as regras de negócio do sistema legado que **devem ser preservadas
> integralmente** no novo backend. Cada regra cita a origem no código (`Antigo/`).

---

## 1. Validação do formulário de cadastro

Fonte: `src/lib/validations/cadastro.ts` (`cadastroSchema` / `cadastroBodySchema`) +
`src/components/CadastroForm.tsx`. Validação ocorre **no client (UX)** e **novamente no
server (autoridade)**.

### 1.1 Campos e obrigatoriedade

| Campo | Regra |
|-------|-------|
| `tipoPessoa` | obrigatório: `PJ` ou `PF` |
| `nomeResponsavel` | obrigatório, 2–120 chars |
| `telefone` | obrigatório, ≥ 10 dígitos |
| `email` | obrigatório, e-mail válido, ≤ 160 |
| `cep` | obrigatório, exatamente 8 dígitos |
| `rua` | obrigatório, 2–160 |
| `numero` | obrigatório, 1–10 |
| `complemento` | opcional, ≤ 60 |
| `bairro` | obrigatório, 2–80 |
| `cidade` | obrigatório, 2–80 |
| `estado` | obrigatório, 2 chars (UF) |
| `servico` | obrigatório |
| `possuiSicaf` | obrigatório (default `"nao"`) |
| `prioritario` | obrigatório (default `"nao"`) |
| `observacoes` | opcional, ≤ 500 |
| `senha` | obrigatório, 6–128 |
| `confirmarSenha` | obrigatório, **deve ser igual a `senha`** |
| `emailAcesso` | opcional; se preenchido, deve ser e-mail válido; senão usa `email` |
| `aceiteTermos` | obrigatório `=== true` |
| `aceitaNotificacoes`, `aceiteContato` | opcionais (boolean) |

### 1.2 Regras condicionais por tipo de pessoa

**PJ (CNPJ):**
- `cnpj` obrigatório, **14 dígitos**;
- `razaoSocial` obrigatória (≥ 2);
- `porte` obrigatório;
- `segmento` obrigatório (≥ 2);
- `cpf` (do responsável) obrigatório e **válido (dígito verificador)**;
- campos extras: `nomeFantasia` (≤160), `inscricaoEstadual` (≤30), `cnaes[]`.

**PF (CPF):**
- `cpf` obrigatório e **válido**.

### 1.3 Validação de CPF (preservar algoritmo)
`isValidCPF()` — 11 dígitos, rejeita sequências repetidas, valida os 2 dígitos
verificadores (módulo 11). **Replicar exatamente.**

### 1.4 Regras de UX do formulário (devem permanecer)
- 6 passos (Tipo → Identificação → Responsável → Endereço → Atendimento → Confirmação),
  com validação por passo antes de avançar (`STEP_FIELDS`).
- **Bloqueio de avanço** se o documento já existir (modal "fornecedor já cadastrado").
- Espera o lookup de CNPJ concluir (`cnpjFetched` ou `cnpjManualFill`) antes de avançar.
- Defaults PJ ao avançar: `porte="MEDIA"`, `segmento="Atividade empresarial"` se vazios.
- Serviços disponíveis: `Novo Cadastro SICAF`, `Atualizacao SICAF`, `Suporte Documental`, `Outro`.

---

## 2. Consulta automática (CNPJ / CEP) e auto-preenchimento

- **CNPJ completo (14 díg.):** primeiro verifica duplicidade
  (`GET /api/cadastro/documento`); se não existe, consulta CNPJ.ws e preenche razão
  social, nome fantasia, IE, porte, segmento (descrição do CNAE fiscal), CNAEs, endereço,
  telefone e e-mail. Regras de normalização: ver Documento 03 §2.
- **CNPJ não localizado / serviço indisponível:** ativa preenchimento manual
  (`cnpjManualFill`) com `porte="MEDIA"` e `segmento="Atividade empresarial"`.
- **CPF completo (PF):** valida dígito + verifica duplicidade.
- **CEP completo (8 díg.):** ViaCEP preenche rua/bairro/cidade/UF.

---

## 3. Criação do cadastro — `POST /api/cadastro`

Fonte: `src/app/api/cadastro/route.ts`. **Tudo em uma transação** (exceto tracking e
e-mails, que são pós-commit).

### 3.1 Pré-processamento (normalização)
- `email` e `emailAcesso` → `trim().toLowerCase()` (emailAcesso default = email);
- `telefone`, `cpf`, `cep`, `documento` → apenas dígitos onde aplicável;
- `estado` → maiúsculo;
- `protocolo` gerado: **`SICAF-XXXXXXXX-9999`** (8 alfanuméricos + 4 dígitos) — `gerarProtocoloCadbrasil()`;
- `tipoServico` derivado: contém "Atualização"/"renova" → `renovacao`, senão `novo`;
- `observacoes` do cliente = bloco multilinha (Protocolo, Origem: site, Tipo de serviço,
  SICAF atual + Prioritário, Segmento + Objetivo, Observações).

### 3.2 Verificações de duplicidade (regras de bloqueio)
1. **Documento duplicado** em `clientes` (comparação normalizada sem máscara) → `409`
   "Já existe cliente com este CPF/CNPJ."
2. **E-mail de acesso duplicado** em `usuarios` → `409` "Já existe cadastro com este
   e-mail de acesso..."
3. **Perfil de acesso** `cliente` ativo deve existir em `perfis_acesso` → senão `500`.

### 3.3 Sequência de gravação (ordem importa — FKs)
1. `usuarios`: senha com **bcrypt custo 10**, `departamento="Portal Cliente"`,
   `avatar_iniciais` = iniciais, `status="Ativo"`, `perfil_id`.
2. `clientes`: `status="Ativo"`. PJ → `porte` mapeado, IE, `cnae_principal`;
   PF → `porte="ME"` fixo, sem IE/CNAE. Razão social: PJ usa `razaoSocial`, PF usa
   `nomeResponsavel`. Documento gravado **mascarado**.
3. `clientes_cnaes` (somente PJ com CNAEs): principal `ordem=0`, secundários `1..n`,
   código 7 dígitos, deduplicado.
4. `sicaf_cadastros`: `status="Pendente"`, completude/flags = 0.
5. `sicaf_niveis`: nível `"I"`, `habilitado=0`.
6. `cliente_contatos`: responsável como `principal=1` (com `cargo` se informado).
7. `contratos_digitais`: `plano="Licença + Manutenção"`, `data_inicio=hoje`,
   `data_vencimento=hoje+1 ano`, `status="Assinado"`, `assinado_em=NOW()`,
   `assinado_por=nomeResponsavel`, `ip_assinatura` capturado dos headers.
8. `commit`.

### 3.4 Pós-commit (não bloqueante — não afeta o 201)
- `tracking_sessoes`: grava UTM/marketing, `converted=1`, `conversion_type="signup"`,
  `funnel_step="signup"`. Falha é apenas logada.
- E-mails via `waitUntil` (boas-vindas + licença ativada + notificação interna se
  `aceitaNotificacoes`). Falha é apenas logada.

### 3.5 Resposta
`201 { success:true, protocolo, idUsuario, idCliente, idPedido(=idContrato) }`.
O front redireciona para `/conclusao-cadastro?protocolo=...`.

### 3.6 Tolerância a schema legado (preservar comportamento)
O `insertCliente()` tenta 3 variações de `INSERT` (ver Doc 02 §3.3) e
`insertClienteContato()` tenta com/sem coluna `cpf`, capturando erro
`ER_BAD_FIELD_ERROR` (errno 1054). Isso garante compatibilidade com o banco existente.

---

## 4. Consulta de cliente por documento — `GET /api/cadastro/documento`

Fonte: `src/app/api/cadastro/documento/route.ts`.

- Entrada: `?documento=` (11 ou 14 dígitos, normalizado).
- Verifica banco configurado (`isDbConfigured`) → senão `503`.
- Retorna `{ exists: boolean }` (existe se houver `clientes` com documento normalizado igual).
- **Hoje só informa existência** — não traz status/contrato/pagamento.

---

## 5. Consulta por protocolo — `GET /api/cadastro/[protocolo]`

Fonte: `src/app/api/cadastro/[protocolo]/route.ts`.

- Valida protocolo (≥ 5 chars).
- Busca `clientes` por `protocolo_cadbrasil`; se não existir → `404`.
- Busca `usuarios.email` (e-mail de acesso) e o **último** `contratos_digitais`.
- Resolve endereço (campos separados **ou** parse do `endereco` legado por vírgulas).
- Retorna dados do cliente + `contrato {plano, inicio, vencimento, status}` (ou `null`).

---

## 6. Status do cliente — situação atual vs. requisito (Etapas 2 e 5)

> **Importante:** o requisito do projeto (Etapa 2 / Etapa 5) pede um **status detalhado**
> ao informar o CNPJ: existe? ativo? inativo? tem contrato? tem pagamento? Hoje, o
> legado **não entrega isso** — só `exists` (booleano). As regras abaixo descrevem o que
> EXISTE hoje e o que precisa ser COMPOSTO (sem inventar novas regras de negócio, apenas
> lendo o estado já gravado).

### 6.1 O que existe hoje
| Pergunta | Disponível no legado? | Fonte |
|----------|----------------------|-------|
| Cliente já existe? | ✅ sim | `clientes.documento` (normalizado) |
| Possui cadastro ativo/inativo? | ⚠️ parcial | `clientes.status` (gravado sempre `"Ativo"` no site) |
| Já possui contrato? | ✅ derivável | `contratos_digitais` por `cliente_id` (status `"Assinado"`) |
| Já possui pagamento? | ✅ derivável | `pagamentos_gerencianet` (status `aguardando/gerado/erro`) e `taxas_sicaf` (`Pendente`/forma) |
| SICAF | ✅ derivável | `sicaf_cadastros.status` (`Pendente`), `sicaf_niveis` |

### 6.2 Composição de status proposta (a ser confirmada — Doc 06)
Mantendo as regras existentes, o novo endpoint de consulta por documento poderá retornar:

```
exists: boolean
clienteStatus: clientes.status            // "Ativo" / outro
temContrato: contratos_digitais existe?   // + status do último contrato
contratoVigente: data_vencimento >= hoje  // a confirmar com regra de negócio
temPagamento: pagamentos_gerencianet existe?
pagamentoStatus: aguardando | gerado | erro | (pago?)
sicafStatus: sicaf_cadastros.status
```

> ⚠️ **Decisão necessária do cliente:** a definição final de "ativo", "inativo" e "pago"
> depende de como o **portal administrativo** atualiza esses campos (ex.: quem muda
> `clientes.status`, quem dá baixa no pagamento). Isso será confirmado no Documento 06
> e na coleta do `SHOW CREATE TABLE`. **Nenhuma regra será inventada** — apenas leremos o
> estado já mantido pelo ecossistema.

---

## 7. Regras de pagamento (taxa de licença)

Fonte: `src/app/api/pagamento/{boleto,pix}/route.ts`, `src/lib/pagamento-registro.ts`,
`src/lib/efipay.ts`. Detalhes em Doc 03 §4.

Regras essenciais:
1. **Exige protocolo válido** (regex `^SICAF-[A-Z0-9]{8}-\d{4}$`). Protocolo inexistente → `404`.
2. **Valor:** `configuracoes_sistema.valor_cadastro_sicaf` → fallback env → R$ 99,00.
3. **SICAF garantido:** se o cliente não tiver SICAF, é criado na hora (idempotente).
4. **Taxa idempotente:** uma `taxas_sicaf` pendente por (sicaf, cliente, ano, descrição).
5. **Registro do pagamento** sempre criado como `aguardando` antes da Efí; atualizado
   para `gerado` (com dados) ou `erro` (com mensagem).
6. **Boleto:** vencimento configurável (default 3 dias); trata recusa (`refusal`).
7. **PIX:** expiração configurável (default 1h); QR Code gerado localmente.
8. Validação do corpo: `pagamentoBodySchema` (PJ exige CNPJ 14 + razão; PF exige CPF 11).

---

## 8. Outras regras

- **E-mail pós-cadastro:** boas-vindas (template id=1) + licença ativada (id=23) sempre;
  notificação interna **só se `aceitaNotificacoes=true`**. Envio desativado se
  `EMAIL_API_URL` for placeholder (`your-`).
- **Diagnóstico SICAF:** score/indicadores/licitações são **heurísticos** (hash do
  CNPJ+segmento), não consultam fontes reais. Lead enviado a webhook/CRM se configurado.
  (Marketing — preservar como está.)
- **Geração de senha temporária** (`gerarSenhaTemporaria`): existe no código mas **não é
  usada no fluxo do site** (a senha vem do formulário). Manter por compatibilidade.
- **Tracking/UTM:** captura e persistência client-side; envio no cadastro; gravação em
  `tracking_sessoes`; conversões em Google Ads/GTM/Microsoft Ads.

---

## 9. Tabela-resumo: regra → preservar / ajustar

| Regra | Ação na migração |
|-------|------------------|
| Validações Zod (cadastro/pagamento) | **Preservar idêntico** |
| Algoritmo `isValidCPF` | **Preservar idêntico** |
| Formato do protocolo | **Preservar idêntico** |
| Sequência transacional de inserts | **Preservar** (consolidar fallbacks após `SHOW CREATE TABLE`) |
| Duplicidade documento/e-mail | **Preservar** (+ índice na coluna normalizada — Doc 05) |
| Mapeamento porte / CNAE / IE | **Preservar idêntico** |
| Valor da taxa / ciclo de pagamento Efí | **Preservar** |
| E-mails (templates + regra de notificação) | **Preservar** |
| Diagnóstico heurístico | **Preservar** |
| Status detalhado por documento (Etapa 2/5) | **Estender** lendo contrato/pagamento (confirmar regra) |
| Webhook de baixa de pagamento Efí | **Adicionar** (não existe hoje) — confirmar com cliente |
