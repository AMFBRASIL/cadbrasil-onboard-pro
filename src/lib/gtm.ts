import {
  GTM_CONTAINER_ID,
  SITE_NAME,
  SITE_URL,
} from "./analytics-ids";

/**
 * Catálogo de eventos customizados do dataLayer (GTM-TRVTMS6M).
 * Configure Triggers no GTM com tipo "Custom Event" usando estes nomes.
 */
export const GTM_EVENTS = {
  /** Primeira carga ou navegação SPA (virtual pageview). */
  VIRTUAL_PAGEVIEW: "virtual_pageview",
  /** Submit bem-sucedido do formulário de cadastro. */
  CADASTRO_CONCLUIDO: "cadastro_concluido",
  /** Página de conclusão carregada com protocolo válido. */
  CONCLUSAO_VIEW: "conclusao_cadastro_view",
  /** Reforço de conversão na confirmação. */
  CONCLUSAO_CONFIRMADA: "conclusao_cadastro_confirmada",
  /** Etapa do funil (variável funnel_step). */
  FUNNEL_STEP: "funnel_step",
  /** Clique em CTA do portal do fornecedor. */
  PORTAL_CLICK: "portal_fornecedor_click",
  /** Engagement automático (opcional, VITE_GADS_ENGAGEMENT_AUTO). */
  ADS_ENGAGEMENT: "ads_conversion_engagement",
} as const;

export type GtmEventName = (typeof GTM_EVENTS)[keyof typeof GTM_EVENTS];

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

/** Inicializa dataLayer com metadados do site (antes do script GTM). */
export function bootstrapDataLayer(): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: "gtm.js",
    site_name: SITE_NAME,
    site_url: SITE_URL,
    gtm_container: GTM_CONTAINER_ID,
    app_environment:
      (import.meta as unknown as { env?: { MODE?: string } }).env?.MODE ?? "production",
  });
}

/** Envia pageview virtual para SPAs (GTM History Change ou trigger customizado). */
export function trackVirtualPageView(
  pagePath: string,
  pageTitle?: string,
  extra?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !Array.isArray(window.dataLayer)) return;
  try {
    window.dataLayer.push({
      event: GTM_EVENTS.VIRTUAL_PAGEVIEW,
      page_path: pagePath,
      page_title: pageTitle || (typeof document !== "undefined" ? document.title : ""),
      page_location:
        typeof window !== "undefined" ? `${window.location.origin}${pagePath}` : pagePath,
      ...extra,
    });
  } catch (e) {
    console.warn("[GTM] virtual_pageview:", e);
  }
}

/** Referência rápida para configurar o container GTM (import no painel). */
export const GTM_TRIGGER_SPECS = [
  {
    name: "CE - cadastro_concluido",
    type: "Custom Event",
    eventName: GTM_EVENTS.CADASTRO_CONCLUIDO,
    tags: ["Google Ads Conversion", "GA4 Event"],
  },
  {
    name: "CE - conclusao_cadastro_confirmada",
    type: "Custom Event",
    eventName: GTM_EVENTS.CONCLUSAO_CONFIRMADA,
    tags: ["Google Ads Conversion (reforço)", "GA4 purchase/signup"],
  },
  {
    name: "CE - conclusao_cadastro_view",
    type: "Custom Event",
    eventName: GTM_EVENTS.CONCLUSAO_VIEW,
    tags: ["GA4 Event", "Remarketing"],
  },
  {
    name: "CE - funnel_step conclusao",
    type: "Custom Event",
    eventName: GTM_EVENTS.FUNNEL_STEP,
    condition: "funnel_step equals conclusao",
    tags: ["GA4 Funnel"],
  },
  {
    name: "CE - virtual_pageview",
    type: "Custom Event",
    eventName: GTM_EVENTS.VIRTUAL_PAGEVIEW,
    tags: ["GA4 page_view (SPA)"],
  },
  {
    name: "CE - portal_fornecedor_click",
    type: "Custom Event",
    eventName: GTM_EVENTS.PORTAL_CLICK,
    tags: ["GA4 Event outbound"],
  },
] as const;
