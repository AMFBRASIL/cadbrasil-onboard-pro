export type AssistenteVideo = {
  id: string;
  title: string;
  description: string;
  youtubeUrl: string;
};

export const ASSISTENTE_VIDEOS: AssistenteVideo[] = [
  {
    id: "instalar-assistente",
    title: "Como instalar o Assistente",
    description: "Passo a passo para baixar e instalar o Assistente CADBRASIL no seu computador.",
    youtubeUrl:
      "https://www.youtube.com/watch?v=HzfZo8MkLd0&list=PL9q-Qi-YGxp8eiPxVI3iDU5mWTba8i43u",
  },
  {
    id: "atualizar-sicaf",
    title: "Como atualizar meu SICAF",
    description: "Veja como manter seu cadastro SICAF atualizado e em conformidade.",
    youtubeUrl:
      "https://www.youtube.com/watch?v=HzfZo8MkLd0&list=PL9q-Qi-YGxp8eiPxVI3iDU5mWTba8i43u",
  },
  {
    id: "enviar-documentacao",
    title: "Como colocar documentação",
    description: "Aprenda a enviar contrato social, certidões e demais documentos no portal.",
    youtubeUrl:
      "https://www.youtube.com/watch?v=HzfZo8MkLd0&list=PL9q-Qi-YGxp8eiPxVI3iDU5mWTba8i43u",
  },
  {
    id: "participar-licitacoes",
    title: "Como participar de licitações",
    description: "Orientações para buscar oportunidades e participar de pregões públicos.",
    youtubeUrl:
      "https://www.youtube.com/watch?v=HzfZo8MkLd0&list=PL9q-Qi-YGxp8eiPxVI3iDU5mWTba8i43u",
  },
];

/** Converte URL watch do YouTube em URL de embed para iframe. */
export function youtubeEmbedUrl(watchUrl: string): string {
  try {
    const url = new URL(watchUrl);
    const id = url.searchParams.get("v");
    if (!id) return watchUrl;
    const params = new URLSearchParams({ rel: "0", modestbranding: "1" });
    const list = url.searchParams.get("list");
    if (list) params.set("list", list);
    return `https://www.youtube.com/embed/${id}?${params.toString()}`;
  } catch {
    return watchUrl;
  }
}
