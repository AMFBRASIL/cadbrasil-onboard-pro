# Configuração GTM — CADBRASIL Cadastro

Container: **GTM-TRVTMS6M**

O código do site já envia eventos ao `dataLayer`. No [Google Tag Manager](https://tagmanager.google.com/), crie os triggers e tags abaixo.

## Variáveis do dataLayer (criar como Data Layer Variables)

| Nome GTM | Chave dataLayer |
|----------|-----------------|
| DL - protocolo | `protocolo` |
| DL - funnel_step | `funnel_step` |
| DL - page_path | `page_path` |
| DL - conversionValue | `conversionValue` |
| DL - utm_source | `utmSource` |
| DL - gclid | `gclid` |

## Triggers (Custom Event)

| Nome | Event name | Condição extra |
|------|------------|----------------|
| CE - virtual_pageview | `virtual_pageview` | — |
| CE - cadastro_concluido | `cadastro_concluido` | — |
| CE - conclusao_cadastro_view | `conclusao_cadastro_view` | — |
| CE - conclusao_cadastro_confirmada | `conclusao_cadastro_confirmada` | — |
| CE - funnel_step conclusao | `funnel_step` | `funnel_step` = `conclusao` |
| CE - portal_fornecedor_click | `portal_fornecedor_click` | — |

## Tags sugeridas

### Google Ads — Conversão principal
- **Tipo:** Google Ads Conversion Tracking
- **Conversion ID:** AW-16460586067
- **Trigger:** CE - cadastro_concluido
- **Conversion value:** usar variável `conversionValue` (985)

### Google Ads — Reforço conclusão
- **Trigger:** CE - conclusao_cadastro_confirmada

### GA4 — Eventos
- **Tipo:** Google Analytics: GA4 Event
- **Event name:** igual ao Custom Event (`cadastro_concluido`, etc.)
- **Triggers:** todos os CE acima

### GA4 — Pageview SPA
- **Event name:** `page_view`
- **Trigger:** CE - virtual_pageview
- **Parâmetros:** `page_path`, `page_title`, `page_location`

## Fluxo do funil

```
Landing (/) → cadastro (formulário) → cadastro_concluido → /conclusao-cadastro → conclusao_cadastro_view + conclusao_cadastro_confirmada → portal_fornecedor_click
```

## Teste

1. GTM Preview + site em produção ou staging
2. Concluir um cadastro de teste
3. Verificar no dataLayer: `cadastro_concluido`, depois `conclusao_cadastro_view`, `funnel_step`, `conclusao_cadastro_confirmada`

## Referência no código

Eventos definidos em `src/lib/gtm.ts` (`GTM_EVENTS`).
