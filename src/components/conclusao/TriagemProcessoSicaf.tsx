import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Circle,
  CreditCard,
  FileText,
  Gauge,
  KeyRound,
  Landmark,
  Loader2,
  LogIn,
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getPortalDocumentosUrl } from "@/lib/portal";
import { trackPortalClick } from "@/lib/tracking";
import { cn } from "@/lib/utils";

export const TAXA_PROCESSO_ANUAL = 476.5;

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
};

export function TriagemProcessoSicaf({
  protocolo,
  razaoSocial,
  emailAcesso,
}: Props) {
  const [docs, setDocs] = useState<DocId[]>([]);
  const [certificadoEmDia, setCertificadoEmDia] = useState<
    "sim" | "nao" | null
  >(null);
  const [guiaGerada, setGuiaGerada] = useState(false);
  const [gerandoGuia, setGerandoGuia] = useState(false);
  const [modalTaxa, setModalTaxa] = useState(false);
  const [modalRedirect, setModalRedirect] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(true);

  const portalHref = getPortalDocumentosUrl();
  const docsCount = docs.length;

  const qualityScore = useMemo(() => {
    let score = docs.length * DOC_POINTS;
    if (certificadoEmDia === "sim") score += CERT_SIM_POINTS;
    if (certificadoEmDia === "nao") score += CERT_NAO_POINTS;
    if (guiaGerada) score += GUIA_POINTS;
    return Math.min(100, Math.round((score / MAX_QUALITY) * 100));
  }, [docs.length, certificadoEmDia, guiaGerada]);

  const level = qualityLevel(qualityScore);

  const ajudaHref = buildWhatsAppHref(
    `Olá, estou na página de conclusão do cadastro CADBRASIL (protocolo ${protocolo}) e estou com dificuldade no processo SICAF / Comprasnet. Preciso saber como fazer o processo. Podem me ajudar?`,
  );

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
    setGerandoGuia(true);
    await new Promise((r) => setTimeout(r, 900));
    setGerandoGuia(false);
    setGuiaGerada(true);
    setModalTaxa(true);
  }

  function handleEntendiTaxa() {
    setModalTaxa(false);
    setModalRedirect(true);
  }

  useEffect(() => {
    if (!modalRedirect) return;

    const timer = window.setTimeout(() => {
      trackPortalClick("cta_principal");
      window.location.assign(portalHref);
    }, 2200);

    return () => window.clearTimeout(timer);
  }, [modalRedirect, portalHref]);

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
                  Guia gerada
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Gerar guia de pagamento
                </>
              )}
            </Button>
          </div>

          {guiaGerada ? (
            <p className="mt-4 flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" />
              Guia liberada dentro da sua plataforma do fornecedor.
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <CheckCircle2 className="h-7 w-7 text-success" />
            </div>
            <DialogTitle className="text-center text-xl">
              Taxa liberada na sua plataforma
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              A guia da taxa única anual de{" "}
              <strong className="text-foreground">{formatTaxaProcesso()}</strong>{" "}
              foi liberada dentro do Portal do Fornecedor. Acesse o sistema com
              seu login e senha para visualizar e pagar.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-sm">
              <p className="text-muted-foreground">Protocolo</p>
              <p className="font-mono font-bold text-foreground">{protocolo}</p>
            </div>
            <Button
              className="w-full font-semibold"
              onClick={handleEntendiTaxa}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={modalRedirect} onOpenChange={setModalRedirect}>
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
            <DialogTitle className="text-center text-xl">
              Direcionando para o Portal do Fornecedor
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Estamos abrindo a plataforma para você continuar o processo SICAF
              e visualizar a guia da taxa de{" "}
              <strong className="text-foreground">{formatTaxaProcesso()}</strong>.
              Use o login e a senha criados no cadastro.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-center text-sm text-muted-foreground">
              Aguarde alguns segundos… redirecionamento automático.
            </div>
            <Button
              asChild
              className="w-full font-semibold"
              onClick={() => trackPortalClick("cta_principal")}
            >
              <a href={portalHref}>
                <LogIn className="h-4 w-4" />
                Ir agora para o portal
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </div>
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
