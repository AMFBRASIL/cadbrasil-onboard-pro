# Documento 05 — Proposta de Arquitetura do Novo Backend

> Objetivo: backend moderno, escalável e de fácil manutenção, **preservando 100% das
> regras de negócio** do legado e **sem alterar o frontend** já desenvolvido.

---

## 1. Princípios e restrições

1. **Frontend intocável.** O novo backend deve expor **os mesmos endpoints, com os
   mesmos contratos (request/response)** que o front já consome:
   - `POST /api/cadastro`
   - `GET /api/cadastro/[protocolo]`
   - `GET /api/cadastro/documento`
   - `POST /api/pagamento/boleto`
   - `POST /api/pagamento/pix`
   - `POST /api/diagnostico-sicaf`
   - `GET /api/health`
   - Server Action `lookupCnpjAction` (ou endpoint equivalente).
   - O ViaCEP continua sendo chamado no client (ou via proxy — comportamento idêntico).
2. **Banco compartilhado.** O MySQL é mantido pelo portal administrativo. O novo backend
   **não pode quebrar** o schema existente. ORM por **introspecção** (não `migrate`
   destrutivo).
3. **Fácil deploy em VPS Linux**, backup simples, escalável.

---

## 2. Stack recomendada

| Camada | Escolha | Justificativa |
|--------|---------|---------------|
| Runtime/Framework | **Next.js 14+ (App Router) + TypeScript** | mantém o front atual sem reescrita; mesmo projeto full-stack |
| ORM | **Prisma** (provider `mysql`) | tipagem forte, `db pull` (introspecção) preserva o schema legado, fácil manutenção |
| Banco | **MySQL** (o existente) | compatibilidade total com o legado; **não migrar para Postgres agora** |
| Validação | **Zod** (reaproveitar os schemas atuais) | regras de negócio idênticas |
| Pagamento | **`sdk-node-apis-efi`** | manter integração validada |
| E-mail | API HTTP `send.cadbr.com.br` | manter |
| Tarefas pós-resposta | **`after()` do Next 15** ou fila/`setImmediate` em VPS | substituir `@vercel/functions waitUntil` |
| Processo (VPS) | **PM2** + Nginx (reverse proxy) | já há `ecosystem.config.cjs`/`deploy.sh` |

> **Por que MySQL e não Postgres:** o requisito pede "avaliar compatibilidade com
> legado". Como o banco é **compartilhado e em produção** com o portal administrativo,
> trocar de SGBD exigiria migrar/duplicar todo o ecossistema — risco alto e fora do
> escopo. **Recomendação: manter MySQL.** (Postgres só se o cliente decidir migrar todo o
> ecossistema, o que seria um projeto à parte.)

> **Por que Prisma e não NestJS/Express:** manter Next.js evita reescrever o frontend e
> os Route Handlers já existentes. Prisma dá organização, tipos e migrations versionadas
> daqui pra frente, sem abandonar o SQL legado (dá pra usar `$queryRaw` onde necessário).

---

## 3. Arquitetura em camadas (proposta)

```
app/
  api/                      # Route Handlers (contratos idênticos ao legado)
    cadastro/route.ts
    cadastro/[protocolo]/route.ts
    cadastro/documento/route.ts
    pagamento/boleto/route.ts
    pagamento/pix/route.ts
    diagnostico-sicaf/route.ts
    health/route.ts
    webhooks/efi/route.ts   # NOVO (baixa automática de pagamento) — confirmar c/ cliente
  actions/cnpj-lookup.ts    # Server Action (mantida)

server/                     # NOVO: camada de aplicação isolada e testável
  services/
    cadastro.service.ts     # orquestra a transação de cadastro
    cliente.service.ts      # consultas (existência + status detalhado)
    pagamento.service.ts    # taxas + pagamentos Efí
    email.service.ts        # envio de e-mail
    cnpj.service.ts         # CNPJ.ws
  repositories/             # acesso a dados (Prisma)
    cliente.repo.ts  usuario.repo.ts  sicaf.repo.ts
    contrato.repo.ts  pagamento.repo.ts  tracking.repo.ts
  domain/                   # regras puras (sem I/O) — fácil de testar
    protocolo.ts  cpf.ts  porte.ts  cnae.ts  observacoes.ts
  integrations/
    efi.client.ts  cnpjws.client.ts  email.client.ts

lib/
  prisma.ts                 # PrismaClient singleton (substitui o pool manual)
  validations/{cadastro,pagamento}.ts   # Zod (reaproveitado do legado)

prisma/
  schema.prisma             # gerado por `prisma db pull` (introspecção)
```

Benefícios: regras de negócio saem dos Route Handlers para **services/domain**
(testáveis, reutilizáveis), enquanto os **contratos HTTP permanecem idênticos**.

---

## 4. Banco de dados e Prisma

1. Coletar `SHOW CREATE TABLE` (Doc 02 §6).
2. `prisma db pull` para gerar `schema.prisma` **a partir do banco real** (zero
   divergência). Marcar com `@@map`/`@map` os nomes legados.
3. Decisão sobre os **fallbacks de schema** do legado (colunas que podem não existir):
   - Após o `db pull`, o schema fica **conhecido e único** → os 3 `INSERT` alternativos
     viram **um só**. Mantemos os fallbacks apenas se o ambiente real ainda tiver
     variações (a confirmar).
4. **Melhorias de performance (não-destrutivas, opcionais e acordadas):**
   - Adicionar coluna gerada/indexada `documento_normalizado` em `clientes`, ou um índice
     funcional, para a busca de duplicidade deixar de ser full scan.
   - Índice `UNIQUE` em `clientes.protocolo_cadbrasil`.
   - Estas mudanças entram como **migration aditiva** e precisam de OK do time do portal.
5. **PrismaClient singleton** (padrão `globalThis`) substituindo o pool manual de `db.ts`,
   mas mantendo as variáveis `DB_*`/`DB_WRITE_*` (montar `DATABASE_URL` a partir delas).

---

## 5. Endpoints — contratos preservados (+ extensões)

| Endpoint | Mudança proposta |
|----------|------------------|
| `POST /api/cadastro` | **idêntico**; lógica movida p/ `cadastro.service` (mesma transação e respostas) |
| `GET /api/cadastro/documento` | **compatível**: continua retornando `{exists}`; pode ganhar `?detalhado=1` que adiciona status (contrato/pagamento/sicaf) sem quebrar o uso atual |
| `GET /api/cadastro/[protocolo]` | **idêntico** |
| `POST /api/pagamento/boleto` e `/pix` | **idêntico** |
| `POST /api/diagnostico-sicaf` | **idêntico** |
| `GET /api/health` | **idêntico** |
| `POST /api/webhooks/efi` | **NOVO** (opcional): recebe notificação da Efí e dá baixa em `pagamentos_gerencianet`/`taxas_sicaf`. Requer confirmação do fluxo com o portal admin |

> O endpoint de status detalhado (Etapa 2/5) será definido junto com o cliente para não
> inventar regra (ver Doc 04 §6 e Doc 06).

---

## 6. Substituição de dependências da Vercel

- `waitUntil(@vercel/functions)` → em VPS com `next start`, usar **`after()`** (Next 15)
  ou, em Next 14, disparar o trabalho assíncrono com tratamento de erro e `maxDuration`
  adequado; alternativamente uma **fila leve** (ex.: tabela de jobs + cron/PM2) para
  e-mails, aumentando a confiabilidade. O comportamento externo (resposta 201 imediata)
  permanece.

---

## 7. Segurança

1. **Rotacionar segredos** que vazaram no `.env.example` (`CNPJ_LOOKUP_SECRET`) e nunca
   commitar `.env`.
2. Manter chamadas a CNPJ.ws/Efí/e-mail **somente no servidor** (já é assim).
3. **Rate limiting** em `/api/cadastro`, `/api/pagamento/*` e `/api/cadastro/documento`
   (evitar enumeração de CNPJ/abuso) — ex.: middleware por IP.
4. Validar/normalizar todas as entradas com Zod (já existe) também no novo backend.
5. Logs sem PII sensível; mascarar documentos em logs.
6. HTTPS no Nginx; headers de segurança.

---

## 8. Qualidade e manutenção

- **Testes** unitários para `domain/` (CPF, protocolo, porte, CNAE, observações) e de
  integração para os services (banco de teste).
- **ESLint + TypeScript strict** (já presentes).
- **Variáveis de ambiente** validadas no boot (Zod), falhando cedo se faltar config crítica.
- **Observabilidade:** `/api/health` (já existe) + logs estruturados.

---

## 9. Deploy em VPS Linux (fácil + backup + escala)

```
Nginx (TLS, reverse proxy) ─► Next.js (PM2, cluster) ─► MySQL (existente)
```

- **PM2** em modo cluster (reaproveitar `ecosystem.config.cjs`) para escalar por CPU.
- **Backup:** `mysqldump` agendado (cron) + retenção; como o app é stateless, basta
  versionar código + `.env` (em cofre).
- **CI/CD simples:** `git pull && npm ci && npm run build && pm2 reload` (via `deploy.sh`).
- **Escalabilidade:** stateless permite múltiplas instâncias atrás do Nginx; o gargalo é
  o MySQL — daí a importância dos índices (§4) e do pool (`DB_POOL_LIMIT`).

> ⚠️ **Lembrete (regra do projeto/Lovable):** este repositório está conectado ao Lovable.
> Não reescrever histórico git já publicado; manter a branch sempre funcional.

---

## 10. O que NÃO muda

- Todo o **frontend** (`components/`, páginas, design, steps, progress, UX).
- Os **contratos** dos endpoints atuais.
- As **regras de negócio** (Documento 04).
- As **integrações** e seus formatos (Documento 03).
- O **MySQL** e o schema (apenas adições aditivas acordadas).
