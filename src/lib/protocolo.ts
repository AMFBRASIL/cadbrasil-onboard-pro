function gerarProtocoloComPrefixo(prefixo: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let mid = "";
  for (let i = 0; i < 8; i++) mid += chars[Math.floor(Math.random() * chars.length)];
  const tail = String(Math.floor(1000 + Math.random() * 9000));
  return `${prefixo}-${mid}-${tail}`;
}

/** Formato: SICAF-XXXXXXXX-YYYY (8 alfanum + 4 dígitos), conforme doc do portal. */
export function gerarProtocoloCadbrasil(): string {
  return gerarProtocoloComPrefixo("SICAF");
}

/** Formato: CANC-XXXXXXXX-YYYY — protocolo de solicitação de cancelamento. */
export function gerarProtocoloCancelamento(): string {
  return gerarProtocoloComPrefixo("CANC");
}
