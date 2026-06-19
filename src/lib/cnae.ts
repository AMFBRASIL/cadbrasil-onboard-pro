export type CnaeTipo = "principal" | "secundario";

export type CnaeItem = {
  codigo: string;
  descricao: string;
  tipo: CnaeTipo;
};

/** Normaliza código CNAE para 7 dígitos (subclasse), ex.: "6201-5/00" → "6201500". */
export function normalizeCnaeCodigo(raw: string | number | null | undefined): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length >= 7) return digits.slice(0, 7);
  return digits;
}

export function pickCnaeCodigo(atividade: {
  id?: string | number | null;
  subclasse?: string | null;
}): string {
  const fromId = normalizeCnaeCodigo(atividade.id);
  if (fromId.length >= 7) return fromId;
  const fromSubclasse = normalizeCnaeCodigo(atividade.subclasse);
  if (fromSubclasse.length >= 7) return fromSubclasse;
  return fromId || fromSubclasse;
}

export function dedupeCnaes(items: CnaeItem[]): CnaeItem[] {
  const seen = new Set<string>();
  const out: CnaeItem[] = [];
  for (const item of items) {
    const codigo = normalizeCnaeCodigo(item.codigo);
    if (!codigo || !item.descricao.trim()) continue;
    const key = `${item.tipo}:${codigo}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      codigo,
      descricao: item.descricao.trim().slice(0, 255),
      tipo: item.tipo,
    });
  }
  return out;
}

export function principalCnaeCodigo(cnaes: CnaeItem[]): string | null {
  const principal = cnaes.find((c) => c.tipo === "principal");
  return principal ? normalizeCnaeCodigo(principal.codigo) || null : null;
}
