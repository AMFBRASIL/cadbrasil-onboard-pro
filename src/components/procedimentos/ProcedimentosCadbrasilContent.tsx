import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  FileUp,
  Gavel,
  KeyRound,
  MapPin,
  ShieldCheck,
  Sparkles,
  HeadphonesIcon,
  Lock,
} from "lucide-react";

import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPortalUrl } from "@/lib/portal";
import { SITE_NAME, SITE_URL } from "@/lib/seo";

const ETAPAS = [
  {
    num: 1,
    icon: Building2,
    title: "Cadastro inicial da empresa",
    text: "Informe CNPJ ou CPF. Consultamos os dados oficiais e você preenche responsável legal e endereço empresarial.",
    tag: "Site de cadastro",
  },
  {
    num: 2,
    icon: ClipboardList,
    title: "Diagnóstico de habilitação",
    text: "Pré-análise informativa dos requisitos SICAF com base na Lei nº 14.133/2021. Nenhum documento é enviado nesta fase.",
    tag: "Automático",
  },
  {
    num: 3,
    icon: CreditCard,
    title: "Licença CADBRASIL",
    text: "Contratação da assessoria de credenciamento assistido. Você recebe protocolo e orientações para os próximos passos.",
    tag: "Assessoria",
  },
  {
    num: 4,
    icon: KeyRound,
    title: "Acesso ao Portal do Fornecedor",
    text: "Crie seu login e senha. As credenciais são enviadas por e-mail para acessar a plataforma CADBRASIL com segurança.",
    tag: "Credenciais",
  },
  {
    num: 5,
    icon: FileUp,
    title: "Envio da documentação",
    text: "No portal, anexe contrato social, certidões, documentos do responsável e demais exigências para os níveis do SICAF.",
    tag: "Portal",
  },
  {
    num: 6,
    icon: FileCheck2,
    title: "Análise e regularização",
    text: "Nossa equipe revisa a documentação, orienta correções e acompanha a evolução dos níveis de habilitação.",
    tag: "Equipe CADBRASIL",
  },
  {
    num: 7,
    icon: BadgeCheck,
    title: "SICAF 100% ativado",
    text: "Com todos os níveis em dia, sua empresa fica habilitada para participar de licitações públicas com segurança e conformidade.",
    tag: "Objetivo final",
    highlight: true,
  },
  {
    num: 8,
    icon: Gavel,
    title: "Participação em licitações",
    text: "Busque oportunidades no Compras.gov.br e portais estaduais/municipais com o cadastro regular e acompanhamento contínuo.",
    tag: "Resultado",
  },
];

const GARANTIAS = [
  { icon: ShieldCheck, label: "Processo 100% seguro" },
  { icon: Lock, label: "Dados protegidos (LGPD)" },
  { icon: HeadphonesIcon, label: "Suporte humano especializado" },
  { icon: Sparkles, label: "Acompanhamento até o SICAF ativo" },
];

function CadastroCta({ className, size = "lg" }: { className?: string; size?: "lg" | "xl" }) {
  return (
    <Button
      asChild
      size={size === "xl" ? "lg" : "lg"}
      className={cn(
        size === "xl" && "h-14 px-10 text-base font-semibold shadow-lg",
        className,
      )}
    >
      <Link to="/">
        Iniciar cadastro agora
        <ArrowRight className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}

export function ProcedimentosCadbrasilContent() {
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
                "radial-gradient(60rem 30rem at 20% -10%, white, transparent)",
            }}
          />
          <div className="relative mx-auto max-w-5xl px-4 py-14 text-center lg:px-8 lg:py-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] backdrop-blur">
              <MapPin className="h-3.5 w-3.5" />
              Passo a passo oficial
            </span>
            <h1 className="mt-5 text-3xl font-bold tracking-tight lg:text-4xl">
              Como funciona o processo CADBRASIL
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-primary-foreground/85 lg:text-lg">
              Do cadastro inicial à habilitação completa no SICAF — entenda cada etapa do
              credenciamento assistido e comece hoje mesmo.
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <CadastroCta size="xl" className="bg-white text-primary hover:bg-white/90" />
              <p className="text-sm text-primary-foreground/70">
                Cadastro gratuito para iniciar · assessoria especializada em todo o percurso
              </p>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-muted/30">
          <div className="mx-auto grid max-w-5xl grid-cols-2 gap-4 px-4 py-8 sm:grid-cols-4 lg:px-8">
            {GARANTIAS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card px-3 py-4 text-center"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-foreground">{item.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-4 py-12 lg:px-8 lg:py-16">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">Etapas do credenciamento</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Siga a jornada abaixo — o objetivo final é ter o{" "}
              <strong className="font-medium text-foreground">SICAF 100% ativado</strong> com
              segurança para vender ao governo.
            </p>
          </div>

          <ol className="relative mt-12 space-y-0">
            {ETAPAS.map((etapa, index) => {
              const Icon = etapa.icon;
              const isLast = index === ETAPAS.length - 1;
              return (
                <li key={etapa.num} className="relative flex gap-5 pb-10 last:pb-0">
                  {!isLast && (
                    <span
                      className="absolute left-[1.375rem] top-12 h-[calc(100%-2rem)] w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold shadow-sm",
                      etapa.highlight
                        ? "border-success bg-success text-success-foreground"
                        : "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {etapa.highlight ? <BadgeCheck className="h-5 w-5" /> : etapa.num}
                  </div>
                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-xl border p-5",
                      etapa.highlight
                        ? "border-success/40 bg-success/5 shadow-sm"
                        : "border-border bg-card",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Icon
                        className={cn(
                          "h-4 w-4",
                          etapa.highlight ? "text-success" : "text-primary",
                        )}
                      />
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {etapa.tag}
                      </span>
                    </div>
                    <h3 className="mt-2 text-base font-semibold text-foreground">{etapa.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {etapa.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <section className="border-t border-border bg-gradient-to-br from-primary-soft/40 to-background">
          <div className="mx-auto max-w-5xl px-4 py-14 text-center lg:px-8 lg:py-16">
            <div className="mx-auto max-w-2xl rounded-2xl border border-primary/25 bg-card p-8 shadow-sm lg:p-10">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
                <ShieldCheck className="h-7 w-7" />
              </div>
              <h2 className="mt-5 text-2xl font-bold text-foreground">
                SICAF 100% ativado com segurança
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground lg:text-base">
                Ao concluir todas as etapas com a CADBRASIL, sua empresa permanece regular nos
                níveis de habilitação exigidos pela Lei de Licitações — pronta para concorrer em
                pregões e contratos públicos com tranquilidade.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <CadastroCta size="xl" />
                <Button asChild variant="outline" size="lg" className="h-14 px-8">
                  <Link to="/assistente">Ver tutoriais em vídeo</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-foreground">
                Já é cliente?{" "}
                <a
                  href={portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Acesse o Portal do Fornecedor
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-primary-deep text-primary-foreground">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center lg:px-8">
          <p className="text-sm text-primary-foreground/75">
            © {new Date().getFullYear()} {SITE_NAME}. Procedimentos oficiais de credenciamento.
          </p>
          <p className="mt-2 text-xs text-primary-foreground/55">
            {SITE_URL}/procedimentos-cadbrasil
          </p>
        </div>
      </footer>
    </div>
  );
}
