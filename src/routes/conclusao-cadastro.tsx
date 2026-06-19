import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  BadgeCheck,
  FileCheck2,
  CheckCircle2,
  Upload,
  ShieldCheck,
  Building2,
  Landmark,
  Briefcase,
  FileText,
  Gavel,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { TopBar, Header } from "@/components/cadastro/LayoutParts";
import type { ConsultaProtocoloResult } from "@/lib/cadastro-consulta-types";
import { consultarCadastroPorProtocolo } from "@/lib/cadastro-consulta";
import { normalizeProtocolo } from "@/lib/protocolo-validation";
import { getPortalDocumentosUrl, getPortalUrl } from "@/lib/portal";
import { buildConclusaoStructuredData, buildSeoHead } from "@/lib/seo";
import { trackConclusaoCadastroView, trackPortalClick } from "@/lib/tracking";

const PATH = "/conclusao-cadastro";
const TITLE = "Credenciamento Recebido — CADBRASIL";
const DESCRIPTION =
  "Seu credenciamento foi protocolado com sucesso. Envie os documentos para validação dos níveis SICAF e acesse o Portal do Fornecedor.";

export const Route = createFileRoute("/conclusao-cadastro")({
  validateSearch: (search: Record<string, unknown>) => ({
    protocolo:
      typeof search.protocolo === "string" ? search.protocolo.trim() : undefined,
  }),
  loaderDeps: ({ search }) => ({ protocolo: search.protocolo }),
  loader: async ({ deps }): Promise<{ consulta: ConsultaProtocoloResult | null }> => {
    if (!deps.protocolo) return { consulta: null };
    const normalized = normalizeProtocolo(deps.protocolo);
    if (!normalized) {
      return {
        consulta: { found: false, protocolo: deps.protocolo, error: "Protocolo inválido." },
      };
    }
    try {
      const consulta = await consultarCadastroPorProtocolo({ data: normalized });
      return { consulta };
    } catch (e) {
      console.error("[conclusao-cadastro loader]", e);
      return {
        consulta: {
          found: false,
          protocolo: deps.protocolo,
          error: "Erro ao consultar o protocolo.",
        },
      };
    }
  },
  head: ({ loaderData }) => {
    const base = buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      keywords:
        "conclusão cadastro SICAF, protocolo credenciamento, enviar documentos SICAF, portal fornecedor CADBRASIL, habilitação licitações",
      ogType: "website",
    });

    const meta = [
      ...base.meta.filter((m) => !("name" in m && m.name === "robots")),
      { name: "robots", content: "noindex, nofollow" },
    ];

    const consulta = loaderData?.consulta;
    if (consulta?.found) {
      const c = consulta.data.cliente;
      meta.push({
        name: "description",
        content: `Protocolo ${consulta.data.protocolo} — ${c.razaoSocial}. Próximo passo: enviar documentos SICAF no Portal CADBRASIL.`,
      });
    }

    const scripts: { type: string; children: string }[] = [];
    if (consulta?.found) {
      const schemas = buildConclusaoStructuredData({
        protocolo: consulta.data.protocolo,
        razaoSocial: consulta.data.cliente.razaoSocial,
        documento: consulta.data.cliente.documento,
        cidade: consulta.data.cliente.cidade,
        estado: consulta.data.cliente.estado,
        sicafStatus: consulta.data.sicaf?.status,
      });
      scripts.push(
        { type: "application/ld+json", children: JSON.stringify(schemas.service) },
        { type: "application/ld+json", children: JSON.stringify(schemas.breadcrumb) },
        { type: "application/ld+json", children: JSON.stringify(schemas.confirmation) },
      );
    }

    return { meta, links: base.links, scripts };
  },
  component: ConclusaoCadastroPage,
});

const NIVEIS_SICAF = [
  {
    nivel: "I",
    titulo: "Credenciamento",
    descricao: "Dados cadastrais e habilitação jurídica do fornecedor.",
    icon: Building2,
  },
  {
    nivel: "II",
    titulo: "Habilitação Jurídica",
    descricao: "Contrato social, atos constitutivos e documentos societários.",
    icon: FileText,
  },
  {
    nivel: "III",
    titulo: "Regularidade Fiscal Federal",
    descricao: "Certidões da Receita Federal, FGTS e Dívida Ativa da União.",
    icon: Landmark,
  },
  {
    nivel: "IV",
    titulo: "Regularidade Fiscal Estadual / Municipal",
    descricao: "Certidões negativas estaduais e do município sede.",
    icon: ShieldCheck,
  },
  {
    nivel: "V",
    titulo: "Qualificação Técnica",
    descricao: "Atestados de capacidade técnica e registros profissionais.",
    icon: Briefcase,
  },
  {
    nivel: "VI",
    titulo: "Qualificação Econômico-Financeira",
    descricao: "Balanço patrimonial e certidão negativa de falência.",
    icon: TrendingUp,
  },
] as const;

const STATS = [
  { valor: "+12.500", label: "Licitações abertas hoje", icon: Gavel },
  { valor: "R$ 38 Bi", label: "Movimentados em compras públicas", icon: TrendingUp },
  { valor: "+220 mil", label: "Órgãos compradores ativos", icon: Landmark },
  { valor: "24h", label: "Prazo médio de análise dos documentos", icon: Clock },
];

function PortalCtaButton({
  children,
  className,
  origem,
  size = "lg",
}: {
  children: ReactNode;
  className?: string;
  origem: "cta_principal" | "cta_secundario";
  size?: "lg" | "default";
}) {
  const href = getPortalDocumentosUrl();
  return (
    <Button
      asChild
      size={size}
      className={className}
      onClick={() => trackPortalClick(origem)}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    </Button>
  );
}

function ConclusaoCadastroPage() {
  const { protocolo: protocoloQuery } = Route.useSearch();
  const { consulta } = Route.useLoaderData();
  const portalUrl = getPortalUrl();

  const cadastro = consulta?.found ? consulta.data : null;
  const notFound = Boolean(protocoloQuery && consulta && !consulta.found);
  const fetchError = consulta && !consulta.found ? (consulta.error ?? null) : null;

  useEffect(() => {
    if (!cadastro) return;
    trackConclusaoCadastroView({
      protocolo: cadastro.protocolo,
      razaoSocial: cadastro.cliente.razaoSocial,
      tipoDocumento: cadastro.cliente.tipoDocumento,
      sicafStatus: cadastro.sicaf?.status,
    });
  }, [cadastro]);

  const protocoloExibido = cadastro?.protocolo ?? protocoloQuery ?? "—";
  const razaoExibida = cadastro?.cliente.razaoSocial;
  const emailAcesso = cadastro?.usuario.emailAcesso;

  const niveisMap = useMemo(() => {
    const map = new Map<string, boolean>();
    cadastro?.sicaf?.niveis.forEach((n) => map.set(n.nivel.toUpperCase(), n.habilitado));
    return map;
  }, [cadastro]);

  if (!protocoloQuery) {
    return (
      <PageShell>
        <StatusCard
          icon={<AlertCircle className="h-10 w-10 text-amber-500" />}
          title="Protocolo não informado"
          description="Esta página confirma um credenciamento já realizado. Inicie o cadastro para receber seu número de protocolo."
        >
          <Button asChild size="lg" className="mt-6">
            <Link to="/">Iniciar credenciamento</Link>
          </Button>
        </StatusCard>
      </PageShell>
    );
  }

  if (notFound || !cadastro) {
    return (
      <PageShell>
        <StatusCard
          icon={<AlertCircle className="h-10 w-10 text-destructive" />}
          title="Protocolo não encontrado"
          description={
            fetchError ??
            `Não localizamos o protocolo ${protocoloQuery} em nossa base. Verifique o link recebido por e-mail ou entre em contato com o suporte.`
          }
        >
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline">
              <Link to="/">Voltar ao cadastro</Link>
            </Button>
            <Button asChild>
              <a href={portalUrl} target="_blank" rel="noopener noreferrer">
                Acessar portal do fornecedor
              </a>
            </Button>
          </div>
        </StatusCard>
      </PageShell>
    );
  }

  return (
    <PageShell>
      {/* Resumo SSR para parsers que leem HTML sem executar JS */}
      <div className="sr-only" aria-hidden="true">
        <p>Protocolo CADBRASIL: {cadastro.protocolo}</p>
        <p>Empresa: {cadastro.cliente.razaoSocial}</p>
        <p>Status SICAF: {cadastro.sicaf?.status ?? "Pendente"}</p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg animate-scale-in lg:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
          <BadgeCheck className="h-10 w-10 text-success" />
        </div>
        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          Credenciamento Recebido com Sucesso
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
          {razaoExibida ? (
            <>
              <strong className="text-foreground">{razaoExibida}</strong> foi protocolada na
              plataforma CADBRASIL. O próximo passo é enviar os documentos para validação dos
              níveis do SICAF.
            </>
          ) : (
            "Seu processo foi protocolado na plataforma CADBRASIL. O próximo passo é enviar os documentos para validação dos níveis do SICAF."
          )}
        </p>

        <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-lg border border-border bg-primary-soft/40 px-5 py-3 text-left">
          <FileCheck2 className="h-5 w-5 text-primary" />
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Número do Processo
            </p>
            <p className="font-mono text-base font-semibold text-primary-deep">
              {protocoloExibido}
            </p>
          </div>
        </div>

        {(emailAcesso || cadastro.contrato) && (
          <div className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            {emailAcesso && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
                Acesso: <span className="font-medium text-foreground">{emailAcesso}</span>
              </span>
            )}
            {cadastro.contrato && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
                {cadastro.contrato.plano} · vigência até{" "}
                {formatDateBr(cadastro.contrato.dataVencimento)}
              </span>
            )}
            {cadastro.sicaf && (
              <span className="rounded-full border border-border bg-muted/40 px-3 py-1">
                SICAF: <span className="font-medium text-foreground">{cadastro.sicaf.status}</span>
              </span>
            )}
          </div>
        )}

        <div className="mt-8">
          <PortalCtaButton
            origem="cta_principal"
            className="h-16 w-full max-w-xl bg-primary px-8 text-base font-semibold shadow-lg shadow-primary/30 hover:bg-primary-deep lg:text-lg"
          >
            <Upload className="!h-6 !w-6" />
            Enviar Documentos SICAF
            <ArrowRight className="!h-5 !w-5" />
          </PortalCtaButton>
          <p className="mt-3 text-xs text-muted-foreground">
            Envio seguro e criptografado · Análise em até 24 horas úteis
          </p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-center text-lg font-semibold text-foreground">
          O mercado de compras públicas que você está prestes a acessar
        </h2>
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STATS.map((s) => (
            <Card key={s.label} className="border-border">
              <CardContent className="p-5 text-center">
                <s.icon className="mx-auto h-6 w-6 text-primary" />
                <p className="mt-3 text-xl font-bold text-primary-deep lg:text-2xl">{s.valor}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-deep">
            <ShieldCheck className="h-3.5 w-3.5" /> Níveis SICAF a serem validados
          </span>
          <h2 className="mt-3 text-xl font-bold text-foreground lg:text-2xl">
            6 níveis de habilitação no Sistema de Cadastramento Unificado de Fornecedores
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-muted-foreground">
            Cada nível libera novas modalidades de licitação. Nossa equipe analisa e protocola toda
            a documentação por você.
          </p>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {NIVEIS_SICAF.map((n) => {
            const habilitado = niveisMap.get(n.nivel);
            const statusLabel =
              habilitado === true
                ? "Habilitado"
                : habilitado === false
                  ? "Pendente"
                  : "A validar";

            return (
              <Card key={n.nivel} className="border-border transition-shadow hover:shadow-md">
                <CardContent className="flex gap-4 p-5">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-primary-soft text-primary-deep">
                    <span className="text-[9px] font-semibold uppercase leading-none">Nível</span>
                    <span className="text-base font-bold leading-tight">{n.nivel}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <n.icon className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">{n.titulo}</h3>
                      </div>
                      <span
                        className={
                          habilitado
                            ? "text-[10px] font-semibold uppercase text-success"
                            : "text-[10px] font-semibold uppercase text-muted-foreground"
                        }
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{n.descricao}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-12 rounded-2xl border border-border bg-card p-8">
        <h2 className="text-lg font-semibold text-foreground">Próximas etapas do seu processo</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {[
            "Envio e conferência dos documentos pelo fornecedor",
            "Análise documental pela equipe CADBRASIL",
            "Validação cadastral nos 6 níveis SICAF",
            "Liberação completa da plataforma e acesso às licitações",
            "Acompanhamento contínuo e renovações automáticas",
          ].map((s, i) => (
            <li key={s} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-[11px] font-bold text-success">
                {i + 1}
              </span>
              <span className="text-foreground">{s}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6">
          <PortalCtaButton
            origem="cta_secundario"
            className="h-14 w-full max-w-md bg-primary px-8 text-base font-semibold hover:bg-primary-deep"
          >
            <Upload className="!h-5 !w-5" />
            Enviar Documentos SICAF Agora
          </PortalCtaButton>
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
            onClick={() => trackPortalClick("link_texto")}
          >
            Prefiro acessar o portal do fornecedor mais tarde
          </a>
        </div>
      </section>

      <p className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
        Você receberá atualizações por e-mail institucional a cada etapa concluída.
      </p>
    </PageShell>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-5xl px-4 py-12 lg:px-8">{children}</main>
    </div>
  );
}

function StatusCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-8 text-center shadow-lg lg:p-10">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
        {icon}
      </div>
      <h1 className="mt-6 text-xl font-bold text-foreground lg:text-2xl">{title}</h1>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}

function formatDateBr(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}
