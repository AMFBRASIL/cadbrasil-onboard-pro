# Documento 01 — Mapeamento Completo do Sistema Legado

> Projeto: **CADBRASIL — Portal de Cadastro de Clientes**
> Base analisada: pasta `Antigo/` (sistema atualmente em produção)
> Status: **análise para aprovação** — nenhuma alteração de código foi feita

---

## 1. Visão geral

O sistema legado é um **site público de captação e cadastro de fornecedores/clientes**
para serviços de **SICAF / licitações** da CADBRASIL. Ele funciona como o "funil de
entrada": captura o lead, consulta dados oficiais, cria o cadastro no banco de dados
**compartilhado com o portal administrativo** (`fornecedor.cadbrasil.com.br`), dispara
e-mails e oferece o pagamento da taxa de licença (boleto/PIX via Efí).

Pontos centrais:

- É um **front-end + back-end no mesmo projeto Next.js** (App Router), publicado
  originalmente na Vercel (uso de `@vercel/functions` `waitUntil`).
- **Não tem ORM nem migrations**: acessa o MySQL diretamente via `mysql2/promise`
  com SQL escrito à mão.
- **O banco de dados não é criado por este projeto** — ele apenas **escreve/lê** em um
  banco já existente (mantido pelo portal administrativo). Há vários *fallbacks* no
  código de `INSERT` que tentam colunas alternativas, indicando que o site precisa
  conviver com versões diferentes do schema.
- Toda a lógica sensível (banco, Efí, CNPJ.ws, e-mail) roda **apenas no servidor**
  (Route Handlers e Server Actions).

---

## 2. Arquitetura utilizada

### 2.1 Estilo arquitetural

| Camada | Implementação no legado |
|--------|--------------------------|
| Apresentação | React 18 + Next.js 14 (App Router), componentes client (`"use client"`) |
| UI Kit | shadcn/ui (Radix UI) + Tailwind CSS |
| Lógica de aplicação (back-end) | Route Handlers em `src/app/api/**/route.ts` + Server Actions em `src/app/actions/*` |
| Regras de negócio / domínio | Funções utilitárias em `src/lib/*` (sem camada de serviço formal) |
| Acesso a dados | `mysql2/promise` (pool global), SQL manual, sem ORM |
| Validação | Zod (`src/lib/validations/*`) tanto no client quanto no server |
| Integrações externas | `fetch` HTTP + SDK `sdk-node-apis-efi` |

> **Resumo:** monólito Next.js *full-stack*, sem separação física entre front e back,
> sem ORM e sem camada de serviço explícita. As "regras de negócio" estão espalhadas
> entre os Route Handlers (`api/cadastro/route.ts`, `api/pagamento/*`) e os helpers de
> `src/lib`.

### 2.2 Framework e principais bibliotecas

(Confirmadas em `Antigo/package.json`)

- **Next.js** `^14.2.18` (App Router) + **React** `^18.3.1`
- **TypeScript** `^5.8.3`
- **mysql2** `^3.14.0` — acesso ao banco
- **zod** `^4.3.6` — validação de schemas
- **bcryptjs** `^2.4.3` — hash de senha do usuário (`senha_hash`)
- **sdk-node-apis-efi** `^1.3.1` — boleto/PIX (Efí / Gerencianet)
- **qrcode** `^1.5.4` — geração do QR Code PIX (data URL)
- **@vercel/functions** `^3.4.4` — `waitUntil` (envio de e-mail pós-resposta)
- **react-hook-form** + **@hookform/resolvers** + **zod** — formulário multi-step
- **sonner** — toasts; **lucide-react** — ícones; **tailwindcss** + **tailwindcss-animate**
- shadcn/ui completo em `src/components/ui/*` (~50 componentes)

### 2.3 Configurações relevantes

- `next.config.mjs`: `reactStrictMode: true` e
  `serverComponentsExternalPackages: ["sdk-node-apis-efi", "qrcode"]`
  (pacotes que não podem ser empacotados pelo bundler do servidor).
- Deploy: há `ecosystem.config.cjs` (PM2), `deploy.sh` e `start-server.sh` →
  indica que **também roda em VPS Linux** (`next start`), além da Vercel.
- `Antigo/.npmrc`, `Antigo/components.json` (config shadcn), `tailwind.config.ts`,
  `tsconfig.json`.

---

## 3. Estrutura de pastas (resumida)

```
Antigo/
├── src/
│   ├── app/
│   │   ├── page.tsx                       # Landing page principal (LandingPage)
│   │   ├── layout.tsx, providers.tsx      # Layout + React Query/Theme + scripts gtag
│   │   ├── sitemap.ts, not-found.tsx
│   │   ├── actions/
│   │   │   └── cnpj-lookup.ts             # Server Action: consulta CNPJ (CNPJ.ws)
│   │   ├── api/                           # BACK-END (Route Handlers)
│   │   │   ├── cadastro/route.ts          # POST cadastro completo (núcleo do sistema)
│   │   │   ├── cadastro/[protocolo]/route.ts  # GET dados por protocolo
│   │   │   ├── cadastro/documento/route.ts    # GET verifica se documento já existe
│   │   │   ├── pagamento/boleto/route.ts  # POST gera boleto (Efí)
│   │   │   ├── pagamento/pix/route.ts     # POST gera PIX (Efí)
│   │   │   ├── diagnostico-sicaf/route.ts # POST lead do diagnóstico (webhook/CRM)
│   │   │   └── health/route.ts            # GET healthcheck do banco
│   │   ├── conclusao-cadastro/            # Tela pós-cadastro (protocolo + pagamento)
│   │   ├── diagnostico-sicaf/             # Ferramenta de "diagnóstico" (lead magnet)
│   │   └── [12+ páginas de SEO/guias]     # Conteúdo institucional (ver §5)
│   ├── components/
│   │   ├── CadastroForm.tsx               # Formulário multi-step (6 passos) — núcleo do front
│   │   ├── PagamentoTaxaDialog.tsx        # Modal boleto/PIX
│   │   ├── LandingPage.tsx, SicafAnalysisModal.tsx, WhatsAppFloatButton.tsx ...
│   │   └── ui/*                           # shadcn/ui
│   └── lib/
│       ├── db.ts                          # Pool MySQL
│       ├── cadastro-portal.ts             # Helpers de mapeamento p/ o cadastro
│       ├── cnpj-lookup.ts                 # Cliente da API CNPJ.ws + normalização
│       ├── cnae.ts, clientes-cnaes.ts     # Normalização/persistência de CNAEs
│       ├── efipay.ts                      # Cliente Efí (boleto/PIX)
│       ├── pagamento-registro.ts          # Persistência de taxas/pagamentos
│       ├── pagamento-protocolo.ts         # Validação de protocolo
│       ├── email-api.ts                   # Envio de e-mail (send.cadbr.com.br)
│       ├── protocolo.ts, senha.ts         # Geração de protocolo / senha temporária
│       ├── tracking.ts, utm.ts            # Marketing / UTM / conversões (gtag/dataLayer)
│       ├── sicaf-diagnosis.ts             # Score "fake/heurístico" do diagnóstico
│       ├── segment-opportunity.ts         # Estimativa motivacional de licitações
│       ├── cadbrasil-atendimento.ts       # WhatsApp institucional
│       └── validations/{cadastro,pagamento}.ts  # Schemas Zod
└── public/                               # Imagens dos guias, favicon, robots.txt
```

---

## 4. Fluxo de telas

O coração do site é a **landing page** (`/`) que contém o componente
`CadastroForm` (formulário multi-step). As demais páginas são conteúdo institucional/SEO
que direcionam o usuário para o cadastro.

### 4.1 Formulário de cadastro — 6 passos

Definido em `CadastroForm.tsx` (`const STEPS`):

| Passo | Label | Campos principais |
|-------|-------|-------------------|
| 0 | **Tipo** | `tipoPessoa` (PJ/PF) |
| 1 | **Identificação** | PJ: `cnpj`, `razaoSocial`, `porte`, `segmento` · PF: `cpf`, `nomeResponsavel` |
| 2 | **Responsável** | `nomeResponsavel`, `cpf`, `telefone`, `email` |
| 3 | **Endereço** | `cep`, `rua`, `numero`, `complemento`, `bairro`, `cidade`, `estado` |
| 4 | **Atendimento** | `servico`, `observacoes` (+ `possuiSicaf`, `prioritario`) |
| 5 | **Confirmação** | `senha`, `confirmarSenha`, `emailAcesso`, `aceiteTermos` |

Ações automáticas dentro do formulário:

- **Ao completar o CNPJ (14 dígitos):** `handleCnpjCompleted` →
  1. `checkExistingSupplier` (GET `/api/cadastro/documento`) — se já existe, abre modal
     "fornecedor já cadastrado" e bloqueia o avanço;
  2. se não existe, `lookupCNPJ` (Server Action CNPJ.ws) preenche automaticamente
     razão social, nome fantasia, IE, porte, segmento, CNAEs, endereço, telefone, e-mail.
- **Ao completar o CPF (PF):** valida dígito verificador + `checkExistingSupplier`.
- **Ao completar o CEP (8 dígitos):** `lookupCEP` → ViaCEP preenche rua/bairro/cidade/UF.
- **"Analisar SICAF":** abre `SicafAnalysisModal` (animação + score heurístico, ver Doc 03/04).

### 4.2 Fluxo de navegação entre telas

```
Landing (/) ──> CadastroForm (6 passos) ──[POST /api/cadastro]──> sucesso
        │                                          │
        │                                          └─> redirect /conclusao-cadastro?protocolo=SICAF-XXXX
        │
        └─> /diagnostico-sicaf (lead magnet) ──[POST /api/diagnostico-sicaf]──> webhook/CRM

/conclusao-cadastro
   ├─> Botão "Pagar taxa" ──> PagamentoTaxaDialog
   │        ├─[POST /api/pagamento/boleto]──> Efí ──> boleto (linha digitável/PDF/link)
   │        └─[POST /api/pagamento/pix]────> Efí ──> PIX (copia-e-cola + QR Code)
   ├─> Botão "Acessar portal" ──> https://fornecedor.cadbrasil.com.br/auth
   └─> Dispara conversão (gtag / dataLayer / uetq) via trackConversion()
```

> A tela de conclusão também carrega os dados do cadastro via
> `GET /api/cadastro/[protocolo]` quando necessário.

---

## 5. Páginas institucionais / SEO (mantidas no front)

Além do fluxo de cadastro, há ~13 páginas de conteúdo (não devem ser alteradas
visualmente). São essencialmente estáticas/SEO e **não possuem regra de negócio de
back-end** (exceto o diagnóstico):

`cadastro-sicaf-licitacao-publica`, `atualizar-certificados-sicaf`,
`procedimento-login-senha`, `beneficios-cadbrasil`, `procedimento-sicaf`,
`documentos-necessarios-cadastro-sicaf`, `diagnostico-sicaf`,
`regularizar-sicaf-empresa`, `procedimentos-cadbrasil`, `documentos-sicaf`,
`procedimento-clientes-existentes`, `conclusao-cadastro`,
`instalador-assistente-cadbrasil`, `assistente-uso`.

Configuração de guias SEO em `src/lib/seo-guides/*`.

---

## 6. Fluxo de cadastro (ponta a ponta) — visão de back-end

`POST /api/cadastro` (`src/app/api/cadastro/route.ts`) executa, **dentro de uma transação MySQL**:

1. Valida o corpo com `cadastroBodySchema` (Zod, com `passthrough` para UTM).
2. Verifica **documento duplicado** em `clientes` (CPF/CNPJ normalizado sem máscara) → `409`.
3. Verifica **e-mail de acesso duplicado** em `usuarios` → `409`.
4. Busca `perfis_acesso` (tipo `cliente`, ativo) → se não existir, erro `500`.
5. Cria **usuário** (`usuarios`) com `senha_hash` (bcrypt, custo 10).
6. Cria **cliente** (`clientes`, status `Ativo`) — com fallbacks de schema.
7. Insere **CNAEs** (`clientes_cnaes`) quando PJ.
8. Cria **registro SICAF** (`sicaf_cadastros`, status `Pendente`) + **nível** (`sicaf_niveis`, nível `I`).
9. Insere **contato principal** (`cliente_contatos`).
10. Cria **contrato digital** (`contratos_digitais`, status `Assinado`, vigência de 1 ano,
    grava IP de assinatura).
11. `commit`.
12. **Pós-commit (não bloqueante):** insere `tracking_sessoes` (UTM/marketing) e dispara
    e-mails (boas-vindas + licença ativada + notificação interna opcional) via
    `waitUntil`.
13. Retorna `201` com `{ protocolo, idUsuario, idCliente, idPedido }`.

> Detalhamento completo das regras está no **Documento 04**.

---

## 7. Observações importantes para a migração

1. **Banco compartilhado e legado**: o schema é "de fora" (portal administrativo). O
   código tem *fallbacks* (`ER_BAD_FIELD_ERROR` / errno 1054) que testam colunas
   alternativas: `cnae_principal` opcional, `protocolo_cadbrasil` vs `protocoloCadbrasil`,
   endereço dividido vs `endereco` único, `cliente_contatos.cpf` opcional. **Isso precisa
   ser preservado ou consolidado com cuidado** (ver Documento 06).
2. **Sem migrations/ORM**: não há fonte de verdade do schema dentro do repositório. O
   schema do Documento 02 foi **inferido** a partir dos `INSERT`/`SELECT`.
3. **Segredos no `.env.example`**: o `CNPJ_LOOKUP_SECRET` aparece com valor real no
   arquivo de exemplo — deve ser **rotacionado** na migração.
4. **Acoplamento com a Vercel**: `waitUntil` (`@vercel/functions`) precisa de
   alternativa equivalente em VPS (ver Documento 05).
5. **Lógica de status do cliente** (existe/ativo/inativo/contrato/pagamento) está
   **parcialmente implementada**: hoje o site só verifica *existência* do documento
   (`/api/cadastro/documento`). Os requisitos das Etapas 2 e 5 (status detalhado) exigem
   leitura adicional de `contratos_digitais` e `pagamentos_gerencianet` — ver Documento 04.
