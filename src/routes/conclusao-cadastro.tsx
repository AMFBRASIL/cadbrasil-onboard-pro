import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { TopBar, Header, WhatsAppFloating } from "@/components/cadastro/LayoutParts";
import { TriagemProcessoSicaf } from "@/components/conclusao/TriagemProcessoSicaf";
import type { ConsultaProtocoloResult } from "@/lib/cadastro-consulta-types";
import { consultarCadastroPorProtocolo } from "@/lib/cadastro-consulta";
import { normalizeProtocolo } from "@/lib/protocolo-validation";
import { getPortalUrl } from "@/lib/portal";
import { buildConclusaoStructuredData, buildSeoHead } from "@/lib/seo";
import { trackConclusaoCadastroView } from "@/lib/tracking";

const PATH = "/conclusao-cadastro";
const TITLE = "Iniciar Processo de credenciamento SICAF / Comprasnet — CADBRASIL";
const DESCRIPTION =
  "Triagem para iniciar o credenciamento SICAF e Comprasnet: documentos, certificado digital, taxa única anual e acesso ao Portal do Fornecedor.";

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
        "credenciamento SICAF, Comprasnet, taxa SICAF, certificado digital, portal fornecedor CADBRASIL, iniciar processo",
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
        content: `Protocolo ${consulta.data.protocolo} — ${c.razaoSocial}. Inicie o processo de credenciamento SICAF / Comprasnet.`,
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

  if (!protocoloQuery) {
    return (
      <PageShell>
        <StatusCard
          icon={<AlertCircle className="h-10 w-10 text-amber-500" />}
          title="Protocolo não informado"
          description="Esta página inicia o processo de credenciamento SICAF após o cadastro. Inicie o cadastro para receber seu número de protocolo."
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
      <PageShell protocolo={protocoloQuery}>
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
    <PageShell protocolo={cadastro.protocolo}>
      <div className="sr-only" aria-hidden="true">
        <h1>Iniciar Processo de credenciamento SICAF / Comprasnet</h1>
        <p>Protocolo CADBRASIL: {cadastro.protocolo}</p>
        <p>Empresa: {cadastro.cliente.razaoSocial}</p>
        <p>Status SICAF: {cadastro.sicaf?.status ?? "Pendente"}</p>
      </div>

      <TriagemProcessoSicaf
        protocolo={cadastro.protocolo}
        razaoSocial={cadastro.cliente.razaoSocial}
        emailAcesso={cadastro.usuario.emailAcesso}
        documento={cadastro.cliente.documento}
        tipoDocumento={cadastro.cliente.tipoDocumento}
      />
    </PageShell>
  );
}

function PageShell({
  children,
  protocolo,
}: {
  children: ReactNode;
  protocolo?: string;
}) {
  const waMessage = protocolo
    ? `Olá, estou na página de conclusão do cadastro CADBRASIL (protocolo ${protocolo}) e tenho dúvidas. Preciso de suporte.`
    : "Olá, estou na página de conclusão do cadastro CADBRASIL e tenho dúvidas. Preciso de suporte.";

  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto w-full max-w-7xl px-4 py-8 lg:px-8 lg:py-10">{children}</main>
      <WhatsAppFloating message={waMessage} />
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
    <div className="mx-auto max-w-lg rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="mx-auto flex justify-center">{icon}</div>
      <h1 className="mt-4 text-xl font-bold text-foreground">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      {children}
    </div>
  );
}
