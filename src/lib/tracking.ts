import { GOOGLE_ADS_ID } from "./analytics-ids";
import { GTM_EVENTS } from "./gtm";
import { getPropostaBaseAnual } from "./precos";

export interface UtmData {
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
  /** ID da campanha Google Ads (`utm_id` / `{campaignid}`). */
  utm_id: string;
  /** matchtype: e / p / b */
  utm_matchtype: string;
  /** device: m / t / c */
  utm_device: string;
  /** network: g / s / d / y */
  utm_network: string;
  /** ID do ad group (`{adgroupid}`). */
  utm_adgroup: string;
  /** ID do target (`{targetid}`). */
  utm_target: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  gad_source: string;
  gad_campaignid: string;
  msclkid: string;
  fbclid: string;
  landing_page: string;
  referrer: string;
  captured_at: string;
}

declare global {
  interface Window {
    gtag?: (...args: [string, ...unknown[]]) => void;
    dataLayer?: Record<string, unknown>[];
    /** Fila UET (array antes do bat.js carregar; objeto UET com .push depois). */
    uetq?: { push: (...args: unknown[]) => void };
    /** OpenAI Ads pixel queue / SDK. */
    oaiq?: ((...args: unknown[]) => void) & { q?: unknown[] };
  }
}

const STORAGE_KEY = "cadbrasil_utm";
const SESSION_ENGAGEMENT_KEY = "cadbrasil_ads_engagement_fired";
const CREDENCIAMENTO_COMPLETE_PREFIX = "cadbrasil_credenciamento_complete_";

/** Atribuição padrão: tráfego orgânico vindo do WhatsApp para /credenciamento. */
export const CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM = {
  utm_source: "whatsapp",
  utm_medium: "organic",
  utm_campaign: "whatsapp_organico",
  utm_content: "diagnostico_credenciamento",
} as const;

/** utm_content ao clicar no CTA para o cadastro a partir do diagnóstico. */
export const CREDENCIAMENTO_CTA_UTM_CONTENT = "cta_credenciamento";

export const TRACKING_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_matchtype",
  "utm_device",
  "utm_network",
  "utm_adgroup",
  "utm_target",
  "gclid",
  "gbraid",
  "wbraid",
  "gad_source",
  "gad_campaignid",
  "msclkid",
  "fbclid",
] as const;

/** Aliases ValueTrack do Google Ads (quando a URL não usa o prefixo utm_). */
const TRACKING_ALIASES: Record<string, keyof UtmData> = {
  campaignid: "utm_id",
  keyword: "utm_term",
  creative: "utm_content",
  matchtype: "utm_matchtype",
  device: "utm_device",
  network: "utm_network",
  adgroupid: "utm_adgroup",
  targetid: "utm_target",
};

function emptyUtmData(partial?: Partial<UtmData>): UtmData {
  return {
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
    utm_term: "",
    utm_content: "",
    utm_id: "",
    utm_matchtype: "",
    utm_device: "",
    utm_network: "",
    utm_adgroup: "",
    utm_target: "",
    gclid: "",
    gbraid: "",
    wbraid: "",
    gad_source: "",
    gad_campaignid: "",
    msclkid: "",
    fbclid: "",
    landing_page: "",
    referrer: "",
    captured_at: new Date().toISOString(),
    ...partial,
  };
}

function normalizeStoredUtm(raw: Partial<UtmData> | null | undefined): UtmData | null {
  if (!raw || typeof raw !== "object") return null;
  const cleaned: Partial<UtmData> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") {
      (cleaned as Record<string, string>)[key] = sanitizeTrackingValue(value);
    } else if (value != null) {
      (cleaned as Record<string, unknown>)[key] = value;
    }
  }
  return emptyUtmData(cleaned);
}

function firstParam(params: URLSearchParams, ...keys: string[]): string {
  for (const key of keys) {
    const value = params.get(key);
    if (value && value.trim() && !/^\{.+\}$/.test(value.trim())) {
      return sanitizeTrackingValue(value);
    }
  }
  return "";
}

/** Remove aspas JSON acidentais (ex.: `"111"` → `111`). */
export function sanitizeTrackingValue(raw: string): string {
  let s = raw.trim();
  if (
    (s.startsWith('"') && s.endsWith('"') && s.length >= 2) ||
    (s.startsWith("'") && s.endsWith("'") && s.length >= 2)
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

function coerceTrackingString(value: unknown): string {
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (typeof value !== "string") return "";
  return sanitizeTrackingValue(value);
}

export type TrackingSearchParams = Partial<
  Record<(typeof TRACKING_QUERY_KEYS)[number], string>
>;

/** Filtra apenas parâmetros de tracking válidos na query da rota. */
export function parseTrackingSearch(
  search: Record<string, unknown>,
): TrackingSearchParams {
  const result: TrackingSearchParams = {};
  for (const key of TRACKING_QUERY_KEYS) {
    const value = coerceTrackingString(search[key]);
    if (value && !/^\{.+\}$/.test(value)) {
      result[key] = value;
    }
  }
  return result;
}

/** Tráfego pago / Google Ads (não sobrescrever UTMs de campanha no CTA). */
export function hasPaidAdsAttribution(utm: UtmData | null | undefined): boolean {
  if (!utm) return false;
  return (
    utm.utm_medium === "cpc" ||
    utm.utm_source === "google" ||
    Boolean(
      utm.gclid ||
        utm.gbraid ||
        utm.wbraid ||
        utm.utm_id ||
        utm.utm_adgroup ||
        utm.utm_matchtype ||
        utm.utm_device ||
        utm.utm_network ||
        utm.gad_campaignid ||
        utm.gad_source,
    )
  );
}

/** Monta query string de tracking para links ao cadastro (ex.: CTA /credenciamento → /). */
export function getCadastroTrackingSearch(
  overrides?: Partial<UtmSeedInput>,
): TrackingSearchParams {
  // Garante captura síncrona da URL atual (evita CTA com UTM errado no 1º render).
  if (typeof window !== "undefined") captureUtmParams();

  const stored = getUtmParams();
  const paid = hasPaidAdsAttribution(stored);

  // Em Ads, não aplicar fallback WhatsApp — leva só o que veio da campanha (+ storage).
  const merged: Record<(typeof TRACKING_QUERY_KEYS)[number], string> = {
    utm_source:
      overrides?.utm_source ??
      stored?.utm_source ??
      (paid ? "" : CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_source),
    utm_medium:
      overrides?.utm_medium ??
      stored?.utm_medium ??
      (paid ? "" : CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_medium),
    utm_campaign:
      overrides?.utm_campaign ??
      stored?.utm_campaign ??
      (paid ? "" : CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_campaign),
    utm_term: overrides?.utm_term ?? stored?.utm_term ?? "",
    utm_content:
      overrides?.utm_content ??
      stored?.utm_content ??
      (paid ? "" : CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_content),
    utm_id: stored?.utm_id ?? "",
    utm_matchtype: stored?.utm_matchtype ?? "",
    utm_device: stored?.utm_device ?? "",
    utm_network: stored?.utm_network ?? "",
    utm_adgroup: stored?.utm_adgroup ?? "",
    utm_target: stored?.utm_target ?? "",
    gclid: stored?.gclid ?? "",
    gbraid: stored?.gbraid ?? "",
    wbraid: stored?.wbraid ?? "",
    gad_source: stored?.gad_source ?? "",
    gad_campaignid: stored?.gad_campaignid ?? "",
    msclkid: stored?.msclkid ?? "",
    fbclid: stored?.fbclid ?? "",
  };

  const params: TrackingSearchParams = {};
  for (const key of TRACKING_QUERY_KEYS) {
    const value = merged[key];
    if (value) params[key] = value;
  }
  return params;
}

/**
 * Search params do CTA /credenciamento → cadastro.
 * Tráfego Google Ads: preserva 100% das variáveis da URL (incl. utm_content={creative}).
 * Orgânico/WhatsApp: marca utm_content do clique no CTA.
 */
export function getCredenciamentoCtaCadastroSearch(): TrackingSearchParams {
  if (typeof window !== "undefined") captureUtmParams();
  const stored = getUtmParams();

  if (hasPaidAdsAttribution(stored)) {
    return getCadastroTrackingSearch();
  }

  return getCadastroTrackingSearch({
    utm_content: CREDENCIAMENTO_CTA_UTM_CONTENT,
  });
}

/** Persiste UTMs a partir dos parâmetros da URL de destino (antes da navegação SPA). */
export function persistUtmFromSearchParams(search: TrackingSearchParams): void {
  if (typeof window === "undefined") return;

  const existing = getUtmParams();
  const utmData = emptyUtmData({
    utm_source: search.utm_source ?? existing?.utm_source ?? "",
    utm_medium: search.utm_medium ?? existing?.utm_medium ?? "",
    utm_campaign: search.utm_campaign ?? existing?.utm_campaign ?? "",
    utm_term: search.utm_term ?? existing?.utm_term ?? "",
    utm_content: search.utm_content ?? existing?.utm_content ?? "",
    utm_id: search.utm_id ?? existing?.utm_id ?? "",
    utm_matchtype: search.utm_matchtype ?? existing?.utm_matchtype ?? "",
    utm_device: search.utm_device ?? existing?.utm_device ?? "",
    utm_network: search.utm_network ?? existing?.utm_network ?? "",
    utm_adgroup: search.utm_adgroup ?? existing?.utm_adgroup ?? "",
    utm_target: search.utm_target ?? existing?.utm_target ?? "",
    gclid: search.gclid ?? existing?.gclid ?? "",
    gbraid: search.gbraid ?? existing?.gbraid ?? "",
    wbraid: search.wbraid ?? existing?.wbraid ?? "",
    gad_source: search.gad_source ?? existing?.gad_source ?? "",
    gad_campaignid: search.gad_campaignid ?? existing?.gad_campaignid ?? "",
    msclkid: search.msclkid ?? existing?.msclkid ?? "",
    fbclid: search.fbclid ?? existing?.fbclid ?? "",
    landing_page: existing?.landing_page || window.location.pathname + window.location.search,
    referrer: existing?.referrer || document.referrer || "",
    captured_at: new Date().toISOString(),
  });

  try {
    persistUtmData(utmData);
    pushUtmToDataLayer(utmData);
  } catch (e) {
    console.warn("[UTM] Erro ao persistir search:", e);
  }
}

export type UtmSeedInput = {
  utm_source: string;
  utm_medium: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
};

function persistUtmData(utmData: UtmData): void {
  const json = JSON.stringify(utmData);
  sessionStorage.setItem(STORAGE_KEY, json);
  localStorage.setItem(STORAGE_KEY, json);
}

function buildUtmDataFromSeed(seed: UtmSeedInput, existing?: UtmData | null): UtmData {
  if (typeof window === "undefined") {
    return emptyUtmData({
      utm_source: seed.utm_source,
      utm_medium: seed.utm_medium,
      utm_campaign: seed.utm_campaign || "",
      utm_term: seed.utm_term || "",
      utm_content: seed.utm_content || "",
    });
  }

  return emptyUtmData({
    utm_source: seed.utm_source,
    utm_medium: seed.utm_medium,
    utm_campaign: seed.utm_campaign || existing?.utm_campaign || "",
    utm_term: seed.utm_term || existing?.utm_term || "",
    utm_content: seed.utm_content || existing?.utm_content || "",
    utm_id: existing?.utm_id || "",
    utm_matchtype: existing?.utm_matchtype || "",
    utm_device: existing?.utm_device || "",
    utm_network: existing?.utm_network || "",
    utm_adgroup: existing?.utm_adgroup || "",
    utm_target: existing?.utm_target || "",
    gclid: existing?.gclid || "",
    gbraid: existing?.gbraid || "",
    wbraid: existing?.wbraid || "",
    gad_source: existing?.gad_source || "",
    gad_campaignid: existing?.gad_campaignid || "",
    msclkid: existing?.msclkid || "",
    fbclid: existing?.fbclid || "",
    landing_page: existing?.landing_page || window.location.pathname + window.location.search,
    referrer: existing?.referrer || document.referrer || "",
    captured_at: new Date().toISOString(),
  });
}

/**
 * Define atribuição UTM no storage (e dataLayer) quando ainda não houver origem capturada.
 * Usado em landings dedicadas (ex.: /credenciamento via WhatsApp orgânico).
 */
export function seedUtmAttribution(
  seed: UtmSeedInput,
  options?: { onlyIfEmpty?: boolean },
): UtmData | null {
  if (typeof window === "undefined") return null;

  const onlyIfEmpty = options?.onlyIfEmpty ?? true;
  const existing = getUtmParams();
  if (onlyIfEmpty && existing?.utm_source) return existing;

  const utmData = buildUtmDataFromSeed(seed, existing);
  try {
    persistUtmData(utmData);
    pushUtmToDataLayer(utmData);
  } catch (e) {
    console.warn("[UTM] Erro ao aplicar seed:", e);
  }
  return utmData;
}

/** Publica variáveis UTM no dataLayer para triggers/variáveis do GTM. */
export function pushUtmToDataLayer(utm: UtmData): void {
  pushDataLayerEvent("utm_attribution", {
    utm_source: utm.utm_source,
    utm_medium: utm.utm_medium,
    utm_campaign: utm.utm_campaign,
    utm_term: utm.utm_term,
    utm_content: utm.utm_content,
    utm_id: utm.utm_id,
    utm_matchtype: utm.utm_matchtype,
    utm_device: utm.utm_device,
    utm_network: utm.utm_network,
    utm_adgroup: utm.utm_adgroup,
    utm_target: utm.utm_target,
    utmSource: utm.utm_source,
    utmMedium: utm.utm_medium,
    utmCampaign: utm.utm_campaign,
    utmTerm: utm.utm_term,
    utmContent: utm.utm_content,
    origem: `${utm.utm_source}_${utm.utm_medium}`,
    landing_page: utm.landing_page,
    referrer: utm.referrer,
    gclid: utm.gclid,
    gad_campaignid: utm.gad_campaignid,
  });
}

/** Inicializa tracking da landing /credenciamento (Ads da URL ou seed WhatsApp). */
export function initCredenciamentoWhatsappTracking(): UtmData | null {
  // Prioridade: parâmetros da URL (Google Ads etc.). Seed orgânico só se vazio.
  captureUtmParams();
  const utm =
    seedUtmAttribution(CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM, { onlyIfEmpty: true }) ??
    getUtmParams();

  pushDataLayerEvent(GTM_EVENTS.CREDENCIAMENTO_VIEW, {
    page_path: "/credenciamento",
    page_title: "Descubra seu potencial em licitações — CADBRASIL",
    funnel_name: "credenciamento_whatsapp",
    origem: "whatsapp_organico",
    utm_source: utm?.utm_source ?? CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_source,
    utm_medium: utm?.utm_medium ?? CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_medium,
    utm_campaign: utm?.utm_campaign ?? CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_campaign,
    utm_content: utm?.utm_content ?? CREDENCIAMENTO_WHATSAPP_ORGANIC_UTM.utm_content,
  });

  pushDataLayerEvent(GTM_EVENTS.FUNNEL_STEP, {
    funnel_name: "credenciamento_whatsapp",
    funnel_step: "entrada",
    funnel_step_name: "Diagnóstico credenciamento — entrada",
    origem: "whatsapp_organico",
  });

  return utm;
}

export function trackCredenciamentoStep(params: {
  questionId: string;
  questionLabel: string;
  answer: string;
  stepIndex: number;
  totalSteps: number;
}): void {
  const utm = getUtmParams();
  pushDataLayerEvent(GTM_EVENTS.CREDENCIAMENTO_STEP, {
    funnel_name: "credenciamento_whatsapp",
    funnel_step: params.questionId,
    funnel_step_name: params.questionLabel,
    step_index: params.stepIndex,
    total_steps: params.totalSteps,
    answer: params.answer,
    origem: "whatsapp_organico",
    utm_source: utm?.utm_source ?? "",
    utm_medium: utm?.utm_medium ?? "",
    utm_campaign: utm?.utm_campaign ?? "",
  });
}

export function trackCredenciamentoComplete(params: {
  score: number;
  oportunidades: number;
  tier: string;
}): void {
  if (typeof window === "undefined") return;

  const key = `${CREDENCIAMENTO_COMPLETE_PREFIX}${params.score}_${params.tier}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }

  const utm = getUtmParams();
  pushDataLayerEvent(GTM_EVENTS.CREDENCIAMENTO_COMPLETE, {
    funnel_name: "credenciamento_whatsapp",
    origem: "whatsapp_organico",
    score: params.score,
    oportunidades: params.oportunidades,
    tier: params.tier,
    utm_source: utm?.utm_source ?? "",
    utm_medium: utm?.utm_medium ?? "",
    utm_campaign: utm?.utm_campaign ?? "",
  });

  pushDataLayerEvent(GTM_EVENTS.FUNNEL_STEP, {
    funnel_name: "credenciamento_whatsapp",
    funnel_step: "diagnostico_concluido",
    funnel_step_name: "Diagnóstico concluído",
    score: params.score,
    origem: "whatsapp_organico",
  });
}

export function trackCredenciamentoCtaClick(params: {
  origem: "cta_principal" | "cta_secundario";
  score?: number;
}): void {
  const utm = getUtmParams();
  pushDataLayerEvent(GTM_EVENTS.CREDENCIAMENTO_CTA, {
    origem_cta: params.origem,
    destino: "/",
    funnel_name: "credenciamento_whatsapp",
    origem: "whatsapp_organico",
    score: params.score,
    utm_source: utm?.utm_source ?? "",
    utm_medium: utm?.utm_medium ?? "",
    utm_campaign: utm?.utm_campaign ?? "",
  });
}

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

function resolveEngagementSendTo(): string | undefined {
  const full = env.VITE_GADS_ENGAGEMENT_SEND_TO?.trim();
  if (full) return full;
  const label = env.VITE_GADS_ENGAGEMENT_LABEL?.trim();
  if (label) return `${GOOGLE_ADS_ID}/${label}`;
  return undefined;
}

/**
 * Captura parâmetros UTM da URL atual e persiste em sessionStorage + localStorage.
 * Deve ser chamado o mais cedo possível (antes de qualquer navegação SPA).
 */
export function captureUtmParams(): void {
  if (typeof window === "undefined") return;
  try {
    const fullUrl = window.location.href;
    const searchString = window.location.search;

    let params = new URLSearchParams(searchString);

    if (!params.has("utm_source") && !params.has("gclid") && !params.has("msclkid")) {
      const match = fullUrl.match(/[?&](utm_|gclid|msclkid)/);
      if (match) {
        const queryPart = fullUrl.substring(fullUrl.indexOf(match[0]));
        params = new URLSearchParams(queryPart.startsWith("?") ? queryPart : "?" + queryPart);
      }
    }

    const hasTracking =
      TRACKING_QUERY_KEYS.some((k) => params.has(k)) ||
      Object.keys(TRACKING_ALIASES).some((k) => params.has(k));
    if (!hasTracking) return;

    const hasGoogleAuto =
      params.has("gclid") || params.has("gad_source") || params.has("gbraid") || params.has("wbraid");
    const hasMsclk = params.has("msclkid");

    const utmId = firstParam(params, "utm_id", "campaignid");
    const gadCampaignId = firstParam(params, "gad_campaignid") || utmId;

    const utmData = emptyUtmData({
      utm_source: firstParam(params, "utm_source") || (hasGoogleAuto ? "google" : hasMsclk ? "bing" : ""),
      utm_medium: firstParam(params, "utm_medium") || (hasGoogleAuto || hasMsclk ? "cpc" : ""),
      utm_campaign: firstParam(params, "utm_campaign") || gadCampaignId,
      utm_term: firstParam(params, "utm_term", "keyword"),
      utm_content: firstParam(params, "utm_content", "creative"),
      utm_id: utmId,
      utm_matchtype: firstParam(params, "utm_matchtype", "matchtype"),
      utm_device: firstParam(params, "utm_device", "device"),
      utm_network: firstParam(params, "utm_network", "network"),
      utm_adgroup: firstParam(params, "utm_adgroup", "adgroupid"),
      utm_target: firstParam(params, "utm_target", "targetid"),
      gclid: firstParam(params, "gclid"),
      gbraid: firstParam(params, "gbraid"),
      wbraid: firstParam(params, "wbraid"),
      gad_source: firstParam(params, "gad_source"),
      gad_campaignid: gadCampaignId,
      msclkid: firstParam(params, "msclkid"),
      fbclid: firstParam(params, "fbclid"),
      landing_page: window.location.pathname + window.location.search,
      referrer: document.referrer || "",
      captured_at: new Date().toISOString(),
    });

    persistUtmData(utmData);
    pushUtmToDataLayer(utmData);
  } catch (e) {
    console.warn("[UTM] Erro ao capturar params:", e);
  }
}

export function getUtmParams(): UtmData | null {
  if (typeof window === "undefined") return null;
  try {
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) return normalizeStoredUtm(JSON.parse(fromSession) as Partial<UtmData>);
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) return normalizeStoredUtm(JSON.parse(fromLocal) as Partial<UtmData>);
  } catch (e) {
    console.warn("[UTM] Erro ao ler params:", e);
  }
  return null;
}

export function getUtmForPayload(): Record<string, string> {
  const utm = getUtmParams();
  return {
    utm_source: utm?.utm_source || "",
    utm_medium: utm?.utm_medium || "",
    utm_campaign: utm?.utm_campaign || "",
    utm_term: utm?.utm_term || "",
    utm_content: utm?.utm_content || "",
    utm_id: utm?.utm_id || "",
    utm_matchtype: utm?.utm_matchtype || "",
    utm_device: utm?.utm_device || "",
    utm_network: utm?.utm_network || "",
    utm_adgroup: utm?.utm_adgroup || "",
    utm_target: utm?.utm_target || "",
    gclid: utm?.gclid || "",
    gbraid: utm?.gbraid || "",
    wbraid: utm?.wbraid || "",
    gad_source: utm?.gad_source || "",
    gad_campaignid: utm?.gad_campaignid || "",
    msclkid: utm?.msclkid || "",
    fbclid: utm?.fbclid || "",
    landing_page: utm?.landing_page || "",
    referrer: utm?.referrer || "",
  };
}

/**
 * Payload de tracking para gravar no banco (tabela tracking_sessoes).
 * Inclui todos os parâmetros capturados da URL + user agent do navegador.
 */
export function getTrackingForPayload(): Record<string, string> {
  return {
    ...getUtmForPayload(),
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent || "" : "",
  };
}

/**
 * Conversão Google Ads do tipo "Engagement".
 * Configure VITE_GADS_ENGAGEMENT_SEND_TO (ex.: AW-16460586067/AbCdEfGhIj) ou
 * só VITE_GADS_ENGAGEMENT_LABEL (sufixo após AW-16460586067/).
 */
export function trackGoogleAdsEngagement(extraParams?: Record<string, unknown>): void {
  try {
    const utm = getUtmParams();
    const sendTo = resolveEngagementSendTo();

    const gtagParams: Record<string, unknown> = {
      ...(sendTo ? { send_to: sendTo } : {}),
      ...(utm?.utm_term && { keyword: utm.utm_term }),
      ...(utm?.utm_campaign && { campaign: utm.utm_campaign }),
      ...(utm?.utm_source && { source: utm.utm_source }),
      ...(utm?.gclid && { gclid: utm.gclid }),
      ...extraParams,
    };

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", GTM_EVENTS.ADS_ENGAGEMENT, gtagParams);
    }

    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({ event: GTM_EVENTS.ADS_ENGAGEMENT, ...gtagParams });
    }
  } catch (e) {
    console.warn("[Tracking] ads_conversion_engagement:", e);
  }
}

/** Dispara engagement uma vez por sessão de aba, se VITE_GADS_ENGAGEMENT_AUTO=true. */
export function scheduleGoogleAdsEngagementOncePerSession(): void {
  if (typeof window === "undefined") return;

  const auto = env.VITE_GADS_ENGAGEMENT_AUTO === "1" || env.VITE_GADS_ENGAGEMENT_AUTO === "true";
  if (!auto) return;

  try {
    if (sessionStorage.getItem(SESSION_ENGAGEMENT_KEY)) return;
  } catch {
    return;
  }

  const delayMs = Number(env.VITE_GADS_ENGAGEMENT_DELAY_MS || 30000);
  const ms = Number.isFinite(delayMs) && delayMs >= 3000 ? delayMs : 30000;

  window.setTimeout(() => {
    try {
      if (sessionStorage.getItem(SESSION_ENGAGEMENT_KEY)) return;
      sessionStorage.setItem(SESSION_ENGAGEMENT_KEY, "1");
      trackGoogleAdsEngagement();
    } catch {
      /* ignore */
    }
  }, ms);
}

/**
 * Dispara evento de conversão simultaneamente para:
 *  1. Google Ads (gtag) → send_to: AW-16460586067
 *  2. Google Tag Manager → dataLayer.push
 *  3. Microsoft Ads → uetq.push
 */
const CONCLUSAO_TRACKING_PREFIX = "cadbrasil_conclusao_tracked_";

/** Envia evento genérico ao dataLayer (GTM) sem depender do gtag. */
export function pushDataLayerEvent(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || !Array.isArray(window.dataLayer)) return;
  try {
    window.dataLayer.push({ event, ...params });
  } catch (e) {
    console.warn("[Tracking] dataLayer.push:", e);
  }
}

/**
 * Eventos da página de conclusão (funnel pós-cadastro).
 * Dispara uma vez por protocolo/sessão para evitar duplicar em refresh.
 */
export function trackConclusaoCadastroView(params: {
  protocolo: string;
  razaoSocial?: string;
  tipoDocumento?: string;
  sicafStatus?: string;
}): void {
  if (typeof window === "undefined") return;

  const key = `${CONCLUSAO_TRACKING_PREFIX}${params.protocolo}`;
  try {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  } catch {
    /* ignore */
  }

  const utm = getUtmParams();

  pushDataLayerEvent(GTM_EVENTS.CONCLUSAO_VIEW, {
    page_path: "/conclusao-cadastro",
    page_title: "Credenciamento Recebido — CADBRASIL",
    protocolo: params.protocolo,
    razao_social: params.razaoSocial ?? "",
    tipo_documento: params.tipoDocumento ?? "",
    sicaf_status: params.sicafStatus ?? "",
    utm_source: utm?.utm_source ?? "",
    utm_medium: utm?.utm_medium ?? "",
    utm_campaign: utm?.utm_campaign ?? "",
    gclid: utm?.gclid ?? "",
  });

  pushDataLayerEvent(GTM_EVENTS.FUNNEL_STEP, {
    funnel_name: "cadastro_sicaf",
    funnel_step: "conclusao",
    funnel_step_name: "Credenciamento protocolado",
    protocolo: params.protocolo,
  });

  // Reforço de conversão para GTM/Ads (cadastro_concluido já dispara no wizard).
  trackConversion(GTM_EVENTS.CONCLUSAO_CONFIRMADA, getPropostaBaseAnual(), {
    protocolo: params.protocolo,
    transaction_id: params.protocolo,
  });

  trackOpenAiRegistrationCompleted();
}

/** Conversão OpenAI Ads na conclusão do cadastro. */
export function trackOpenAiRegistrationCompleted(): void {
  if (typeof window === "undefined") return;
  try {
    if (typeof window.oaiq !== "function") return;
    window.oaiq("measure", "registration_completed", {
      type: "customer_action",
    });
  } catch (e) {
    console.warn("[Tracking] OpenAI oaiq:", e);
  }
}

export function trackPortalClick(origem: "cta_principal" | "cta_secundario" | "link_texto"): void {
  pushDataLayerEvent(GTM_EVENTS.PORTAL_CLICK, {
    origem,
    destino: "fornecedor.cadbrasil.com.br",
  });
}

export function trackConversion(
  eventName: string,
  value?: number,
  extraParams?: Record<string, unknown>,
): void {
  try {
    const utm = getUtmParams();

    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      const gtagParams: Record<string, unknown> = {
        send_to: GOOGLE_ADS_ID,
        ...(value !== undefined && { value, currency: "BRL" }),
        ...(utm?.utm_term && { keyword: utm.utm_term }),
        ...(utm?.utm_campaign && { campaign: utm.utm_campaign }),
        ...(utm?.utm_source && { source: utm.utm_source }),
        ...(utm?.gclid && { gclid: utm.gclid }),
        ...extraParams,
      };
      window.gtag("event", eventName, gtagParams);
    }

    if (typeof window !== "undefined" && Array.isArray(window.dataLayer)) {
      window.dataLayer.push({
        event: eventName,
        ...(value !== undefined && { conversionValue: value, currency: "BRL" }),
        utmSource: utm?.utm_source || "",
        utmMedium: utm?.utm_medium || "",
        utmCampaign: utm?.utm_campaign || "",
        utmTerm: utm?.utm_term || "",
        utmContent: utm?.utm_content || "",
        gclid: utm?.gclid || "",
        ...extraParams,
      });
    }

    // Microsoft Ads (Bing UET): antes do bat.js carregar, uetq é um array;
    // depois vira o objeto UET — ambos aceitam .push.
    if (typeof window !== "undefined") {
      window.uetq = window.uetq || [];
      if (typeof window.uetq.push === "function") {
        window.uetq.push("event", eventName, {
          revenue_value: value || 0,
          currency: "BRL",
        });
      }
    }
  } catch (e) {
    console.warn("[Tracking] Erro ao disparar evento:", e);
  }
}
