const PROTOCOLO_RE = /^SICAF-[A-Z0-9]{8}-\d{4}$/i;

/** Normaliza e valida protocolo SICAF-XXXXXXXX-9999. */
export function normalizeProtocolo(raw: string): string | null {
  const p = String(raw ?? "").trim().toUpperCase();
  if (!p || p.length < 5) return null;
  return PROTOCOLO_RE.test(p) ? p : null;
}
