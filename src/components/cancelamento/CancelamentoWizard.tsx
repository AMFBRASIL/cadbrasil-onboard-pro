import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileCheck2,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Wallet,
  XCircle,
  Sparkles,
} from "lucide-react";

import { TopBar, Header, InstitutionalFooter, WhatsAppFloating } from "@/components/cadastro/LayoutParts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  consultarDocumentoExistente,
  type ContratoDetalheConsulta,
  type PagamentoDetalheConsulta,
  type SicafDetalheConsulta,
} from "@/lib/cliente-consulta";
import { criarSolicitacaoCancelamento } from "@/lib/cancelamento";
import {
  FORMAS_PAGAMENTO,
  MOTIVOS_CANCELAMENTO,
  SERVICOS_ESPERADOS,
} from "@/lib/cancelamento-types";
import { getTrackingForPayload } from "@/lib/tracking";

type StepKey = "identificacao" | "motivos" | "reembolso" | "monitoramento" | "revisao";

interface StepDef {
  key: StepKey;
  num: number;
  title: string;
  short: string;
  icon: typeof Building2;
}

const STEPS: StepDef[] = [
  { key: "identificacao", num: 1, title: "Identificação da Empresa", short: "Empresa", icon: Building2 },
  { key: "motivos", num: 2, title: "Motivos e expectativas", short: "Motivos", icon: ClipboardList },
  { key: "reembolso", num: 3, title: "Dados para reembolso", short: "Reembolso", icon: Wallet },
  { key: "monitoramento", num: 4, title: "Acompanhamento de licitações", short: "Monitoramento", icon: Sparkles },
  { key: "revisao", num: 5, title: "Revisão e protocolo", short: "Revisão", icon: BadgeCheck },
];

interface FormState {
  clienteId: number | null;
  cnpj: string;
  razaoSocial: string;
  protocoloCadastro: string;
  email: string;
  telefone: string;
  cidade: string;
  estado: string;
  statusCliente: string;
  sicafStatus: string;
  completude: number;
  empresaOk: boolean;
  sicafDetalhe: SicafDetalheConsulta | null;
  contrato: ContratoDetalheConsulta | null;
  pagamentos: PagamentoDetalheConsulta[];

  motivos: string[];
  motivoOutro: string;
  motivoDetalhe: string;
  servicoEsperado: string;
  servicoEsperadoOutro: string;

  formaPagamento: string;
  titularPagamento: string;
  chavePix: string;
  banco: string;
  agencia: string;
  conta: string;
  valorPago: string;
  dataPagamento: string;

  desejaMonitoramento: boolean | null;
  reverterCancelamento: boolean;

  declaracao: boolean;
}

const INITIAL: FormState = {
  clienteId: null,
  cnpj: "",
  razaoSocial: "",
  protocoloCadastro: "",
  email: "",
  telefone: "",
  cidade: "",
  estado: "",
  statusCliente: "",
  sicafStatus: "",
  completude: 0,
  empresaOk: false,
  sicafDetalhe: null,
  contrato: null,
  pagamentos: [],
  motivos: [],
  motivoOutro: "",
  motivoDetalhe: "",
  servicoEsperado: "",
  servicoEsperadoOutro: "",
  formaPagamento: "",
  titularPagamento: "",
  chavePix: "",
  banco: "",
  agencia: "",
  conta: "",
  valorPago: "",
  dataPagamento: "",
  desejaMonitoramento: null,
  reverterCancelamento: false,
  declaracao: false,
};

function maskCNPJ(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function maskPhone(v: string) {
  return v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatMoney(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDateBR(iso: string | null | undefined) {
  if (!iso) return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function mapFormaFromPagamento(p: PagamentoDetalheConsulta | undefined): string {
  if (!p) return "";
  const raw = (p.formaPagamento || p.tipo || "").toLowerCase();
  if (raw.includes("pix")) return "pix";
  if (raw.includes("boleto")) return "boleto";
  if (raw.includes("cartao") || raw.includes("crédito") || raw.includes("credito")) return "cartao";
  if (raw.includes("transf")) return "transferencia";
  return "";
}

function labelMotivo(value: string) {
  return MOTIVOS_CANCELAMENTO.find((m) => m.value === value)?.label ?? value;
}

function labelServico(value: string) {
  return SERVICOS_ESPERADOS.find((s) => s.value === value)?.label ?? value;
}

function labelForma(value: string) {
  return FORMAS_PAGAMENTO.find((f) => f.value === value)?.label ?? value;
}

export function CancelamentoWizard() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState<FormState>(INITIAL);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const lastConsultadoRef = useRef<string>("");
  const footerActionsRef = useRef<HTMLDivElement>(null);

  const progress = Math.round((current / (STEPS.length - 1)) * 100);

  function scrollParaProximaEtapa() {
    // Aguarda o painel de dados renderizar (SICAF/pagamentos) antes de rolar
    requestAnimationFrame(() => {
      setTimeout(() => {
        footerActionsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 120);
    });
  }

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
    setStepError(null);
  }

  function resetEmpresaPartial(prev: FormState): FormState {
    return {
      ...prev,
      empresaOk: false,
      clienteId: null,
      razaoSocial: "",
      protocoloCadastro: "",
      statusCliente: "",
      sicafStatus: "",
      completude: 0,
      sicafDetalhe: null,
      contrato: null,
      pagamentos: [],
    };
  }

  function toggleMotivo(value: string) {
    setData((prev) => {
      const has = prev.motivos.includes(value);
      return {
        ...prev,
        motivos: has ? prev.motivos.filter((m) => m !== value) : [...prev.motivos, value],
      };
    });
    setStepError(null);
  }

  async function consultarEmpresa(documentoMasked?: string) {
    const digits = (documentoMasked ?? data.cnpj).replace(/\D/g, "");
    if (digits.length !== 14 && digits.length !== 11) {
      setStepError("Informe um CNPJ (14 dígitos) ou CPF (11 dígitos) válido.");
      return;
    }
    if (lastConsultadoRef.current === digits && data.empresaOk) return;

    setConsultando(true);
    setStepError(null);
    try {
      const result = await consultarDocumentoExistente({ data: digits });
      if (!result.exists || !result.cliente) {
        lastConsultadoRef.current = digits;
        setData((prev) => resetEmpresaPartial(prev));
        setStepError(
          "Documento não encontrado na base CADBRASIL. Confira o CNPJ/CPF ou fale com o suporte.",
        );
        return;
      }

      const c = result.cliente;
      const ultimoPagamento = c.pagamentos[0];
      const formaDetectada = mapFormaFromPagamento(ultimoPagamento);

      lastConsultadoRef.current = digits;
      setData((prev) => ({
        ...prev,
        empresaOk: true,
        clienteId: c.id,
        razaoSocial: c.razaoSocial,
        protocoloCadastro: c.protocolo ?? "",
        email: prev.email || c.email || "",
        telefone: prev.telefone || (c.telefone ? maskPhone(c.telefone) : ""),
        cidade: prev.cidade || c.cidade || "",
        estado: prev.estado || c.estado || "",
        statusCliente: c.statusCliente,
        sicafStatus: c.sicafStatus ?? "",
        completude: c.completude,
        sicafDetalhe: c.sicafDetalhe,
        contrato: c.contrato,
        pagamentos: c.pagamentos,
        titularPagamento: prev.titularPagamento || c.razaoSocial,
        formaPagamento: prev.formaPagamento || formaDetectada,
        valorPago:
          prev.valorPago ||
          (ultimoPagamento?.valor ? formatMoney(ultimoPagamento.valor) : ""),
        dataPagamento:
          prev.dataPagamento ||
          (ultimoPagamento?.dataVencimento
            ? formatDateBR(ultimoPagamento.dataVencimento)
            : ""),
      }));
      scrollParaProximaEtapa();
    } catch {
      setStepError("Não foi possível consultar o documento. Tente novamente.");
    } finally {
      setConsultando(false);
    }
  }

  useEffect(() => {
    const digits = data.cnpj.replace(/\D/g, "");
    const completo = digits.length === 14 || digits.length === 11;
    if (!completo) {
      if (lastConsultadoRef.current && lastConsultadoRef.current !== digits) {
        lastConsultadoRef.current = "";
      }
      return;
    }
    if (digits === lastConsultadoRef.current) return;

    const t = setTimeout(() => {
      void consultarEmpresa(data.cnpj);
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dispara só quando o documento muda
  }, [data.cnpj]);

  function validateStep(key: StepKey): string | null {
    switch (key) {
      case "identificacao":
        if (!data.empresaOk || !data.clienteId) return "Consulte e confirme a empresa pelo CNPJ/CPF.";
        if (!data.razaoSocial.trim()) return "Empresa sem razão social na base. Fale com o suporte.";
        return null;
      case "motivos":
        if (data.motivos.length === 0) return "Selecione ao menos um motivo.";
        if (data.motivos.includes("outro") && !data.motivoOutro.trim()) return "Descreva o outro motivo.";
        if (data.motivoDetalhe.trim().length < 10) return "Detalhe o motivo com pelo menos 10 caracteres.";
        if (!data.servicoEsperado) return "Informe o serviço que você esperava da CADBRASIL.";
        if (data.servicoEsperado === "outro" && !data.servicoEsperadoOutro.trim()) {
          return "Descreva o serviço esperado.";
        }
        return null;
      case "reembolso":
        if (!data.formaPagamento) return "Informe como foi feito o pagamento.";
        if (data.titularPagamento.trim().length < 2) return "Informe o titular do pagamento.";
        if (data.formaPagamento === "pix" && !data.chavePix.trim()) {
          return "Informe a chave PIX para eventual reembolso.";
        }
        if (
          (data.formaPagamento === "transferencia" || data.formaPagamento === "boleto") &&
          (!data.banco.trim() || !data.agencia.trim() || !data.conta.trim())
        ) {
          return "Informe banco, agência e conta.";
        }
        return null;
      case "monitoramento":
        if (data.desejaMonitoramento === null) {
          return "Informe se deseja acompanhamento de licitações.";
        }
        return null;
      case "revisao":
        if (!data.declaracao) return "Confirme a declaração para protocolar.";
        return null;
      default:
        return null;
    }
  }

  function next() {
    const err = validateStep(STEPS[current].key);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setCurrent((c) => Math.min(c + 1, STEPS.length - 1));
  }

  function prev() {
    setStepError(null);
    setCurrent((c) => Math.max(c - 1, 0));
  }

  async function handleFinalizar() {
    const err = validateStep("revisao");
    if (err) {
      setStepError(err);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await criarSolicitacaoCancelamento({
        data: {
          clienteId: data.clienteId,
          documento: data.cnpj,
          razaoSocial: data.razaoSocial,
          protocoloCadastro: data.protocoloCadastro || null,
          email: data.email,
          telefone: data.telefone,
          cidade: data.cidade,
          estado: data.estado,
          motivos: data.motivos,
          motivoOutro: data.motivoOutro,
          motivoDetalhe: data.motivoDetalhe,
          servicoEsperado: data.servicoEsperado,
          servicoEsperadoOutro: data.servicoEsperadoOutro,
          formaPagamento: data.formaPagamento,
          titularPagamento: data.titularPagamento,
          chavePix: data.chavePix,
          banco: data.banco,
          agencia: data.agencia,
          conta: data.conta,
          valorPago: data.valorPago,
          dataPagamento: data.dataPagamento,
          desejaMonitoramento: Boolean(data.desejaMonitoramento),
          reverterCancelamento: data.reverterCancelamento,
          declaracao: true as const,
          tracking: getTrackingForPayload(),
        },
      });

      if (!result.success) {
        setSubmitError(result.error);
        return;
      }

      if (result.emailEnviado === false) {
        console.warn("[cancelamento] protocolo ok, e-mail NÃO enviado:", result.emailErro);
      } else {
        console.log("[cancelamento] protocolo + e-mail enviados:", result.protocolo);
      }

      void navigate({
        to: "/conclusao-cancelamento",
        search: {
          protocolo: result.protocolo,
          revertido: result.reverterCancelamento ? "1" : "0",
          monitoramento: result.desejaMonitoramento ? "1" : "0",
          email: result.emailEnviado === false ? "0" : "1",
        },
      });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Erro ao protocolar solicitação.");
    } finally {
      setSubmitting(false);
    }
  }

  const step = STEPS[current];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-8 lg:px-8">
        <div className="mb-6 rounded-xl border border-border bg-card px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Solicitação de cancelamento
          </p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Abertura de protocolo de cancelamento CADBRASIL
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
            Informe o CNPJ cadastrado, o motivo, os dados de pagamento e se deseja manter o
            acompanhamento de licitações. Ao final, você recebe um protocolo de atendimento.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">
            <Timeline current={current} onJump={(i) => i <= current && setCurrent(i)} />
          </aside>

          <section>
            <ProgressHeader current={current} progress={progress} />

            <div className="mt-6 rounded-xl border border-border bg-card shadow-[0_1px_2px_rgba(16,24,40,0.04),0_8px_24px_-12px_rgba(16,40,80,0.12)]">
              <div className="border-b border-border bg-primary-soft/40 px-6 py-5 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">{step.title}</h2>
                    <p className="text-sm text-muted-foreground">{stepSubtitle(step.key)}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-7">
                <div key={step.key} className="animate-fade-in">
                  {step.key === "identificacao" && (
                    <StepIdentificacao
                      data={data}
                      consultando={consultando}
                      onConsultar={() => void consultarEmpresa()}
                      onCnpjChange={(v) => {
                        lastConsultadoRef.current = "";
                        update("cnpj", maskCNPJ(v));
                        update("empresaOk", false);
                      }}
                    />
                  )}
                  {step.key === "motivos" && (
                    <StepMotivos data={data} update={update} toggleMotivo={toggleMotivo} />
                  )}
                  {step.key === "reembolso" && <StepReembolso data={data} update={update} />}
                  {step.key === "monitoramento" && <StepMonitoramento data={data} update={update} />}
                  {step.key === "revisao" && <StepRevisao data={data} update={update} />}
                </div>

                {(stepError || submitError) && (
                  <div className="mt-4 flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {stepError || submitError}
                  </div>
                )}
              </div>

              <div
                ref={footerActionsRef}
                className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-6 py-4 rounded-b-xl"
              >
                <p className="text-xs text-muted-foreground">
                  Seus dados são tratados conforme a LGPD (Lei nº 13.709/2018).
                </p>
                <div className="flex items-center gap-2">
                  {current > 0 && (
                    <Button variant="outline" onClick={prev} className="gap-2">
                      <ArrowLeft className="h-4 w-4" /> Voltar
                    </Button>
                  )}
                  {current < STEPS.length - 1 ? (
                    <Button onClick={next} className="gap-2 bg-primary hover:bg-primary-deep">
                      Avançar etapa <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      onClick={handleFinalizar}
                      disabled={!data.declaracao || submitting}
                      className="gap-2 bg-success text-success-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : data.reverterCancelamento ? (
                        <RefreshCw className="h-4 w-4" />
                      ) : (
                        <ShieldCheck className="h-4 w-4" />
                      )}
                      {submitting
                        ? "Enviando…"
                        : data.reverterCancelamento
                          ? "Protocolar e manter serviço"
                          : "Protocolar cancelamento"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <InstitutionalFooter />
      <WhatsAppFloating />
    </div>
  );
}

function stepSubtitle(k: StepKey) {
  switch (k) {
    case "identificacao":
      return "Consulte o CNPJ na base CADBRASIL para preencher os dados da empresa.";
    case "motivos":
      return "Informe por que deseja cancelar e qual serviço você esperava receber.";
    case "reembolso":
      return "Dados conforme o pagamento original, para análise de eventual reembolso.";
    case "monitoramento":
      return "Se quiser acompanhamento de licitações, você pode reverter o cancelamento.";
    case "revisao":
      return "Confira tudo antes de gerar o protocolo oficial de cancelamento.";
  }
}

function ProgressHeader({ current, progress }: { current: number; progress: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Passo {current + 1} de {STEPS.length}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">{progress}% do processo concluído</p>
        </div>
        <p className="text-xs text-muted-foreground">Protocolo gerado ao final</p>
      </div>
      <Progress value={progress} className="mt-3 h-2 bg-primary-soft" />
    </div>
  );
}

function Timeline({ current, onJump }: { current: number; onJump: (i: number) => void }) {
  return (
    <div className="sticky top-6 space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Etapas do cancelamento
        </p>
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => onJump(i)}
                  className={cn(
                    "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors",
                    active && "bg-primary-soft",
                    !active && i <= current && "hover:bg-muted",
                    i > current && "cursor-not-allowed opacity-60",
                  )}
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                      done && "border-success bg-success text-success-foreground",
                      active && "border-primary bg-primary text-primary-foreground",
                      !done && !active && "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : s.num}
                  </div>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", active ? "text-primary-deep" : "text-foreground")}>
                      {s.short}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{s.title}</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
        <Separator className="my-4" />
        <div className="rounded-md bg-primary-soft/60 p-3 text-[11px] leading-relaxed text-primary-deep">
          O cancelamento será analisado pela equipe CADBRASIL. O protocolo permite acompanhar o
          atendimento.
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function InfoItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className={cn("mt-1 text-sm font-medium text-foreground break-words", mono && "font-mono")}>
        {value || "—"}
      </dd>
    </div>
  );
}

function StepIdentificacao({
  data,
  consultando,
  onConsultar,
  onCnpjChange,
}: {
  data: FormState;
  consultando: boolean;
  onConsultar: () => void;
  onCnpjChange: (value: string) => void;
}) {
  const digits = data.cnpj.replace(/\D/g, "");
  const faltam = Math.max(0, 14 - digits.length);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary-soft/50 via-card to-card p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              Consulta automática CADBRASIL
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground sm:text-xl">
              Informe o CNPJ da empresa
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-xl">
              Ao digitar o CNPJ completo, buscamos na base CADBRASIL os dados cadastrais, situação
              do SICAF e histórico de pagamentos.
            </p>
          </div>
          {consultando && (
            <Badge className="gap-1.5 bg-primary text-primary-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Consultando…
            </Badge>
          )}
          {data.empresaOk && !consultando && (
            <Badge className="gap-1.5 bg-success text-success-foreground hover:bg-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Localizado
            </Badge>
          )}
        </div>

        <div className="mt-5">
          <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            CNPJ <span className="text-destructive">*</span>
          </Label>
          <Input
            value={data.cnpj}
            onChange={(e) => onCnpjChange(e.target.value)}
            placeholder="00.000.000/0000-00"
            inputMode="numeric"
            autoFocus
            className="mt-2 h-16 text-center font-mono text-2xl sm:text-3xl tracking-wider font-semibold shadow-inner"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {digits.length < 14
                ? `Digite mais ${faltam} dígito${faltam === 1 ? "" : "s"} para consultar automaticamente`
                : "CNPJ completo — consulta iniciada automaticamente"}
            </span>
            <button
              type="button"
              onClick={onConsultar}
              disabled={consultando || digits.length < 11}
              className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", consultando && "animate-spin")} />
              Consultar novamente
            </button>
          </div>
        </div>
      </div>

      {data.empresaOk && (
        <>
          <div className="rounded-xl border border-success/30 bg-success/5 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-success">
              <CheckCircle2 className="h-4 w-4" /> Empresa localizada na base CADBRASIL
            </div>
            <dl className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="Razão social / Nome" value={data.razaoSocial} />
              <InfoItem label="Documento" value={data.cnpj} mono />
              <InfoItem label="Protocolo de cadastro" value={data.protocoloCadastro || "—"} mono />
              <InfoItem label="Status do cliente" value={data.statusCliente || "—"} />
              <InfoItem label="E-mail de contato" value={data.email || "—"} />
              <InfoItem label="Telefone / WhatsApp" value={data.telefone || "—"} />
              <InfoItem
                label="Cidade / UF"
                value={[data.cidade, data.estado].filter(Boolean).join(" / ") || "—"}
              />
            </dl>
          </div>

          <PainelSicaf
            status={data.sicafStatus}
            completude={data.completude}
            detalhe={data.sicafDetalhe}
            contrato={data.contrato}
          />

          <PainelPagamentos pagamentos={data.pagamentos} />
        </>
      )}
    </div>
  );
}

function etapaColor(status: string) {
  if (/ativo|habilitado|regular|assinado|pago|gerado/i.test(status)) return "bg-success text-success-foreground";
  if (/pendente|aguardando/i.test(status)) return "bg-amber-500 text-white";
  if (/cancel|inativ|erro|recus/i.test(status)) return "bg-destructive text-destructive-foreground";
  return "bg-muted text-foreground";
}

function PainelSicaf({
  status,
  completude,
  detalhe,
  contrato,
}: {
  status: string;
  completude: number;
  detalhe: SicafDetalheConsulta | null;
  contrato: ContratoDetalheConsulta | null;
}) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-deep">
          Situação SICAF e contrato
        </p>
      </div>
      <div className="p-4 sm:p-5 space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge className={cn("text-sm", etapaColor(status || "Sem cadastro"))}>
            SICAF: {status || "Sem registro"}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Completude: <strong className="text-foreground">{completude}%</strong>
          </span>
          {detalhe && (
            <>
              <Badge variant="outline">
                Credenciamento anual: {detalhe.credenciamentoAnual ? "Sim" : "Não"}
              </Badge>
              <Badge variant="outline">
                Manutenção: {detalhe.manutencaoAtiva ? "Ativa" : "Inativa"}
              </Badge>
              {detalhe.diasValidade > 0 && (
                <Badge variant="outline">{detalhe.diasValidade} dias de validade</Badge>
              )}
            </>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
            Níveis SICAF
          </p>
          {detalhe && detalhe.niveis.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {detalhe.niveis.map((n) => (
                <div
                  key={n.nivel}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-center",
                    n.habilitado
                      ? "border-success/40 bg-success/10"
                      : "border-border bg-muted/30",
                  )}
                >
                  <p className="text-xs text-muted-foreground">Nível</p>
                  <p className="text-lg font-bold text-foreground">{n.nivel}</p>
                  <p className={cn("text-[11px] font-medium", n.habilitado ? "text-success" : "text-muted-foreground")}>
                    {n.habilitado ? "Habilitado" : "Pendente"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum nível SICAF registrado ainda.</p>
          )}
        </div>

        {contrato && (
          <div className="rounded-lg border border-border bg-muted/20 p-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Plano / contrato</p>
              <p className="text-sm font-medium">{contrato.plano}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Status do contrato</p>
              <Badge className={cn("mt-1", etapaColor(contrato.status))}>{contrato.status}</Badge>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Início</p>
              <p className="text-sm font-medium">{formatDateBR(contrato.dataInicio)}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Vencimento</p>
              <p className="text-sm font-medium">{formatDateBR(contrato.dataVencimento)}</p>
            </div>
            {contrato.assinadoPor && (
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Assinado por</p>
                <p className="text-sm font-medium">{contrato.assinadoPor}</p>
              </div>
            )}
          </div>
        )}

        {detalhe?.observacoes && (
          <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
            {detalhe.observacoes}
          </p>
        )}
      </div>
    </div>
  );
}

function PainelPagamentos({ pagamentos }: { pagamentos: PagamentoDetalheConsulta[] }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border bg-muted/40 px-4 py-3 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-deep">
          Pagamentos e taxas
        </p>
      </div>
      <div className="p-4 sm:p-5">
        {pagamentos.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum pagamento ou taxa encontrado para este cliente na base.
          </p>
        ) : (
          <ul className="space-y-3">
            {pagamentos.map((p) => (
              <li
                key={`${p.origem}-${p.id}`}
                className="rounded-lg border border-border bg-background px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.descricao}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {p.origem === "taxa_sicaf" ? "Taxa SICAF" : "Cobrança Gerencianet"}
                      {p.formaPagamento ? ` · ${p.formaPagamento}` : ""}
                      {p.anoReferencia ? ` · ${p.anoReferencia}` : ""}
                      {p.protocolo ? ` · ${p.protocolo}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold tabular-nums">{formatMoney(p.valor)}</p>
                    <Badge className={cn("mt-1 text-[10px]", etapaColor(p.status))}>{p.status}</Badge>
                  </div>
                </div>
                {p.dataVencimento && (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Vencimento: {formatDateBR(p.dataVencimento)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StepMotivos({
  data,
  update,
  toggleMotivo,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleMotivo: (value: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Motivos do cancelamento <span className="text-destructive">*</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {MOTIVOS_CANCELAMENTO.map((m) => {
            const checked = data.motivos.includes(m.value);
            return (
              <label
                key={m.value}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors",
                  checked ? "border-primary bg-primary-soft/40" : "border-border hover:bg-muted/40",
                )}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggleMotivo(m.value)} className="mt-0.5" />
                <span>{m.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {data.motivos.includes("outro") && (
        <Field label="Descreva o outro motivo" required>
          <Input
            value={data.motivoOutro}
            onChange={(e) => update("motivoOutro", e.target.value)}
            placeholder="Conte em poucas palavras"
          />
        </Field>
      )}

      <Field
        label="Conte com mais detalhes por que não quis mais o serviço"
        required
        hint="Isso ajuda a CADBRASIL a melhorar o atendimento."
      >
        <textarea
          value={data.motivoDetalhe}
          onChange={(e) => update("motivoDetalhe", e.target.value)}
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Ex.: Eu esperava X, mas encontrei Y..."
        />
      </Field>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Qual serviço você esperava ter da CADBRASIL? <span className="text-destructive">*</span>
        </p>
        <div className="grid gap-2">
          {SERVICOS_ESPERADOS.map((s) => (
            <label
              key={s.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                data.servicoEsperado === s.value
                  ? "border-primary bg-primary-soft/40"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                name="servicoEsperado"
                checked={data.servicoEsperado === s.value}
                onChange={() => update("servicoEsperado", s.value)}
                className="accent-primary"
              />
              {s.label}
            </label>
          ))}
        </div>
      </div>

      {data.servicoEsperado === "outro" && (
        <Field label="Descreva o serviço esperado" required>
          <Input
            value={data.servicoEsperadoOutro}
            onChange={(e) => update("servicoEsperadoOutro", e.target.value)}
          />
        </Field>
      )}
    </div>
  );
}

function StepReembolso({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const precisaPix = data.formaPagamento === "pix";
  const precisaConta =
    data.formaPagamento === "transferencia" || data.formaPagamento === "boleto";

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Informe os dados conforme o pagamento foi realizado. A análise de reembolso segue as regras
        contratuais e o prazo de garantia quando aplicável.
      </p>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Forma de pagamento original <span className="text-destructive">*</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {FORMAS_PAGAMENTO.map((f) => (
            <label
              key={f.value}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm transition-colors",
                data.formaPagamento === f.value
                  ? "border-primary bg-primary-soft/40"
                  : "border-border hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                name="formaPagamento"
                checked={data.formaPagamento === f.value}
                onChange={() => update("formaPagamento", f.value)}
                className="accent-primary"
              />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Titular do pagamento" required>
          <Input
            value={data.titularPagamento}
            onChange={(e) => update("titularPagamento", e.target.value)}
          />
        </Field>
        <Field label="Valor pago (opcional)">
          <Input
            value={data.valorPago}
            onChange={(e) => update("valorPago", e.target.value)}
            placeholder="R$ 0,00"
          />
        </Field>
        <Field label="Data aproximada do pagamento (opcional)">
          <Input
            value={data.dataPagamento}
            onChange={(e) => update("dataPagamento", e.target.value)}
            placeholder="DD/MM/AAAA"
          />
        </Field>
      </div>

      {precisaPix && (
        <Field label="Chave PIX para reembolso" required>
          <Input
            value={data.chavePix}
            onChange={(e) => update("chavePix", e.target.value)}
            placeholder="CPF, e-mail, telefone ou chave aleatória"
          />
        </Field>
      )}

      {precisaConta && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Banco" required>
            <Input value={data.banco} onChange={(e) => update("banco", e.target.value)} />
          </Field>
          <Field label="Agência" required>
            <Input value={data.agencia} onChange={(e) => update("agencia", e.target.value)} />
          </Field>
          <Field label="Conta" required>
            <Input value={data.conta} onChange={(e) => update("conta", e.target.value)} />
          </Field>
        </div>
      )}
    </div>
  );
}

function StepMonitoramento({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-primary/20 bg-primary-soft/40 p-4 text-sm text-primary-deep leading-relaxed">
        Se o que você realmente precisava era <strong>acompanhamento de licitações</strong>, você
        pode reverter este cancelamento e nossa equipe pode realinhar o serviço sem precisar iniciar
        um novo cadastro.
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Você deseja acompanhamento / monitoramento de licitações?{" "}
          <span className="text-destructive">*</span>
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => {
              update("desejaMonitoramento", true);
            }}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              data.desejaMonitoramento === true
                ? "border-primary bg-primary-soft/50"
                : "border-border hover:bg-muted/40",
            )}
          >
            <p className="font-semibold text-foreground">Sim, quero acompanhamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Editais e oportunidades alinhados ao perfil da empresa.
            </p>
          </button>
          <button
            type="button"
            onClick={() => {
              update("desejaMonitoramento", false);
              update("reverterCancelamento", false);
            }}
            className={cn(
              "rounded-lg border p-4 text-left transition-colors",
              data.desejaMonitoramento === false
                ? "border-primary bg-primary-soft/50"
                : "border-border hover:bg-muted/40",
            )}
          >
            <p className="font-semibold text-foreground">Não, quero seguir com o cancelamento</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Mantém a solicitação de cancelamento em análise.
            </p>
          </button>
        </div>
      </div>

      {data.desejaMonitoramento === true && (
        <label
          className={cn(
            "flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors",
            data.reverterCancelamento ? "border-success bg-success/5" : "border-border",
          )}
        >
          <Checkbox
            checked={data.reverterCancelamento}
            onCheckedChange={(c) => update("reverterCancelamento", Boolean(c))}
            className="mt-0.5"
          />
          <span className="text-sm leading-relaxed">
            <strong>Sim, quero reverter o cancelamento</strong> e continuar com a CADBRASIL para
            monitoramento de licitações. O protocolo será registrado como interesse em manter o
            serviço.
          </span>
        </label>
      )}

      {data.desejaMonitoramento === false && (
        <div className="flex items-start gap-2 rounded-md border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
          Sem monitoramento. A solicitação seguirá como cancelamento para análise da equipe.
        </div>
      )}
    </div>
  );
}

function StepRevisao({
  data,
  update,
}: {
  data: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  const motivosLabel = useMemo(
    () =>
      data.motivos
        .map((m) => (m === "outro" && data.motivoOutro ? data.motivoOutro : labelMotivo(m)))
        .join("; "),
    [data.motivos, data.motivoOutro],
  );

  return (
    <div className="space-y-4">
      <ReviewBlock title="Empresa">
        <ReviewItem k="Documento" v={data.cnpj || "—"} />
        <ReviewItem k="Razão social" v={data.razaoSocial || "—"} />
        <ReviewItem k="Protocolo cadastro" v={data.protocoloCadastro || "—"} />
        <ReviewItem k="E-mail" v={data.email || "—"} />
        <ReviewItem k="Telefone" v={data.telefone || "—"} />
        <ReviewItem k="Cidade/UF" v={[data.cidade, data.estado].filter(Boolean).join(" / ") || "—"} />
      </ReviewBlock>

      <ReviewBlock title="Motivos e expectativa">
        <ReviewItem k="Motivos" v={motivosLabel || "—"} />
        <ReviewItem k="Detalhe" v={data.motivoDetalhe || "—"} />
        <ReviewItem
          k="Serviço esperado"
          v={
            data.servicoEsperado === "outro"
              ? data.servicoEsperadoOutro || "—"
              : labelServico(data.servicoEsperado)
          }
        />
      </ReviewBlock>

      <ReviewBlock title="Pagamento / reembolso">
        <ReviewItem k="Forma" v={labelForma(data.formaPagamento)} />
        <ReviewItem k="Titular" v={data.titularPagamento || "—"} />
        <ReviewItem k="Valor" v={data.valorPago || "—"} />
        <ReviewItem k="Data" v={data.dataPagamento || "—"} />
        {data.formaPagamento === "pix" && <ReviewItem k="PIX" v={data.chavePix || "—"} />}
        {(data.formaPagamento === "transferencia" || data.formaPagamento === "boleto") && (
          <ReviewItem
            k="Conta"
            v={[data.banco, data.agencia, data.conta].filter(Boolean).join(" · ") || "—"}
          />
        )}
      </ReviewBlock>

      <ReviewBlock title="Monitoramento">
        <ReviewItem
          k="Deseja acompanhamento"
          v={data.desejaMonitoramento ? "Sim" : data.desejaMonitoramento === false ? "Não" : "—"}
        />
        <ReviewItem k="Reverter cancelamento" v={data.reverterCancelamento ? "Sim" : "Não"} />
      </ReviewBlock>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-primary-soft/30 p-4">
        <Checkbox
          checked={data.declaracao}
          onCheckedChange={(c) => update("declaracao", Boolean(c))}
          className="mt-0.5"
        />
        <span className="text-sm leading-relaxed text-foreground">
          Declaro que as informações prestadas são verdadeiras e autorizo a CADBRASIL a analisar esta
          solicitação de cancelamento{data.reverterCancelamento ? " (com reversão para monitoramento)" : ""}{" "}
          conforme seus procedimentos internos e a legislação vigente.
        </span>
      </label>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/40 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-deep">{title}</p>
      </div>
      <dl className="grid gap-3 p-4 sm:grid-cols-2">{children}</dl>
    </div>
  );
}

function ReviewItem({ k, v }: { k: string; v: string }) {
  return (
    <div className="sm:col-span-1">
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground break-words">{v}</dd>
    </div>
  );
}
