import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Circle,
  Copy,
  CreditCard,
  ExternalLink,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  Loader2,
  LogIn,
  Mail,
  MessageCircle,
  Scale,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import { buildWhatsAppHref } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { solicitarBoleto } from "@/lib/boleto";
import type { SolicitarBoletoResult } from "@/lib/boleto-types";
import { getPortalDocumentosUrl } from "@/lib/portal";
import { trackPortalClick } from "@/lib/tracking";
import { cn } from "@/lib/utils";

export const TAXA_PROCESSO_ANUAL = 985.5;

export function formatTaxaProcesso(): string {
  return TAXA_PROCESSO_ANUAL.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

const DOCUMENTOS_TRIAGEM = [
  {
    id: "contrato_social",
    label: "Contrato Social / Estatuto",
    shortLabel: "Contrato Social",
    hint: "Última alteração consolidada",
    icon: Building2,
  },
  {
    id: "cartao_cnpj",
    label: "Cartão CNPJ",
    shortLabel: "Cartão CNPJ",
    hint: "Comprovante da Receita Federal",
    icon: FileText,
  },
  {
    id: "cnd_federal",
    label: "CND Federal",
    shortLabel: "CND Federal",
    hint: "Certidão Negativa de Débitos Federais",
    icon: Landmark,
  },
  {
    id: "crf_fgts",
    label: "Certificado de Regularidade do FGTS",
    shortLabel: "CRF / FGTS",
    hint: "CRF emitido pela Caixa Econômica",
    icon: ShieldCheck,
  },
  {
    id: "cnd_trabalhista",
    label: "Certidão Negativa Trabalhista",
    shortLabel: "CNDT",
    hint: "CNDT — Justiça do Trabalho",
    icon: Scale,
  },
  {
    id: "balanco",
    label: "Balanço Patrimonial",
    shortLabel: "Balanço",
    hint: "Último exercício encerrado",
    icon: CreditCard,
  },
] as const;

type DocId = (typeof DOCUMENTOS_TRIAGEM)[number]["id"];

const DOC_POINTS = 10;
const CERT_SIM_POINTS = 30;
const CERT_NAO_POINTS = 5;
const GUIA_POINTS = 10;
const MAX_QUALITY =
  DOCUMENTOS_TRIAGEM.length * DOC_POINTS + CERT_SIM_POINTS + GUIA_POINTS;

type QualityLevel = {
  label: string;
  hint: string;
  tone: "muted" | "warn" | "ok" | "good" | "high";
};

function qualityLevel(score: number): QualityLevel {
  if (score >= 86) {
    return {
      label: "Alta",
      hint: "SICAF pode ser feito agora com boa prontidão.",
      tone: "high",
    };
  }
  if (score >= 71) {
    return {
      label: "Boa",
      hint: "Apto a avançar; suporte pontual se faltar algo.",
      tone: "good",
    };
  }
  if (score >= 46) {
    return {
      label: "Moderada",
      hint: "Processo possível, mas ainda falta reforço.",
      tone: "ok",
    };
  }
  if (score >= 21) {
    return {
      label: "Baixa",
      hint: "Faltam documentos ou certificado para avançar.",
      tone: "warn",
    };
  }
  return {
    label: "Inicial",
    hint: "Sem base suficiente — solicite ajuda para o processo.",
    tone: "muted",
  };
}

type Props = {
  protocolo: string;
  razaoSocial?: string;
  emailAcesso?: string;
  documento?: string;
  tipoDocumento?: string;
};

type BoletoOk = Extract<SolicitarBoletoResult, { success: true }>;

function formatVencimento(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function TriagemProcessoSicaf({
  protocolo,
  razaoSocial,
  emailAcesso,
  documento,
  tipoDocumento,
}: Props) {
  const [docs, setDocs] = useState<DocId[]>([]);
  const [certificadoEmDia, setCertificadoEmDia] = useState<
    "sim" | "nao" | null
  >(null);
  const [guiaGerada, setGuiaGerada] = useState(false);
  const [gerandoGuia, setGerandoGuia] = useState(false);
  const [modalTaxa, setModalTaxa] = useState(false);
  const [boleto, setBoleto] = useState<BoletoOk | null>(null);
  const [guiaError, setGuiaError] = useState<string | null>(null);
  const [copiedBarras, setCopiedBarras] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const portalHref = getPortalDocumentosUrl();
  const docsCount = docs.length;
  const docsPendentes = DOCUMENTOS_TRIAGEM.filter((d) => !docs.includes(d.id));
  const docsProntos = DOCUMENTOS_TRIAGEM.filter((d) => docs.includes(d.id));

  const qualityScore = useMemo(() => {
    let score = docs.length * DOC_POINTS;
    if (certificadoEmDia === "sim") score += CERT_SIM_POINTS;
    if (certificadoEmDia === "nao") score += CERT_NAO_POINTS;
    if (guiaGerada) score += GUIA_POINTS;
    return Math.min(100, Math.round((score / MAX_QUALITY) * 100));
  }, [docs.length, certificadoEmDia, guiaGerada]);

  const level = qualityLevel(qualityScore);

  const processStepsDone =
    (docsCount > 0 ? 1 : 0) +
    (certificadoEmDia ? 1 : 0) +
    (guiaGerada ? 1 : 0);
  const processStepsTotal = 4;
  const processPct = Math.round((processStepsDone / processStepsTotal) * 100);

  const ajudaHref = buildWhatsAppHref(
    `Olá, estou na página de conclusão do cadastro CADBRASIL (protocolo ${protocolo}) e estou com dificuldade no processo SICAF / Comprasnet. Preciso saber como fazer o processo. Podem me ajudar?`,
  );

  const cnpjDigits = onlyDigits(documento ?? "");
  const podeGerarBoleto =
    (tipoDocumento ?? "CNPJ").toUpperCase() !== "CPF" && cnpjDigits.length === 14;

  useEffect(() => {
    function updateScrollHint() {
      const doc = document.documentElement;
      const remaining = doc.scrollHeight - window.scrollY - window.innerHeight;
      setShowScrollHint(remaining > 140);
    }

    updateScrollHint();
    window.addEventListener("scroll", updateScrollHint, { passive: true });
    window.addEventListener("resize", updateScrollHint);
    return () => {
      window.removeEventListener("scroll", updateScrollHint);
      window.removeEventListener("resize", updateScrollHint);
    };
  }, []);

  function scrollToNextSection() {
    const ids = ["triagem-certificado", "triagem-taxa", "triagem-acesso"];
    const next = ids
      .map((id) => document.getElementById(id))
      .find((el) => el && el.getBoundingClientRect().top > 96);

    const target =
      next ?? document.getElementById("triagem-acesso") ?? undefined;
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleDoc(id: DocId) {
    setDocs((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }

  async function handleGerarGuia() {
    setGuiaError(null);
    setCopiedBarras(false);

    if (guiaGerada && boleto) {
      setModalTaxa(true);
      return;
    }

    if (!podeGerarBoleto) {
      setGuiaError(
        "Não foi possível identificar um CNPJ válido para gerar a guia. Fale com o suporte.",
      );
      return;
    }

    setGerandoGuia(true);
    try {
      const res = await solicitarBoleto({ data: { cnpj: cnpjDigits } });
      if (!res.success) {
        setGuiaError(res.error);
        return;
      }
      setBoleto(res);
      setGuiaGerada(true);
      setModalTaxa(true);
    } catch (err) {
      console.error("[handleGerarGuia]", err);
      setGuiaError("Erro ao gerar a guia. Tente novamente em instantes.");
    } finally {
      setGerandoGuia(false);
    }
  }

  async function copyCodigoBarras() {
    if (!boleto?.codigoBarras) return;
    try {
      await navigator.clipboard.writeText(boleto.codigoBarras);
      setCopiedBarras(true);
      window.setTimeout(() => setCopiedBarras(false), 2000);
    } catch {
      setCopiedBarras(false);
    }
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="space-y-6 lg:space-y-8">
          <header className="rounded-2xl border border-border bg-card px-6 py-8 shadow-sm lg:px-10 lg:py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/25">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                Triagem inicial
              </p>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-foreground lg:text-4xl">
                Iniciar Processo de Credenciamento SICAF / Comprasnet
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground lg:text-base">
                Responda às etapas abaixo para liberarmos o seu processo na
                plataforma do fornecedor.
                {razaoSocial ? (
                  <>
                    {" "}
                    <strong className="text-foreground">{razaoSocial}</strong>
                    {" · "}
                    <span className="font-mono text-foreground">{protocolo}</span>
                  </>
                ) : (
                  <>
                    {" "}
                    Protocolo{" "}
                    <span className="font-mono text-foreground">{protocolo}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </header>

        {/* 1. Documentos */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              1
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground lg:text-xl">
                Documentos disponíveis para a licitação
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Selecione os documentos que a sua empresa já possui. Os demais
                serão solicitados pela equipe técnica.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {DOCUMENTOS_TRIAGEM.map((doc) => {
              const selected = docs.includes(doc.id);
              const Icon = doc.icon;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => toggleDoc(doc.id)}
                  className={cn(
                    "relative flex min-h-[132px] flex-col items-start gap-3 rounded-2xl border p-5 text-left transition-all",
                    selected
                      ? "border-primary bg-primary-soft/40 shadow-sm ring-2 ring-primary/15"
                      : "border-border bg-background hover:border-primary/40 hover:bg-muted/30",
                  )}
                >
                  {selected ? (
                    <CheckCircle2 className="absolute right-4 top-4 h-6 w-6 text-success" />
                  ) : (
                    <span className="absolute right-4 top-4 h-6 w-6 rounded-full border-2 border-muted-foreground/25" />
                  )}
                  <span
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block pr-8 text-base font-bold leading-snug text-foreground">
                      {doc.label}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {doc.hint}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            <strong className="text-foreground">
              {docsCount} de {DOCUMENTOS_TRIAGEM.length}
            </strong>{" "}
            documentos selecionados
          </p>
        </section>

        {/* 2. Certificado */}
        <section
          id="triagem-certificado"
          className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              2
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground lg:text-xl">
                Certificado digital em dia?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                O certificado digital e-CNPJ (A1 ou A3) é obrigatório para operar
                no SICAF / Comprasnet.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setCertificadoEmDia("sim")}
              className={cn(
                "flex min-h-[140px] items-start gap-4 rounded-2xl border p-6 text-left transition-all",
                certificadoEmDia === "sim"
                  ? "border-primary bg-primary-soft/40 ring-2 ring-primary/15"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  certificadoEmDia === "sim"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <BadgeCheck className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-base font-bold text-foreground">
                  Sim, está válido
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Vamos utilizá-lo na habilitação do processo.
                </span>
              </span>
              {certificadoEmDia === "sim" ? (
                <CheckCircle2 className="ml-auto h-6 w-6 shrink-0 text-success" />
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setCertificadoEmDia("nao")}
              className={cn(
                "flex min-h-[140px] items-start gap-4 rounded-2xl border p-6 text-left transition-all",
                certificadoEmDia === "nao"
                  ? "border-primary bg-primary-soft/40 ring-2 ring-primary/15"
                  : "border-border bg-background hover:border-primary/40",
              )}
            >
              <span
                className={cn(
                  "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
                  certificadoEmDia === "nao"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <XCircle className="h-6 w-6" />
              </span>
              <span>
                <span className="block text-base font-bold text-foreground">
                  Não / está vencido
                </span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Nossa equipe fará a emissão assistida do certificado.
                </span>
              </span>
              {certificadoEmDia === "nao" ? (
                <CheckCircle2 className="ml-auto h-6 w-6 shrink-0 text-success" />
              ) : null}
            </button>
          </div>
        </section>

        {/* 3. Taxa */}
        <section
          id="triagem-taxa"
          className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              3
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground lg:text-xl">
                Taxa do processo
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Emissão da guia referente ao credenciamento SICAF / Comprasnet.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 lg:p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <FileText className="h-7 w-7" />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Taxa única anual
                </p>
                <p className="text-3xl font-black tracking-tight text-foreground lg:text-4xl">
                  {formatTaxaProcesso()}
                </p>
              </div>
            </div>

          <Button
            type="button"
            size="lg"
            disabled={gerandoGuia}
            onClick={() => void handleGerarGuia()}
            className="h-14 shrink-0 px-8 font-bold sm:min-w-[200px]"
          >
            {gerandoGuia ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Gerando…
              </>
            ) : guiaGerada ? (
              <>
                <FileText className="h-5 w-5" />
                Ver detalhes da guia
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Gerar guia de pagamento
              </>
            )}
          </Button>
        </div>

        {guiaError ? (
          <p className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {guiaError}
          </p>
        ) : null}

        {guiaGerada ? (
          <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Guia gerada. Abra os detalhes para pagar e acompanhar o processo.
          </p>
        ) : null}
      </section>

        {/* 4. Acesso */}
        <section
          id="triagem-acesso"
          className="scroll-mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              4
            </span>
            <div>
              <h2 className="text-lg font-bold text-foreground lg:text-xl">
                Acessar o sistema
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Use o login e a senha criados durante o cadastro
                {emailAcesso ? (
                  <>
                    {" "}
                    (<strong className="text-foreground">{emailAcesso}</strong>)
                  </>
                ) : null}{" "}
                para acompanhar o processo.
              </p>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            className="mt-6 h-16 w-full text-base font-bold shadow-lg shadow-primary/20 lg:h-[72px] lg:text-lg"
            onClick={() => trackPortalClick("cta_principal")}
          >
            <a href={portalHref} target="_blank" rel="noopener noreferrer">
              <LogIn className="!h-6 !w-6" />
              Acessar Processo SICAF Agora
              <ArrowRight className="!h-5 !w-5" />
            </a>
          </Button>
          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Ambiente seguro · Portal do Fornecedor CADBRASIL
          </p>
        </section>
      </div>

      <aside className="order-first lg:order-none lg:sticky lg:top-6">
        <div className="overflow-hidden rounded-2xl border border-teal-600/20 bg-gradient-to-b from-teal-50 via-card to-card p-6 text-foreground shadow-xl shadow-teal-900/5">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-800/80">
            <Gauge className="h-3.5 w-3.5" />
            Qualidade do SICAF
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            Prontidão para o processo agora
          </p>
          <p className="text-4xl font-black tracking-tight text-foreground">
            {qualityScore}
            <span className="text-base font-semibold text-muted-foreground">
              %
            </span>
          </p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold",
              level.tone === "high" && "text-success",
              level.tone === "good" && "text-teal-700",
              level.tone === "ok" && "text-teal-700/80",
              level.tone === "warn" && "text-orange-700",
              level.tone === "muted" && "text-muted-foreground",
            )}
          >
            {level.label}
            <span className="font-normal text-muted-foreground">
              {" "}
              · {docsCount}/{DOCUMENTOS_TRIAGEM.length} docs
            </span>
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {level.hint}
          </p>

          <div className="mt-4">
            <Progress value={qualityScore} className="h-2.5" />
          </div>

          <ul className="mt-5 space-y-2 border-t border-border/80 pt-5 text-sm">
            {DOCUMENTOS_TRIAGEM.map((doc) => {
              const done = docs.includes(doc.id);
              return (
                <li key={doc.id} className="flex items-start gap-2">
                  {done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "leading-snug",
                      done ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {doc.shortLabel}
                  </span>
                </li>
              );
            })}
            <li className="flex items-start gap-2">
              {certificadoEmDia === "sim" ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : certificadoEmDia === "nao" ? (
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "leading-snug",
                  certificadoEmDia
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {certificadoEmDia === "sim"
                  ? "Certificado digital válido"
                  : certificadoEmDia === "nao"
                    ? "Certificado pendente / vencido"
                    : "Certificado digital"}
              </span>
            </li>
            <li className="flex items-start gap-2">
              {guiaGerada ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "leading-snug",
                  guiaGerada ? "text-foreground" : "text-muted-foreground",
                )}
              >
                Taxa do processo liberada
              </span>
            </li>
          </ul>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="mt-6 h-12 w-full border-teal-700/30 bg-teal-600/10 font-bold text-teal-950 hover:bg-teal-600/20"
          >
            <a href={ajudaHref} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-5 w-5" />
              Solicitar Ajuda agora
            </a>
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted-foreground">
            Mesmo sem documentos ou certificado, nossa equipe orienta o processo
            passo a passo.
          </p>
        </div>
      </aside>
      </div>

      <Dialog open={modalTaxa} onOpenChange={setModalTaxa}>
        <DialogContent
          className={cn(
            "flex w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0",
            "max-h-[min(92vh,880px)] sm:rounded-2xl",
          )}
        >
          <DialogHeader className="shrink-0 space-y-0 border-b border-border px-5 py-4 pr-12 text-left sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg leading-tight sm:text-xl">
                  Processo SICAF — guia liberada
                </DialogTitle>
                <DialogDescription className="mt-1 line-clamp-2 text-sm leading-snug">
                  {boleto?.message ||
                    "Confira o valor, o andamento e os documentos para concluir o credenciamento."}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <div className="grid gap-4 lg:grid-cols-12 lg:gap-5">
              {/* Coluna esquerda: valor + protocolos + andamento */}
              <div className="space-y-4 lg:col-span-5">
                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Taxa única anual
                      </p>
                      <p className="mt-1 text-3xl font-black tracking-tight text-foreground">
                        {boleto?.valorFormatado ?? formatTaxaProcesso()}
                      </p>
                    </div>
                    {boleto?.dataVencimento ? (
                      <p className="rounded-lg bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
                        Venc.{" "}
                        <strong className="text-foreground">
                          {formatVencimento(boleto.dataVencimento)}
                        </strong>
                      </p>
                    ) : null}
                  </div>
                  <div className="mt-3 border-t border-border/70 pt-3 text-sm">
                    <p>
                      <span className="text-muted-foreground">Cadastro · </span>
                      <span className="font-mono font-bold text-foreground">
                        {protocolo}
                      </span>
                    </p>
                    {boleto?.protocoloSicaf ? (
                      <p className="mt-1">
                        <span className="text-muted-foreground">SICAF · </span>
                        <span className="font-mono font-bold text-foreground">
                          {boleto.protocoloSicaf}
                        </span>
                      </p>
                    ) : null}
                    {(boleto?.razaoSocial || razaoSocial) && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                        {boleto?.razaoSocial || razaoSocial}
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-teal-600/20 bg-teal-50/60 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-800/80">
                      <Gauge className="h-3.5 w-3.5" />
                      Andamento
                    </div>
                    <span className="text-sm font-bold text-teal-900">
                      {processPct}% · {level.label}
                    </span>
                  </div>
                  <Progress value={processPct} className="mt-2.5 h-2" />
                  <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs sm:text-sm">
                    <li className="flex items-center gap-1.5">
                      {docsCount > 0 ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      )}
                      Docs {docsCount}/{DOCUMENTOS_TRIAGEM.length}
                    </li>
                    <li className="flex items-center gap-1.5">
                      {certificadoEmDia ? (
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      ) : (
                        <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      )}
                      {certificadoEmDia === "sim"
                        ? "Cert. válido"
                        : certificadoEmDia === "nao"
                          ? "Cert. pendente"
                          : "Certificado"}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" />
                      Guia
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
                      Análise final
                    </li>
                  </ul>
                </div>

                {boleto?.codigoBarras ? (
                  <div className="rounded-xl border border-border bg-muted/20 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                        Código de barras
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => void copyCodigoBarras()}
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedBarras ? "Copiado!" : "Copiar"}
                      </Button>
                    </div>
                    <p className="mt-1.5 break-all font-mono text-[11px] leading-relaxed text-foreground">
                      {boleto.codigoBarras}
                    </p>
                  </div>
                ) : null}

                {boleto?.emailEnviado && boleto.emailPara ? (
                  <p className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>
                      E-mail enviado para{" "}
                      <strong className="text-foreground">
                        {boleto.emailPara}
                      </strong>
                    </span>
                  </p>
                ) : null}
              </div>

              {/* Coluna direita: documentos */}
              <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7 lg:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-sm font-bold text-foreground">
                    Documentos em mãos
                  </p>
                  <ul className="mt-3 grid gap-1.5 text-sm">
                    {docsProntos.length === 0 ? (
                      <li className="text-muted-foreground">
                        Nenhum documento marcado ainda.
                      </li>
                    ) : (
                      docsProntos.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                          <span className="leading-snug">{doc.shortLabel}</span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
                <div className="rounded-xl border border-orange-500/25 bg-orange-50/50 p-4">
                  <p className="text-sm font-bold text-foreground">
                    Precisa enviar / providenciar
                  </p>
                  <ul className="mt-3 grid gap-2 text-sm">
                    {docsPendentes.length === 0 ? (
                      <li className="flex items-start gap-2 text-success">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        Documentação básica completa na triagem.
                      </li>
                    ) : (
                      docsPendentes.map((doc) => (
                        <li key={doc.id} className="flex items-start gap-2">
                          <Circle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                          <span className="leading-snug">
                            <span className="font-medium">{doc.shortLabel}</span>
                            <span className="mt-0.5 block text-xs text-muted-foreground">
                              {doc.hint}
                            </span>
                          </span>
                        </li>
                      ))
                    )}
                    {certificadoEmDia !== "sim" ? (
                      <li className="flex items-start gap-2">
                        <Circle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" />
                        <span className="leading-snug">
                          <span className="font-medium">
                            Certificado digital e-CNPJ
                          </span>
                          <span className="mt-0.5 block text-xs text-muted-foreground">
                            {certificadoEmDia === "nao"
                              ? "Pendente/vencido — emissão assistida disponível."
                              : "Ainda não informado na triagem."}
                          </span>
                        </span>
                      </li>
                    ) : null}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border bg-muted/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:space-x-0 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              className="order-3 w-full sm:order-1 sm:w-auto"
              onClick={() => setModalTaxa(false)}
            >
              Continuar na triagem
            </Button>
            <div className="order-1 flex w-full flex-col gap-2 sm:order-2 sm:w-auto sm:flex-row">
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-12 w-full font-semibold sm:w-auto"
                onClick={() => trackPortalClick("cta_principal")}
              >
                <a href={portalHref} target="_blank" rel="noopener noreferrer">
                  <LogIn className="h-4 w-4" />
                  Portal
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                className="h-12 w-full text-base font-bold shadow-md shadow-primary/20 sm:min-w-[220px]"
                onClick={() => trackPortalClick("cta_principal")}
              >
                <a
                  href={boleto?.urlPagamento ?? portalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-5 w-5" />
                  Acessar minha Guia
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showScrollHint ? (
        <button
          type="button"
          onClick={scrollToNextSection}
          className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-primary/30 bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-xl shadow-primary/30 transition hover:bg-primary-deep animate-bounce"
          aria-label="Ver mais informações abaixo"
        >
          Mais informações abaixo
          <ArrowDown className="h-4 w-4" />
        </button>
      ) : null}
    </>
  );
}
