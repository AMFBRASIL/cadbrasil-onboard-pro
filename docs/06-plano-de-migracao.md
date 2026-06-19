# Documento 06 — Plano de Migração (Legado → Novo Backend)

> Estratégia para migrar do sistema em `Antigo/` para o novo backend (Next.js + Prisma +
> MySQL), **sem alterar o frontend** e **preservando todas as regras de negócio**.

---

## 1. Estratégia geral

Adotar **migração incremental, sem big-bang**, mantendo paridade de contratos:

1. O novo backend nasce **espelhando** os endpoints do legado (mesmos request/response).
2. Reaproveita-se o **frontend existente** (copiado de `Antigo/` para a raiz do novo
   projeto, sem mudanças visuais).
3. O banco **continua sendo o mesmo MySQL** (compartilhado) — sem migração de dados de
   imediato; apenas adições de índice acordadas.
4. Validação por paridade (mesmos inputs → mesmas saídas e mesmos efeitos no banco).
5. Cutover por DNS/Nginx quando os testes passarem; rollback simples (apontar de volta).

---

## 2. Pré-requisitos (bloqueadores — antes de codar)

| # | Item | Responsável | Status |
|---|------|-------------|--------|
| 1 | `SHOW CREATE TABLE` das 14 tabelas (Doc 02 §6) | DBA/portal | ⬜ |
| 2 | Acesso a um **banco de homologação** (cópia do schema) | DBA | ⬜ |
| 3 | Credenciais de **sandbox**: CNPJ.ws, Efí, API de e-mail | Cliente | ⬜ |
| 4 | Definição da regra de **status detalhado** (Doc 04 §6) | Cliente/portal | ⬜ |
| 5 | Confirmar se haverá **webhook de baixa de pagamento** Efí | Cliente/portal | ⬜ |
| 6 | Rotacionar segredos vazados (`CNPJ_LOOKUP_SECRET`) | Cliente | ⬜ |
| 7 | Aprovação dos Documentos 01–05 | Cliente | ⬜ |

> **Nenhum desenvolvimento começa antes da aprovação destes 6 documentos** (requisito do
> projeto). Os itens 1–6 são insumos que destravam a Fase 1.

---

## 3. Fases

### Fase 0 — Preparação (sem código de produção)
- Coletar `SHOW CREATE TABLE` e anexar ao Doc 02.
- Subir banco de homologação.
- Levantar todas as variáveis de ambiente (Doc 03 §9).

### Fase 1 — Fundação do novo backend
- Inicializar projeto Next.js + TypeScript na **raiz** do repo (o front virá do `Antigo/`).
- Adicionar Prisma; rodar `prisma db pull` (introspecção) → `schema.prisma`.
- Criar `lib/prisma.ts` (singleton) montando `DATABASE_URL` a partir das `DB_*`.
- Validar conexão com `/api/health`.
- Portar os schemas Zod (`validations/cadastro.ts`, `validations/pagamento.ts`) **sem alterar regras**.

### Fase 2 — Migrar o frontend (sem mudanças visuais)
- Copiar `components/`, páginas `app/**` (exceto `api/`), `lib/` client-side
  (`tracking.ts`, `utm.ts`, `cadbrasil-atendimento.ts`, `cnae.ts`, etc.), `public/`,
  estilos e configs (tailwind, shadcn).
- Garantir build idêntico do front. **Checklist visual:** 6 steps, progress bar, modais
  (existente/pagamento/análise SICAF), conclusão, páginas SEO.

### Fase 3 — Portar endpoints (paridade de contrato)
Ordem sugerida (do mais simples ao mais crítico):
1. `GET /api/health`
2. `GET /api/cadastro/documento`
3. Server Action `lookupCnpjAction` + `cnpj.service` (CNPJ.ws)
4. `GET /api/cadastro/[protocolo]`
5. `POST /api/diagnostico-sicaf`
6. `POST /api/pagamento/boleto` e `POST /api/pagamento/pix` (+ `pagamento.service`)
7. `POST /api/cadastro` (núcleo — transação completa via `cadastro.service`)

Para cada endpoint: mover regra para `server/services` + `domain`, mantendo
**request/response idênticos** ao legado.

### Fase 4 — Extensões acordadas (somente após validação)
- Status detalhado por documento (Doc 04 §6) — endpoint compatível/aditivo.
- `POST /api/webhooks/efi` (baixa de pagamento) — se confirmado.
- Substituir `waitUntil` por `after()`/fila (e-mails).
- Índices não-destrutivos (`documento_normalizado`, `UNIQUE protocolo_cadbrasil`).

### Fase 5 — Testes e validação de paridade
- **Unitários:** CPF, protocolo, porte, CNAE, observações, valor da taxa.
- **Integração (homologação):** cadastro PJ e PF completos; duplicidade documento/e-mail;
  CNPJ.ws (mock + real sandbox); ViaCEP; boleto e PIX (sandbox); e-mails (sandbox);
  diagnóstico; consulta por protocolo.
- **Paridade:** rodar os mesmos payloads no legado e no novo; comparar resposta HTTP e o
  estado gravado no banco (linhas em `usuarios/clientes/sicaf_*/contratos/taxas/pagamentos/tracking`).
- **Carga leve:** verificar pool e índices.

### Fase 6 — Cutover e rollback
- Deploy em VPS (PM2 + Nginx) apontando para o **banco de produção**.
- Validar `/api/health` e um cadastro de teste real.
- **Cutover:** trocar o upstream no Nginx (ou DNS) do app antigo para o novo.
- **Rollback:** reverter o upstream/DNS para o legado (que permanece de pé por X dias).
- Monitorar erros 4xx/5xx, e-mails e pagamentos nas primeiras 24–72h.

---

## 4. Riscos e mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Schema real diverge do inferido | Alto | `prisma db pull` antes de qualquer código; testes em homologação |
| Banco compartilhado com portal admin | Alto | Não alterar colunas existentes; só adições acordadas; janela de manutenção p/ índices |
| Quebra de contrato com o front | Alto | Testes de paridade request/response; front inalterado |
| `waitUntil` ausente em VPS | Médio | `after()`/fila; resposta 201 imediata mantida |
| Baixa de pagamento não automatizada | Médio | Confirmar com portal; opcional webhook Efí |
| Segredos vazados | Médio | Rotacionar; `.env` fora do git; cofre |
| Busca de documento sem índice (full scan) | Médio | Coluna normalizada indexada (aditiva) |
| Diferença de fuso/data (contrato +1 ano, vencimentos) | Baixo | Reusar exatamente a lógica de datas do legado |

---

## 5. Critérios de aceite (Definition of Done)

- [ ] Todos os endpoints respondem com **contrato idêntico** ao legado.
- [ ] Frontend **visualmente idêntico** (sem mudanças de design/fluxo/steps).
- [ ] Cadastro PJ e PF gravam exatamente as mesmas tabelas/linhas que o legado.
- [ ] Duplicidade de documento e e-mail bloqueadas (409) como antes.
- [ ] Boleto e PIX gerados e persistidos (`aguardando`→`gerado`/`erro`).
- [ ] E-mails enviados conforme regra (boas-vindas + licença + notificação condicional).
- [ ] CNPJ.ws e ViaCEP preenchem os campos como antes.
- [ ] `/api/health` OK; testes unitários e de integração passando.
- [ ] Deploy em VPS com PM2 + Nginx + backup configurado.
- [ ] Plano de rollback validado.

---

## 6. Decisões pendentes do cliente (para fechar antes da Fase 4)

1. Definição exata de **status** "ativo/inativo/pago" e quem os atualiza (site vs portal).
2. Haverá **webhook de baixa** de pagamento no novo backend?
3. Manter **MySQL** (recomendado) ou avaliar Postgres em projeto separado?
4. Onde hospedar (VPS específica) e estratégia de TLS/observabilidade.
5. Política de **rotação de segredos** e cofre (ex.: variáveis no PM2/host).

---

## 7. Próximo passo imediato

Após **aprovação dos Documentos 01–06**, iniciar a **Fase 0** coletando o
`SHOW CREATE TABLE` e provisionando o banco de homologação. Só então começa o
desenvolvimento (Fase 1).
