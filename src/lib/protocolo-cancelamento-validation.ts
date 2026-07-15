const PROTOCOLO_CANC_RE = /^CANC-[A-Z0-9]{8}-\d{4}$/i;

/** Normaliza e valida protocolo CANC-XXXXXXXX-9999. */
export function normalizeProtocoloCancelamento(raw: string): string | null {
  const p = String(raw ?? "").trim().toUpperCase();
  if (!p || p.length < 5) return null;
  return PROTOCOLO_CANC_RE.test(p) ? p : null;
}
