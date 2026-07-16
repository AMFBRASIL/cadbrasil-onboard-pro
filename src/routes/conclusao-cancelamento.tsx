import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Copy,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  ClipboardList,
  Clock,
  ShieldCheck,
  FileCheck2,
} from "lucide-react";

import { TopBar, Header, InstitutionalFooter, WhatsAppFloating } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import { buildSeoHead } from "@/lib/seo";
import { normalizeProtocoloCancelamento } from "@/lib/protocolo-cancelamento-validation";

const PATH = "/conclusao-cancelamento";
const TITLE = "Protocolo de Cancelamento Recebido — CADBRASIL";
const DESCRIPTION =
  "Sua solicitação de cancelamento foi protocolada. Guarde o número do protocolo para acompanhamento.";

export const Route = createFileRoute("/conclusao-cancelamento")({
  validateSearch: (search: Record<string, unknown>) => ({
    protocolo: typeof search.protocolo === "string" ? search.protocolo.trim() : undefined,
    revertido: typeof search.revertido === "string" ? search.revertido : undefined,
    monitoramento: typeof search.monitoramento === "string" ? search.monitoramento : undefined,
    email: typeof search.email === "string" ? search.email : undefined,
  }),
  head: () => {
    const base = buildSeoHead({
      path: PATH,
      title: TITLE,
      description: DESCRIPTION,
      ogType: "website",
    });
    return {
      ...base,
      meta: [
        ...base.meta.filter((m) => !("name" in m && m.name === "robots")),
        { name: "robots", content: "noindex, nofollow" },
      ],
    };
  },
  component: ConclusaoCancelamentoPage,
});

function ConclusaoCancelamentoPage() {
  const { protocolo: raw, revertido, monitoramento, email } = Route.useSearch();
  const protocolo = raw ? normalizeProtocoloCancelamento(raw) : null;
  const foiRevertido = revertido === "1";
  const querMonitoramento = monitoramento === "1";
  const emailFalhou = email === "0";
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(t);
  }, [copied]);

  async function copiar() {
    if (!protocolo) return;
    try {
      await navigator.clipboard.writeText(protocolo);
      setCopied(true);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-10 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_20px_60px_-30px_rgba(16,40,80,0.25)] text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
            {foiRevertido ? <RefreshCw className="h-7 w-7" /> : <BadgeCheck className="h-7 w-7" />}
          </div>

          <h1 className="mt-5 text-2xl font-bold tracking-tight sm:text-3xl">
            {foiRevertido
              ? "Solicitação registrada — serviço mantido"
              : "Solicitação de cancelamento protocolada"}
          </h1>

          <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed max-w-xl mx-auto">
            {foiRevertido
              ? "Você optou por reverter o cancelamento e seguir com acompanhamento de licitações. Nossa equipe entrará em contato com o alinhamento do serviço."
              : querMonitoramento
                ? "Registramos seu interesse em monitoramento de licitações junto à solicitação. A equipe analisará o melhor caminho e entrará em contato."
                : "Sua solicitação foi recebida. Guarde o protocolo abaixo para acompanhamento."}
          </p>

          <div className="mt-8 rounded-xl border border-primary/20 bg-primary-soft/50 px-5 py-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Protocolo de cancelamento
            </p>
            {protocolo ? (
              <>
                <p className="mt-3 font-mono text-2xl sm:text-3xl font-bold tracking-wide text-primary-deep break-all">
                  {protocolo}
                </p>
                <Button type="button" variant="outline" className="mt-4 gap-2" onClick={copiar}>
                  {copied ? <CheckCircle2 className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copiado" : "Copiar protocolo"}
                </Button>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Protocolo não informado na URL. Se você acabou de enviar, volte ao formulário e refaça o
                processo.
              </p>
            )}
          </div>

          {!foiRevertido && (
            <div className="mt-6 rounded-xl border border-border bg-muted/30 px-5 py-5 text-left">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary-deep">
                <Clock className="h-4 w-4 text-primary" />
                Análise em até 5 dias úteis
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Sua solicitação passará por uma análise de <strong className="text-foreground">5 dias</strong>{" "}
                para validarmos todos os acessos ao sistema e o contrato assinado, antes de emitir o
                veredito final.
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-muted-foreground">
                <li className="flex items-start gap-2.5">
                  <ShieldCheck className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Validação dos acessos ao sistema e à plataforma CADBRASIL
                </li>
                <li className="flex items-start gap-2.5">
                  <FileCheck2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Conferência do contrato assinado e das condições aplicáveis
                </li>
                <li className="flex items-start gap-2.5">
                  <ClipboardList className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                  Após a análise, você receberá o veredito da solicitação
                </li>
              </ul>
            </div>
          )}

          <ul className="mt-8 space-y-3 text-left text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
              Use o protocolo em qualquer contato com o suporte CADBRASIL.
            </li>
            {emailFalhou ? (
              <li className="flex items-start gap-3 text-amber-700">
                <ClipboardList className="h-4 w-4 mt-0.5 shrink-0" />
                A solicitação foi gravada, mas a notificação por e-mail à equipe pode ter falhado.
                Informe o protocolo ao suporte se necessário.
              </li>
            ) : (
              <li className="flex items-start gap-3">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                A equipe CADBRASIL foi notificada por e-mail com os dados desta solicitação.
              </li>
            )}
          </ul>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild className="gap-2">
              <Link to="/">
                Ir para o início <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/solicitacao-cancelamento">Nova solicitação</Link>
            </Button>
          </div>
        </div>
      </main>

      <InstitutionalFooter />
      <WhatsAppFloating />
    </div>
  );
}
