import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Play,
  ArrowRight,
  MonitorPlay,
  FileUp,
  RefreshCw,
  Gavel,
  Download,
  HeadphonesIcon,
} from "lucide-react";

import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ASSISTENTE_VIDEOS,
  youtubeEmbedUrl,
  type AssistenteVideo,
} from "@/lib/assistente-videos";
import { getPortalUrl } from "@/lib/portal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const PROCESSO_PASSOS = [
  {
    icon: Download,
    title: "Instale o Assistente",
    text: "Baixe e configure o software CADBRASIL no seu computador para agilizar o credenciamento.",
  },
  {
    icon: RefreshCw,
    title: "Mantenha o SICAF atualizado",
    text: "Renove certidões e níveis de habilitação para evitar bloqueios em licitações.",
  },
  {
    icon: FileUp,
    title: "Envie a documentação",
    text: "Após o cadastro, faça login no Portal do Fornecedor e anexe os documentos exigidos.",
  },
  {
    icon: Gavel,
    title: "Participe de licitações",
    text: "Com o SICAF regular, busque oportunidades no Compras.gov.br e demais portais.",
  },
];

export function AssistenteContent() {
  const [activeVideo, setActiveVideo] = useState<AssistenteVideo | null>(null);
  const portalUrl = getPortalUrl();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <Header />

      <main>
        <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-primary-deep via-primary to-primary-deep text-primary-foreground">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(60rem 30rem at 80% -10%, white, transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 text-center lg:px-8 lg:py-16">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              <MonitorPlay className="h-3.5 w-3.5" />
              Central de ajuda
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
              Assistente CADBRASIL
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85 lg:text-lg">
              Tutoriais em vídeo para instalar o Assistente, atualizar o SICAF, enviar documentos
              e participar de licitações com segurança.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[1fr_280px] lg:gap-12">
            <article className="min-w-0 space-y-10">
              <section className="rounded-xl border border-border bg-card p-6 shadow-sm lg:p-8">
                <h2 className="text-xl font-bold text-foreground">Como funciona o processo</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  O credenciamento CADBRASIL combina cadastro online, envio de documentos no portal
                  e uso do Assistente para manter sua empresa habilitada. Assista aos vídeos abaixo
                  na ordem sugerida ou escolha o tema que precisa agora.
                </p>

                <div className="mt-8 space-y-3">
                  {ASSISTENTE_VIDEOS.map((video, index) => (
                    <button
                      key={video.id}
                      type="button"
                      onClick={() => setActiveVideo(video)}
                      className={cn(
                        "group flex w-full items-start gap-4 rounded-lg border border-border bg-background p-4 text-left transition-colors",
                        "hover:border-primary/35 hover:bg-primary-soft/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                      )}
                    >
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                        <Play className="h-4 w-4 fill-current" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                            Vídeo {index + 1}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-base font-semibold text-foreground">
                          {video.title}
                        </span>
                        <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                          {video.description}
                        </span>
                      </span>
                      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                {PROCESSO_PASSOS.map((passo) => {
                  const Icon = passo.icon;
                  return (
                    <div
                      key={passo.title}
                      className="rounded-lg border border-border bg-muted/30 p-5"
                    >
                      <Icon className="h-5 w-5 text-primary" />
                      <h3 className="mt-3 text-sm font-semibold text-foreground">{passo.title}</h3>
                      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                        {passo.text}
                      </p>
                    </div>
                  );
                })}
              </section>
            </article>

            <aside className="space-y-6 lg:sticky lg:top-6 lg:self-start">
              <div className="rounded-xl border border-primary/20 bg-primary-soft/30 p-5">
                <div className="flex items-center gap-2 text-primary">
                  <HeadphonesIcon className="h-4 w-4" />
                  <p className="text-sm font-semibold">Precisa de ajuda?</p>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Nossa equipe acompanha seu credenciamento do início ao fim. Em caso de dúvidas,
                  assista aos vídeos ou acesse o portal.
                </p>
                <div className="mt-4 flex flex-col gap-2">
                  <Button asChild size="sm" className="w-full">
                    <Link to="/">Iniciar cadastro</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                      Portal do Fornecedor
                    </a>
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 text-sm">
                <p className="font-semibold text-foreground">Dica</p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Clique no título de cada vídeo para assistir em tela cheia. Você pode pausar e
                  retomar quando quiser.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center lg:px-8">
          <p className="text-sm text-primary-foreground/75">
            © {new Date().getFullYear()} {SITE_NAME}. Tutoriais oficiais de uso da plataforma.
          </p>
          <p className="mt-2 text-xs text-primary-foreground/55">{SITE_URL}/assistente</p>
        </div>
      </footer>

      <Dialog
        open={activeVideo !== null}
        onOpenChange={(open) => {
          if (!open) setActiveVideo(null);
        }}
      >
        <DialogContent className="max-w-4xl gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="flex items-center gap-2 pr-8 text-base sm:text-lg">
              <Play className="h-4 w-4 shrink-0 fill-primary text-primary" />
              {activeVideo?.title}
            </DialogTitle>
          </DialogHeader>
          {activeVideo && (
            <div className="aspect-video w-full bg-black">
              <iframe
                key={activeVideo.id}
                src={youtubeEmbedUrl(activeVideo.youtubeUrl)}
                title={activeVideo.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
