import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Download,
  ExternalLink,
  LifeBuoy,
  MonitorPlay,
  MousePointerClick,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  LogIn,
  CheckCircle2,
} from "lucide-react";

import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import { getPortalCentralAjudaUrl, getPortalDocumentosUrl, getPortalUrl } from "@/lib/portal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const HERO_IMG = "/instalador-assistente-hero.png";

const PASSOS = [
  {
    num: 1,
    icon: LogIn,
    title: "Acesse o Portal do Fornecedor",
    text: "Entre em fornecedor.cadbrasil.com.br com o seu e-mail e senha de acesso criados no cadastro.",
    tag: "Portal CADBRASIL",
  },
  {
    num: 2,
    icon: LifeBuoy,
    title: "Abra o menu Central de Ajuda",
    text: "Dentro do portal, localize e clique no menu CENTRAL DE AJUDA para ver os materiais de apoio.",
    tag: "Menu do portal",
  },
  {
    num: 3,
    icon: PlayCircle,
    title: "Assista aos vídeos de instalação",
    text: "Na Central de Ajuda estão os vídeos passo a passo de como instalar o Assistente no seu computador.",
    tag: "Vídeos de instrução",
  },
];

const BENEFICIOS = [
  {
    icon: Download,
    title: "Instalação simples",
    text: "Baixe e instale em poucos minutos seguindo o vídeo oficial.",
  },
  {
    icon: ShieldCheck,
    title: "Ambiente seguro",
    text: "Software oficial CADBRASIL, com conexão protegida e conforme a LGPD.",
  },
  {
    icon: Sparkles,
    title: "Mais agilidade",
    text: "O Assistente acelera consultas, certidões e o acompanhamento do SICAF.",
  },
];

export function InstaladorAssistenteContent() {
  const portalUrl = getPortalUrl();
  const portalLoginUrl = getPortalDocumentosUrl();
  const centralAjudaUrl = getPortalCentralAjudaUrl();

  const passosComAcao = PASSOS.map((passo) => {
    if (passo.num === 1) {
      return {
        ...passo,
        buttonLabel: "Acessar o portal",
        buttonHref: portalLoginUrl,
        external: true,
      };
    }
    if (passo.num === 2) {
      return {
        ...passo,
        buttonLabel: "Abrir Central de Ajuda",
        buttonHref: centralAjudaUrl,
        external: true,
      };
    }
    return {
      ...passo,
      buttonLabel: "Ver tutoriais em vídeo",
      buttonHref: "/assistente",
      external: false,
    };
  });

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
          <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-4 py-12 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-16">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <Download className="h-3.5 w-3.5" />
                Guia de instalação
              </span>
              <h1 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
                Como instalar o Assistente CADBRASIL
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-primary-foreground/85 lg:mx-0 lg:text-lg">
                Em 3 passos simples você encontra os vídeos oficiais de instalação dentro do
                Portal do Fornecedor, no menu Central de Ajuda.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="h-12 bg-white px-8 text-primary hover:bg-white/90"
                >
                  <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                    <LogIn className="mr-2 h-4 w-4" />
                    Acessar o portal
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/40 bg-white/10 px-8 text-primary-foreground hover:bg-white/20"
                >
                  <Link to="/assistente">
                    Ver tutoriais em vídeo
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="relative">
              <img
                src={HERO_IMG}
                alt="Ilustração da instalação do Assistente CADBRASIL em um computador"
                className="mx-auto w-full max-w-lg rounded-xl bg-white/95 p-3 shadow-2xl"
                loading="eager"
                width={1024}
                height={683}
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Passo a passo</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Siga a ordem abaixo para encontrar os vídeos de instalação do Assistente.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {passosComAcao.map((passo) => {
              const Icon = passo.icon;
              return (
                <div
                  key={passo.num}
                  className="relative flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                      <Icon className="h-6 w-6" />
                    </span>
                    <span className="text-5xl font-bold text-primary/10">{passo.num}</span>
                  </div>
                  <span className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {passo.tag}
                  </span>
                  <h3 className="mt-1 text-base font-semibold text-foreground">{passo.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {passo.text}
                  </p>
                  <Button
                    asChild
                    size="sm"
                    className="mt-5 w-full"
                    variant={passo.num === 1 ? "default" : "outline"}
                  >
                    {passo.external ? (
                      <a href={passo.buttonHref} target="_blank" rel="noopener noreferrer">
                        {passo.buttonLabel}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    ) : (
                      <Link to={passo.buttonHref}>
                        {passo.buttonLabel}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 overflow-hidden rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary-soft/50 to-card shadow-sm">
            <div className="border-b border-primary/15 bg-primary-deep/5 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <MonitorPlay className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                    Onde estão os vídeos
                  </p>
                  <h3 className="mt-0.5 text-lg font-bold text-foreground">
                    Central de Ajuda no Portal do Fornecedor
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Os vídeos oficiais de instalação ficam dentro do portal, no menu{" "}
                    <strong className="font-medium text-foreground">CENTRAL DE AJUDA</strong>. Faça
                    login, abra o menu e escolha o vídeo de instalação do Assistente.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-start gap-2 text-sm text-muted-foreground">
                <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  Portal:{" "}
                  <span className="font-medium text-foreground">{portalUrl}</span> → Central de Ajuda
                </span>
              </p>
              <Button asChild size="lg" className="shrink-0 px-8">
                <a href={centralAjudaUrl} target="_blank" rel="noopener noreferrer">
                  Abrir Central de Ajuda
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="mt-12">
            <div className="text-center">
              <h2 className="text-xl font-bold text-foreground">Por que instalar o Assistente</h2>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {BENEFICIOS.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-lg border border-border bg-muted/30 p-5"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <h3 className="mt-3 text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-12 rounded-xl border border-border bg-card p-6 text-center lg:p-8">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">Ainda não é cliente CADBRASIL?</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              O acesso ao portal e ao Assistente é liberado após o credenciamento inicial. Comece
              agora pelo formulário oficial e crie o seu acesso.
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="px-8">
                <Link to="/">
                  Iniciar cadastro
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link to="/procedimentos-cadbrasil">Ver como funciona</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center lg:px-8">
          <p className="text-sm text-primary-foreground/75">
            © {new Date().getFullYear()} {SITE_NAME}. Guia de instalação do Assistente.
          </p>
          <p className="mt-2 text-xs text-primary-foreground/55">
            {SITE_URL}/instalador-assistente-cadbrasil
          </p>
        </div>
      </footer>
    </div>
  );
}
