import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSearch,
  KeyRound,
  Layers,
  MousePointerClick,
  ShieldCheck,
  ZoomIn,
} from "lucide-react";

import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getPortalAssistenteSicafUrl,
  getPortalDocumentosUrl,
  SICAF_LOGIN_URL,
} from "@/lib/portal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

type Slide = {
  num: number;
  title: string;
  description: string;
  bullets: string[];
  image: string;
  imageAlt: string;
  buttonLabel: string;
  buttonHref: string;
  external: boolean;
  icon: typeof LogIn;
};

const SLIDES: Slide[] = [
  {
    num: 1,
    icon: MousePointerClick,
    title: "Acesse o Assistente e clique em Acessar SICAF",
    description:
      "No Portal do Fornecedor CADBRASIL, abra o menu Assistente SICAF. Na parte superior da tela, clique no botão verde Acessar SICAF para iniciar a conexão com o sistema oficial.",
    bullets: [
      "Faça login no portal com o e-mail e senha do seu cadastro.",
      "No menu lateral, selecione Assistente SICAF.",
      "Clique no botão verde Acessar SICAF no topo da página.",
      "O SICAF deve ser acessado com certificado digital da empresa (e-CNPJ) ou certificado em nuvem.",
    ],
    image: "/ajuda-01-assistente.png",
    imageAlt: "Tela do Assistente CADBRASIL com botão verde Acessar SICAF",
    buttonLabel: "Abrir Assistente no Portal",
    buttonHref: "",
    external: true,
  },
  {
    num: 2,
    icon: KeyRound,
    title: "Entre no SICAF com certificado digital",
    description:
      "Após clicar em Acessar SICAF, você será direcionado ao login oficial do SICAF pelo gov.br. Use o certificado digital da empresa para autenticar com segurança.",
    bullets: [
      "Na tela do SICAF, selecione o tipo de credencial (Fornecedor Brasileiro).",
      "Clique em Entrar com gov.br.",
      "Insira o certificado digital e-CNPJ (ou certificado em nuvem) do representante legal.",
      "Aguarde a validação — sem o certificado, o acesso ao SICAF não é concluído.",
    ],
    image: "/ajuda-02-sicaf-login.png",
    imageAlt: "Tela de login do SICAF com gov.br e certificado digital",
    buttonLabel: "Acessar login do SICAF",
    buttonHref: SICAF_LOGIN_URL,
    external: true,
  },
  {
    num: 3,
    icon: Layers,
    title: "Painel do SICAF — Cadastro e Consulta",
    description:
      "Com o SICAF já acessado, utilize os menus superiores para acompanhar sua habilitação e baixar relatórios oficiais.",
    bullets: [
      "Menu Cadastro: exibe os níveis de habilitação (I a VI) para consultar e atualizar.",
      "Menu Consulta: permite baixar relatórios como o Certificado de Registro Cadastral (CRC).",
      "Mantenha os níveis em dia para participar de licitações sem bloqueios.",
      "Em caso de dúvida, use o Assistente CADBRASIL no portal para orientação.",
    ],
    image: "/ajuda-03-sicaf-menu.png",
    imageAlt: "Tela principal do SICAF com menus Cadastro e Consulta",
    buttonLabel: "Abrir SICAF",
    buttonHref: SICAF_LOGIN_URL,
    external: true,
  },
];

export function AssistenteAjudaContent() {
  const [current, setCurrent] = useState(0);
  const [zoomImage, setZoomImage] = useState<Slide | null>(null);
  const portalAssistenteUrl = getPortalAssistenteSicafUrl();
  const portalLoginUrl = getPortalDocumentosUrl();

  const slides = SLIDES.map((slide) =>
    slide.num === 1 ? { ...slide, buttonHref: portalAssistenteUrl } : slide,
  );
  const slide = slides[current];
  const SlideIcon = slide.icon;
  const isFirst = current === 0;
  const isLast = current === slides.length - 1;

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
                "radial-gradient(60rem 30rem at 20% -10%, white, transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-12 text-center lg:px-8 lg:py-14">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              <FileSearch className="h-3.5 w-3.5" />
              Guia visual passo a passo
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
              Como acessar o SICAF pelo Assistente CADBRASIL
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85">
              Siga os 3 passos abaixo com imagens ampliadas. O acesso ao SICAF exige certificado
              digital da empresa.
            </p>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8 lg:py-14">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {slides.map((s, index) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors sm:h-11 sm:w-11",
                  index === current
                    ? "bg-primary text-primary-foreground shadow-md"
                    : index < current
                      ? "bg-success/15 text-success"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/40",
                )}
                aria-label={`Ir para o passo ${s.num}`}
                aria-current={index === current ? "step" : undefined}
              >
                {index < current ? <BadgeCheck className="h-5 w-5" /> : s.num}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Passo {slide.num} de {slides.length}
          </p>

          <article className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <div className="border-b border-border bg-muted/30 px-5 py-5 sm:px-8">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <SlideIcon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Passo {slide.num}
                  </p>
                  <h2 className="mt-0.5 text-xl font-bold text-foreground sm:text-2xl">
                    {slide.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {slide.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-8">
              <button
                type="button"
                onClick={() => setZoomImage(slide)}
                className="group relative block w-full overflow-hidden rounded-xl border border-border bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`Ampliar imagem do passo ${slide.num}`}
              >
                <img
                  src={slide.image}
                  alt={slide.imageAlt}
                  className="w-full object-contain transition-transform group-hover:scale-[1.01]"
                  loading={current === 0 ? "eager" : "lazy"}
                />
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  <ZoomIn className="h-3.5 w-3.5" />
                  Clique para ampliar
                </span>
              </button>

              <ul className="mt-6 space-y-2.5">
                {slide.bullets.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 rounded-lg border border-border/60 bg-background px-4 py-3 text-sm text-muted-foreground"
                  >
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button asChild size="lg" className="w-full sm:w-auto sm:px-8">
                  <a href={slide.buttonHref} target="_blank" rel="noopener noreferrer">
                    {slide.buttonLabel}
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
                {slide.num === 1 && (
                  <p className="text-xs text-muted-foreground">
                    Ainda não entrou no portal?{" "}
                    <a
                      href={portalLoginUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Fazer login
                    </a>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:px-8">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                disabled={isFirst}
                className="gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              {!isLast ? (
                <Button
                  type="button"
                  onClick={() => setCurrent((c) => Math.min(slides.length - 1, c + 1))}
                  className="gap-2"
                >
                  Próximo passo
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/assistente">
                    Ver tutoriais em vídeo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </article>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {slides.map((s, index) => (
              <button
                key={s.num}
                type="button"
                onClick={() => setCurrent(index)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors",
                  index === current
                    ? "border-primary bg-primary-soft/30"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                  Passo {s.num}
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                  {s.title}
                </p>
              </button>
            ))}
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center lg:px-8">
          <p className="text-sm text-primary-foreground/75">
            © {new Date().getFullYear()} {SITE_NAME}. Guia de acesso ao SICAF.
          </p>
          <p className="mt-2 text-xs text-primary-foreground/55">{SITE_URL}/assistente-ajuda</p>
        </div>
      </footer>

      <Dialog open={zoomImage !== null} onOpenChange={(open) => !open && setZoomImage(null)}>
        <DialogContent className="max-w-6xl gap-0 overflow-hidden p-0 sm:rounded-xl">
          <DialogHeader className="border-b border-border px-5 py-4 text-left">
            <DialogTitle className="text-base sm:text-lg">
              Passo {zoomImage?.num}: {zoomImage?.title}
            </DialogTitle>
          </DialogHeader>
          {zoomImage && (
            <img
              src={zoomImage.image}
              alt={zoomImage.imageAlt}
              className="max-h-[80vh] w-full bg-muted/20 object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
