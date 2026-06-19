# Documento 03 — Mapeamento das Integrações

> Todas as integrações externas, endpoints, formatos e campos consumidos pelo sistema
> legado (`Antigo/`). Cada item indica **onde está no código** e o que precisa ser
> preservado no novo backend.

---

## 1. Resumo das integrações

| # | Integração | Provedor | Onde | Direção |
|---|------------|----------|------|---------|
| 1 | Consulta de CNPJ | **CNPJ.ws** (comercial) | `lib/cnpj-lookup.ts` + `actions/cnpj-lookup.ts` | site → externo |
| 2 | Consulta de CEP | **ViaCEP** | `CadastroForm.tsx` (`lookupCEP`) | navegador → externo |
| 3 | Pagamento (boleto/PIX) | **Efí / Gerencianet** (`sdk-node-apis-efi`) | `lib/efipay.ts`, `api/pagamento/*` | site → externo |
| 4 | Envio de e-mail | **API interna** `send.cadbr.com.br/sendCron` | `lib/email-api.ts` | site → interno |
| 5 | Lead do diagnóstico | **Webhook/CRM** (configurável) | `api/diagnostico-sicaf/route.ts` | site → externo |
| 6 | Marketing/Conversões | **Google Ads (gtag)**, **GTM (dataLayer)**, **Microsoft Ads (uetq)** | `lib/utm.ts`, `lib/tracking.ts` | navegador → externo |
| 7 | Banco de dados | **MySQL** (compartilhado) | `lib/db.ts` | site ↔ banco |
| 8 | WhatsApp | **wa.me** (link) | `lib/cadbrasil-atendimento.ts` | navegador → externo |

> **Receita Federal / SICAF / Compras.gov.br:** **NÃO há integração direta.** Os dados
> "da Receita Federal" exibidos vêm da **CNPJ.ws** (que consolida dados públicos da RFB).
> O "diagnóstico SICAF" é **heurístico/simulado** (não consulta o SICAF real — ver §5 e Doc 04).
> Não há integração com **AWS/S3** nem serviço de autenticação externo (auth é via banco).

---

## 2. Consulta de CNPJ — CNPJ.ws

**Arquivos:** `src/lib/cnpj-lookup.ts`, `src/app/actions/cnpj-lookup.ts`
(Server Action `lookupCnpjAction`, chamada de `CadastroForm.tsx`).

- **Endpoint:** `GET https://comercial.cnpj.ws/cnpj/{14_digitos}`
- **Autenticação:** header `x_api_token: <CNPJ_WS_API_TOKEN>` (env, **somente servidor**).
  Também há `Accept: application/json`, `cache: "no-store"`.
- **Validação prévia:** documento deve ter exatamente 14 dígitos; senão retorna `null`.
- **Erros:** resposta não-OK → `null` ("CNPJ não localizado"); token ausente →
  `throw "CNPJ_WS_API_TOKEN não configurado"` (vira "Serviço de consulta indisponível").

### Campos consumidos do retorno (e mapeamento)

| Campo CNPJ.ws | Uso no sistema |
|---------------|----------------|
| `razao_social` | `razao_social` |
| `porte.descricao` | normalizado → `MEI / ME / EPP / MEDIA` (`normalizePorte`) |
| `estabelecimento.nome_fantasia` | `nome_fantasia` |
| `estabelecimento.tipo_logradouro` + `logradouro` | `logradouro` |
| `estabelecimento.numero`, `complemento`, `bairro`, `cep` | endereço |
| `estabelecimento.cidade.nome` | `municipio` |
| `estabelecimento.estado.sigla` | `uf` |
| `estabelecimento.ddd1` + `telefone1` | `ddd_telefone_1` (concatenado) |
| `estabelecimento.email` | `email` |
| `estabelecimento.inscricoes_estaduais[]` | escolhe a **ativa da UF** → `inscricao_estadual` |
| `estabelecimento.atividade_principal` | CNAE principal |
| `estabelecimento.atividades_secundarias[]` | CNAEs secundários |

**Regras de normalização (preservar):**
- **Porte:** "micro empreendedor"/"mei" → `MEI`; "pequeno" → `EPP`; "micro" → `ME`;
  "demais"/default → `MEDIA`.
- **CNAE:** código normalizado para **7 dígitos** (subclasse), via `id` ou `subclasse`.
  Deduplicação por `tipo:codigo`. Principal recebe `ordem=0`, secundários `1..n`.
- **Inscrição Estadual:** prioriza a IE **ativa cuja UF == UF do estabelecimento**;
  senão a primeira ativa; senão a primeira da lista.

> ⚠️ `CNPJ_LOOKUP_SECRET` aparece no `.env.example` com valor real — não é o token da
> CNPJ.ws (`CNPJ_WS_API_TOKEN`), mas ainda assim deve ser tratado como segredo e
> rotacionado.

---

## 3. Consulta de CEP — ViaCEP

**Arquivo:** `src/components/CadastroForm.tsx` → `lookupCEP()`.

- **Endpoint:** `GET https://viacep.com.br/ws/{8_digitos}/json/`
- **Autenticação:** nenhuma (API pública).
- **Execução:** **no navegador** (client-side), disparada quando o CEP atinge 8 dígitos.
- **Tratamento de erro:** `data.erro === true` → toast "CEP não encontrado".

### Campos consumidos

| Campo ViaCEP | Campo do formulário |
|--------------|---------------------|
| `logradouro` | `rua` |
| `bairro` | `bairro` |
| `localidade` | `cidade` |
| `uf` | `estado` (maiúsculo) |

> Observação: o lookup de CNPJ também preenche o endereço; o ViaCEP é o preenchimento
> manual por CEP. Na migração, avaliar mover essa chamada para o backend (ver Doc 05),
> mas **o comportamento de UX deve permanecer idêntico**.

---

## 4. Pagamento — Efí / Gerencianet

**Arquivos:** `src/lib/efipay.ts`, `src/lib/pagamento-registro.ts`,
`src/app/api/pagamento/boleto/route.ts`, `src/app/api/pagamento/pix/route.ts`.
SDK: **`sdk-node-apis-efi`** (não pode ser bundlado — está em
`serverComponentsExternalPackages`).

### 4.1 Credenciais e configuração (env)

| Variável | Função |
|----------|--------|
| `EFI_SANDBOX` | `"true"` ativa sandbox |
| `EFI_CLIENT_ID`, `EFI_CLIENT_SECRET` | credenciais OAuth da Efí |
| `EFI_CERTIFICATE_BASE64` | certificado `.p12` em Base64 (`cert_base64: true`) |
| `EFI_PIX_CHAVE` | chave PIX recebedora |
| `EFI_COBRANCA_VALOR_CENTS` | valor padrão (fallback) em centavos (default `9900`) |
| `EFI_BOLETO_DIAS_VENCIMENTO` | dias até vencimento (default 3, faixa 1–30) |
| `EFI_PIX_EXPIRACAO_SEGUNDOS` | expiração do PIX (default 3600, faixa 300–86400) |
| `EFI_NOTIFICATION_URL` | webhook de notificação (opcional, enviado no boleto) |

Credenciais incompletas → erro `EFI_CONFIG_INCOMPLETA`; chave PIX ausente →
`EFI_PIX_CHAVE_INDEFINIDA` (HTTP 503 ao cliente).

### 4.2 Valor da cobrança (regra)

`resolveValorCobrancaCentavos()`:
1. Lê `configuracoes_sistema.valor_cadastro_sicaf` (reais, aceita `,` ou `.`) → centavos;
2. fallback `EFI_COBRANCA_VALOR_CENTS`; fallback final `9900` (R$ 99,00).

### 4.3 Boleto — `createOneStepCharge`
- Item: `{ name: "Taxa licença CADBRASIL / SICAF", value: <centavos>, amount: 1 }`.
- `metadata.custom_id = protocolo` (+ `notification_url` se configurado).
- `payment.banking_billet.customer`: PJ usa `juridical_person {corporate_name, cnpj}`;
  PF usa `name, cpf`. Inclui `email`, `phone_number` (normalizado p/ DDD+8/9 dígitos),
  `address {street, number, neighborhood, zipcode, city, state, complement?}`.
- `expire_at` = hoje + `EFI_BOLETO_DIAS_VENCIMENTO`.
- Retorno usado: `charge_id`, `barcode`, `billet_link`/`link`, `pdf.charge`, `expire_at`, `total`.
- Trata `payload.refusal` (cobrança recusada) → erro 400.

### 4.4 PIX — `pixCreateimmediateCharge`
- `calendario.expiracao` (segundos), `devedor` (nome + cpf/cnpj), `valor.original` (string `0.00`),
  `chave` (EFI_PIX_CHAVE), `solicitacaoPagador`, `infoAdicionais [{protocolo}]`.
- Retorno usado: `txid`, `pixCopiaECola`, `loc.id`. O **QR Code é gerado localmente**
  via `qrcode` (`QRCode.toDataURL`, 280px) — **não vem da Efí**.

### 4.5 Persistência do pagamento (preservar o ciclo)

Para ambos (boleto/PIX), antes de chamar a Efí:
1. `resolveClienteSicafPorProtocolo(protocolo)` — encontra cliente+SICAF; **cria SICAF
   se não existir** (idempotente);
2. `ensureTaxaCadastroPortal(...)` — cria/reaproveita `taxas_sicaf` pendente;
3. `insertPagamentoGerencianetAguardando(...)` — cria `pagamentos_gerencianet` status `aguardando`.

Após a Efí:
- sucesso → `marcarPagamentoGerencianetGeradoBoleto/Pix` (status `gerado` + dados Efí) e
  `UPDATE taxas_sicaf` (forma_pagamento/codigo_barras/chave_pix);
- falha → `marcarPagamentoGerencianetErro` (status `erro` + mensagem).

> **Webhook de retorno da Efí (confirmação de pagamento):** o `EFI_NOTIFICATION_URL` é
> apenas **enviado** à Efí no boleto, mas **não existe rota** no projeto legado que
> receba/processe a notificação (ex.: `/api/webhooks/efi`). Ou seja, **a baixa do
> pagamento não é automatizada neste projeto** — provavelmente é feita pelo portal
> administrativo. Recomenda-se implementar essa rota no novo backend (ver Doc 05).

---

## 5. Envio de e-mail — API interna (send.cadbr.com.br)

**Arquivo:** `src/lib/email-api.ts`.

- **Endpoint:** `POST https://send.cadbr.com.br/sendCron` (env `EMAIL_API_URL`).
  Se a URL contiver `"your-"`, o envio é **desativado** (placeholder).
- **Timeout:** 25s (`AbortController`).
- **Payload:** `{ email_destino, nome_destino, assunto, corpo_html, corpo_texto,
  prioridade:1, max_tentativas:3, id_dominio:null, data_agendamento:null }`.
- **Templates do banco:** lê `templates_email` (**id=1** boas-vindas, **id=23** licença
  ativada). Se ativo e com corpo → renderiza placeholders `{{var}}` (com escape no corpo);
  senão usa HTML/texto **fallback embutido** no código.
- **E-mails disparados pós-cadastro** (`dispararEmailsPosCadastro`, via `waitUntil`):
  1. **Boas-vindas** ao responsável;
  2. **Licença ativada** ao responsável;
  3. **Notificação interna** para `EMAIL_NOTIFICATION_EMAIL` — **somente se
     `aceitaNotificacoes === true`**.
- Variáveis: `EMAIL_API_URL`, `EMAIL_NOTIFICATION_EMAIL`, `PORTAL_URL`/`NEXT_PUBLIC_SITE_URL`
  (link de acesso, default `https://fornecedor.cadbrasil.com.br`).

---

## 6. Lead do diagnóstico SICAF — Webhook/CRM

**Arquivo:** `src/app/api/diagnostico-sicaf/route.ts`.

- **Entrada (POST):** `{ nome, email, whatsapp, cnpj(14), score, classificacao, situacao?,
  origem, utm_* , gclid, gbraid, gad_source, gad_campaignid, msclkid, landing_page, referrer }`
  (validado com Zod).
- **Destino:** se `DIAGNOSTICO_SICAF_WEBHOOK_URL` estiver setado, faz `POST` do lead
  (acrescido de `criado_em` e `ferramenta:"diagnostico-sicaf"`); senão apenas loga no
  servidor.
- **Não grava no banco.** É um capturador de lead para CRM/automação externa.

### 5.1 Diagnóstico (lógica, não integração)

`src/lib/sicaf-diagnosis.ts` e `segment-opportunity.ts`: o "score", os indicadores
("SICAF não localizado", "Certidões pendentes" etc.) e a quantidade de licitações são
**gerados por hash determinístico do CNPJ/segmento** — **não há consulta real ao SICAF
nem à Receita**. As etapas de "scanner" (Receita/SICAF/certidões) são apenas animação
de UI com durações fixas. **Isto deve ser preservado como está** (é marketing), mas
documentado para não induzir a erro.

---

## 7. Marketing e conversões (client-side)

**Arquivos:** `src/lib/utm.ts`, `src/lib/tracking.ts`.

- **Google Ads (gtag):** `AW-16460586067` (constante no código + `layout.tsx`).
  `trackConversion(event, value?)` dispara `gtag('event', ...)`.
- **Google Tag Manager:** `window.dataLayer.push(...)`.
- **Microsoft Ads (Bing):** `window.uetq.push(...)`.
- **Conversão "Engagement":** `NEXT_PUBLIC_GADS_ENGAGEMENT_SEND_TO` ou
  `..._LABEL` (+ `..._AUTO`, `..._DELAY_MS`).
- **Captura de UTM:** parâmetros `utm_*`, `gclid`, `gbraid`, `wbraid`, `gad_source`,
  `gad_campaignid`, `msclkid`, `fbclid` persistidos em `localStorage`/`sessionStorage`
  e enviados no corpo do `POST /api/cadastro` (gravados em `tracking_sessoes`).
  Heurísticas: gclid/gad_source/gbraid → google/cpc; msclkid → bing/cpc;
  `utm_campaign` vazio usa `gad_campaignid`.

---

## 8. WhatsApp e banco

- **WhatsApp:** `src/lib/cadbrasil-atendimento.ts` — número `551121220202`, link `wa.me`
  (apenas link, sem API).
- **MySQL:** ver Documento 02 (não é "integração externa" propriamente, mas é a
  dependência mais crítica — banco **compartilhado** com o portal administrativo).

---

## 9. Variáveis de ambiente — checklist consolidado

```
# Banco
DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME (+ variantes DB_WRITE_*)
DB_POOL_LIMIT

# CNPJ
CNPJ_WS_API_TOKEN
CNPJ_LOOKUP_SECRET   (rotacionar — vazou no .env.example)

# Efí
EFI_SANDBOX / EFI_CLIENT_ID / EFI_CLIENT_SECRET / EFI_CERTIFICATE_BASE64
EFI_PIX_CHAVE / EFI_COBRANCA_VALOR_CENTS / EFI_BOLETO_DIAS_VENCIMENTO
EFI_PIX_EXPIRACAO_SEGUNDOS / EFI_NOTIFICATION_URL

# E-mail
EMAIL_API_URL / EMAIL_NOTIFICATION_EMAIL / PORTAL_URL (ou NEXT_PUBLIC_SITE_URL)

# Diagnóstico
DIAGNOSTICO_SICAF_WEBHOOK_URL

# Público / Marketing
NEXT_PUBLIC_PORTAL_URL / NEXT_PUBLIC_COBRANCA_VALOR_CENTS
NEXT_PUBLIC_GADS_ENGAGEMENT_SEND_TO / _LABEL / _AUTO / _DELAY_MS
```
