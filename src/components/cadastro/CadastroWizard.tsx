import { useEffect, useMemo, useRef, useState, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  FileCheck2,
  Building2,
  UserRound,
  MapPin,
  ClipboardList,
  FileUp,
  CreditCard,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  CloudUpload,
  Trash2,
  Save,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  BadgeCheck,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { TopBar, Header } from "./LayoutParts";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// CNPJs já cadastrados (simulação). Substituir por chamada real à API quando disponível.
const EXISTING_CNPJS = new Set<string>([
  "11111111000111",
  "00000000000191",
]);

type StepKey =
  | "empresa"
  | "responsavel"
  | "endereco"
  | "diagnostico"
  | "plano"
  | "revisao";

interface StepDef {
  key: StepKey;
  num: number;
  title: string;
  short: string;
  icon: typeof Building2;
}

const STEPS: StepDef[] = [
  { key: "empresa", num: 1, title: "Identificação da Empresa", short: "Empresa", icon: Building2 },
  { key: "responsavel", num: 2, title: "Responsável Legal", short: "Responsável", icon: UserRound },
  { key: "endereco", num: 3, title: "Endereço Empresarial", short: "Endereço", icon: MapPin },
  { key: "diagnostico", num: 4, title: "Diagnóstico de Habilitação", short: "Diagnóstico", icon: ClipboardList },
  { key: "plano", num: 5, title: "Licença CADBRASIL", short: "Licença CADBRASIL", icon: CreditCard },
  { key: "revisao", num: 6, title: "Revisão e Finalização", short: "Revisão", icon: BadgeCheck },
];

interface FormState {
  tipoPessoa: "" | "pf" | "pj";
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  situacao: string;
  abertura: string;
  porte: string;
  empresaOk: boolean;

  nome: string;
  cpf: string;
  nascimento: string;
  telefone: string;
  whatsapp: string;
  email: string;
  cargo: string;

  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;

  documentos: Record<string, { name: string; size: number; status: "uploading" | "recebido" | "analise" | "aprovado"; progress: number }>;

  declaracao: boolean;
}

const INITIAL: FormState = {
  tipoPessoa: "",
  cnpj: "",
  razaoSocial: "",
  nomeFantasia: "",
  situacao: "",
  abertura: "",
  porte: "",
  empresaOk: false,
  nome: "",
  cpf: "",
  nascimento: "",
  telefone: "",
  whatsapp: "",
  email: "",
  cargo: "",
  cep: "",
  rua: "",
  numero: "",
  complemento: "",
  cidade: "",
  estado: "",
  documentos: {},
  declaracao: false,
};


function maskCNPJ(v: string) {
  return v.replace(/\D/g, "").slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}
function maskCPF(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskPhone(v: string) {
  return v.replace(/\D/g, "").slice(0, 11)
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}
function maskCEP(v: string) {
  return v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}
function isValidEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}
function isValidCPF(cpf: string) {
  return cpf.replace(/\D/g, "").length === 11;
}

export function CadastroWizard() {
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState<FormState>(INITIAL);
  const [savedAgo, setSavedAgo] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // autosave indicator
  useEffect(() => {
    setSavedAgo(0);
    const i = setInterval(() => setSavedAgo((s) => s + 1), 1000);
    return () => clearInterval(i);
  }, [data, current]);

  const progress = useMemo(() => Math.round(((current + 1) / STEPS.length) * 100), [current]);

  const update = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setData((d) => ({ ...d, [k]: v }));
  }, []);

  const next = () => setCurrent((c) => Math.min(STEPS.length - 1, c + 1));
  const prev = () => setCurrent((c) => Math.max(0, c - 1));

  if (submitted) return <SuccessScreen />;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-8 pt-8 lg:px-8">
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
                    {(() => {
                      const Icon = STEPS[current].icon;
                      return <Icon className="h-5 w-5" />;
                    })()}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold tracking-tight text-foreground">
                      {STEPS[current].title}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {stepSubtitle(STEPS[current].key)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="px-6 py-7">
                <div key={current} className="animate-fade-in">
                  {current === 0 && <StepEmpresa data={data} update={update} />}
                  {current === 1 && <StepResponsavel data={data} update={update} />}
                  {current === 2 && <StepEndereco data={data} update={update} />}
                  {current === 3 && <StepDiagnostico data={data} />}
                  {current === 4 && <StepPlano />}
                  {current === 5 && <StepRevisao data={data} update={update} />}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/40 px-6 py-4 rounded-b-xl">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Save className="h-3.5 w-3.5 text-success" />
                  Último salvamento há {savedAgo}s — rascunho protegido
                </div>
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
                      onClick={() => setSubmitted(true)}
                      disabled={!data.declaracao}
                      className="gap-2 bg-success text-success-foreground hover:opacity-90 disabled:opacity-50"
                    >
                      <ShieldCheck className="h-4 w-4" /> Finalizar Credenciamento
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <InstitutionalFooter />

      {/* WhatsApp flutuante */}
      <a
        href="https://wa.me/551121220202?text=Ol%C3%A1%2C+estou+na+p%C3%A1gina+de+cadastro+da+CADBRASIL+e+preciso+de+suporte."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 hover:shadow-xl"
        aria-label="Suporte via WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>
    </div>
  );
}

function stepSubtitle(k: StepKey) {
  switch (k) {
    case "empresa": return "Informe o CNPJ para consultarmos automaticamente os dados oficiais da Receita Federal.";
    case "responsavel": return "Dados do representante legal responsável pelo credenciamento da empresa.";
    case "endereco": return "Endereço fiscal cadastrado para fins de comunicação oficial e habilitação.";
    case "diagnostico": return "Análise preliminar dos requisitos exigidos pela Lei nº 14.133/2021.";
    case "plano": return "Plano oficial de habilitação assistida e acesso à plataforma CADBRASIL.";
    case "revisao": return "Confira os dados antes de protocolar oficialmente o seu credenciamento.";
  }
}

/* ---------------- TOP / HEADER ---------------- */

// TopBar, Header, Logo and Seal now imported from ./LayoutParts

/* ---------------- PROGRESS + TIMELINE ---------------- */

function ProgressHeader({ current, progress }: { current: number; progress: number }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Passo {current + 1} de {STEPS.length}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {progress}% do processo concluído
          </p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          Protocolo provisório <span className="font-mono text-foreground">CAD-2026-00001254</span>
        </div>
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
          Etapas do credenciamento
        </p>
        <ol className="space-y-1">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.key}>
                <button
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
          Suas informações são protegidas por criptografia TLS 1.3 e armazenadas conforme a LGPD (Lei nº 13.709/2018).
        </div>
      </div>

      {/* Cards abaixo dos steps */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Save className="h-3.5 w-3.5" />
          Salvamento Automático
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">Último salvamento há 1 min</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Você pode retomar este cadastro a qualquer momento neste navegador.
        </p>
      </div>
    </div>
  );
}

/* ---------------- STEPS ---------------- */

function StepEmpresa({ data, update }: { data: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const [loading, setLoading] = useState(false);
  const [existsAlert, setExistsAlert] = useState(false);
  const cnpjRef = useRef<HTMLInputElement>(null);
  const cpfRef = useRef<HTMLInputElement>(null);


  const handleCnpj = (v: string) => {
    const m = maskCNPJ(v);
    update("cnpj", m);
    const digits = m.replace(/\D/g, "");
    if (digits.length === 14 && !loading) {
      if (EXISTING_CNPJS.has(digits)) {
        update("empresaOk", false);
        setExistsAlert(true);
        return;
      }
      setLoading(true);
      update("empresaOk", false);
      setTimeout(() => {
        update("razaoSocial", "INOVAÇÃO E TECNOLOGIA EMPRESARIAL LTDA");
        update("nomeFantasia", "Inovatec Soluções");
        update("situacao", "ATIVA");
        update("abertura", "12/03/2017");
        update("porte", "EPP - Empresa de Pequeno Porte");
        update("empresaOk", true);
        setLoading(false);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-sm font-medium text-foreground">
          Selecione o tipo de cadastro para o processo de licitação <span className="text-destructive">*</span>
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              key: "pj" as const,
              icon: Building2,
              title: "Pessoa Jurídica",
              desc: "Empresa com CNPJ ativo. Indicado para sociedades, MEI, EIRELI e demais pessoas jurídicas que participam de licitações.",
              tag: "CNPJ",
            },
            {
              key: "pf" as const,
              icon: UserRound,
              title: "Pessoa Física",
              desc: "Profissional autônomo ou prestador individual. Indicado para credenciamento de pessoa física em processos licitatórios.",
              tag: "CPF",
            },
          ].map((opt) => {
            const Icon = opt.icon;
            const selected = data.tipoPessoa === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  update("tipoPessoa", opt.key);
                  update("empresaOk", false);
                  update("cnpj", "");
                  update("razaoSocial", "");
                  update("nomeFantasia", "");
                  update("situacao", "");
                  update("abertura", "");
                  update("porte", "");
                  setTimeout(() => {
                    (opt.key === "pj" ? cnpjRef : cpfRef).current?.focus();
                  }, 50);
                }}

                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all",
                  selected
                    ? "border-primary bg-primary-soft/40 shadow-[0_8px_24px_-12px_rgba(16,40,80,0.25)]"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary-soft/20",
                )}
                aria-pressed={selected}
              >
                <div className="flex w-full items-start justify-between">
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg transition-colors",
                      selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary",
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div
                    className={cn(
                      "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                      selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background",
                    )}
                  >
                    {selected && <CheckCircle2 className="h-5 w-5" />}
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">{opt.title}</h3>
                    <Badge variant="outline" className="text-[10px] font-medium">{opt.tag}</Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {data.tipoPessoa === "pj" && (
        <div className="animate-fade-in space-y-6">
          <Field label="CNPJ" required hint="Consulta automática na Receita Federal">
            <div className="relative">
              <Input
                ref={cnpjRef}
                value={data.cnpj}

                onChange={(e) => handleCnpj(e.target.value)}
                placeholder="00.000.000/0000-00"
                className="h-11 font-mono"
                inputMode="numeric"
              />
              {loading && (
                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
              )}
            </div>
          </Field>

          <AlertDialog open={existsAlert} onOpenChange={setExistsAlert}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-warning" />
                  CNPJ já cadastrado
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Identificamos que o CNPJ <span className="font-mono font-semibold">{data.cnpj}</span> já possui cadastro ativo na CADBRASIL.
                  Para acessar sua conta, gerenciar documentos e acompanhar oportunidades, utilize a plataforma do fornecedor.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => update("cnpj", "")}>Informar outro CNPJ</AlertDialogCancel>
                <AlertDialogAction asChild>
                  <a href="https://fornecedor.cadbrasil.com.br" target="_blank" rel="noopener noreferrer">
                    Ir para a plataforma
                  </a>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {(loading || data.empresaOk) && (
            <div className="rounded-lg border border-border bg-primary-soft/30 p-5 animate-fade-in">
              <div className="mb-4 flex items-center gap-2">
                {data.empresaOk ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    <p className="text-sm font-semibold text-success">Empresa localizada com sucesso.</p>
                  </>
                ) : (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <p className="text-sm font-medium text-primary-deep">Consultando Receita Federal…</p>
                  </>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnly label="Razão Social" value={data.razaoSocial} loading={loading} />
                <ReadOnly label="Nome Fantasia" value={data.nomeFantasia} loading={loading} />
                <ReadOnly label="Situação Cadastral" value={data.situacao} loading={loading} badge="success" />
                <ReadOnly label="Data de Abertura" value={data.abertura} loading={loading} />
                <ReadOnly label="Porte" value={data.porte} loading={loading} />
                <ReadOnly label="Natureza Jurídica" value={data.empresaOk ? "Sociedade Empresária Limitada" : ""} loading={loading} />
              </div>
            </div>
          )}
        </div>
      )}

      {data.tipoPessoa === "pf" && (
        <div className="animate-fade-in grid gap-5 sm:grid-cols-2">
          <Field label="CPF" required className="sm:col-span-2" status={isValidCPF(data.cpf) ? "ok" : undefined} statusLabel="CPF válido">
            <Input
              ref={cpfRef}
              value={data.cpf}

              onChange={(e) => {
                update("cpf", maskCPF(e.target.value));
                update("empresaOk", e.target.value.replace(/\D/g, "").length === 11);
              }}
              placeholder="000.000.000-00"
              className="h-11 font-mono"
              inputMode="numeric"
            />
          </Field>
          <Field label="Nome Completo" required className="sm:col-span-2">
            <Input
              value={data.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Nome conforme documento oficial"
              className="h-11"
            />
          </Field>
        </div>
      )}
    </div>
  );
}


function StepResponsavel({ data, update }: { data: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Nome Completo" required className="sm:col-span-2">
        <Input value={data.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Nome do responsável legal" className="h-11" />
      </Field>
      <Field label="CPF" required status={isValidCPF(data.cpf) ? "ok" : undefined} statusLabel="CPF válido">
        <Input value={data.cpf} onChange={(e) => update("cpf", maskCPF(e.target.value))} placeholder="000.000.000-00" className="h-11 font-mono" inputMode="numeric" />
      </Field>
      <Field label="Data de Nascimento" required>
        <Input type="date" value={data.nascimento} onChange={(e) => update("nascimento", e.target.value)} className="h-11" />
      </Field>
      <Field label="Telefone" required>
        <Input value={data.telefone} onChange={(e) => update("telefone", maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="h-11" />
      </Field>
      <Field label="WhatsApp" required>
        <Input value={data.whatsapp} onChange={(e) => update("whatsapp", maskPhone(e.target.value))} placeholder="(00) 00000-0000" className="h-11" />
      </Field>
      <Field label="Email institucional" required status={isValidEmail(data.email) ? "ok" : undefined} statusLabel="Email validado">
        <Input type="email" value={data.email} onChange={(e) => update("email", e.target.value)} placeholder="responsavel@empresa.com.br" className="h-11" />
      </Field>
      <Field label="Cargo" required>
        <Input value={data.cargo} onChange={(e) => update("cargo", e.target.value)} placeholder="Sócio-administrador" className="h-11" />
      </Field>
    </div>
  );
}

function StepEndereco({ data, update }: { data: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const [loading, setLoading] = useState(false);

  const handleCep = (v: string) => {
    const m = maskCEP(v);
    update("cep", m);
    if (m.replace(/\D/g, "").length === 8) {
      setLoading(true);
      setTimeout(() => {
        update("rua", "Avenida Paulista");
        update("cidade", "São Paulo");
        update("estado", "SP");
        setLoading(false);
      }, 900);
    }
  };

  return (
    <div className="grid gap-5 sm:grid-cols-6">
      <Field label="CEP" required className="sm:col-span-2">
        <div className="relative">
          <Input value={data.cep} onChange={(e) => handleCep(e.target.value)} placeholder="00000-000" className="h-11 font-mono" />
          {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />}
        </div>
      </Field>
      <Field label="Rua / Logradouro" className="sm:col-span-4">
        <Input value={data.rua} onChange={(e) => update("rua", e.target.value)} className="h-11" />
      </Field>
      <Field label="Número" className="sm:col-span-1">
        <Input value={data.numero} onChange={(e) => update("numero", e.target.value)} className="h-11" />
      </Field>
      <Field label="Complemento" className="sm:col-span-3">
        <Input value={data.complemento} onChange={(e) => update("complemento", e.target.value)} className="h-11" />
      </Field>
      <Field label="Cidade" className="sm:col-span-3">
        <Input value={data.cidade} onChange={(e) => update("cidade", e.target.value)} className="h-11" />
      </Field>
      <Field label="UF" className="sm:col-span-1">
        <Input value={data.estado} onChange={(e) => update("estado", e.target.value)} className="h-11 uppercase" maxLength={2} />
      </Field>
    </div>
  );
}

function StepDiagnostico({ data }: { data: FormState }) {
  const items = [
    { title: "Regularidade Fiscal", desc: "Verificação de certidões federais, estaduais e municipais.", status: "apto" as const, ref: "Lei 14.133/21, art. 68" },
    { title: "Capacidade Jurídica", desc: "Análise do contrato social e poderes do representante.", status: "apto" as const, ref: "Art. 66" },
    { title: "Qualificação Econômico-Financeira", desc: "Balanço patrimonial e índices contábeis.", status: "pendente" as const, ref: "Art. 69" },
    { title: "Qualificação Técnica", desc: "Atestados de capacidade técnica e registros profissionais.", status: "correcao" as const, ref: "Art. 67" },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-primary-soft/30 px-4 py-3 text-sm text-primary-deep">
        Diagnóstico preliminar gerado automaticamente para o CNPJ {data.cnpj || "—"} com base na Lei nº 14.133/2021.
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((it) => (
          <DiagnosticoCard key={it.title} {...it} />
        ))}
      </div>
    </div>
  );
}

function DiagnosticoCard({ title, desc, status, ref }: { title: string; desc: string; status: "apto" | "pendente" | "correcao"; ref: string }) {
  const map = {
    apto: { label: "Apto", dot: "bg-success", border: "border-success/40", text: "text-success" },
    pendente: { label: "Pendente", dot: "bg-warning", border: "border-warning/40", text: "text-warning-foreground" },
    correcao: { label: "Necessita Correção", dot: "bg-destructive", border: "border-destructive/40", text: "text-destructive" },
  }[status];
  const Icon = status === "apto" ? CheckCircle2 : status === "pendente" ? AlertCircle : Circle;
  return (
    <div className={cn("rounded-lg border bg-card p-5 transition-shadow hover:shadow-md", map.border)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{desc}</p>
        </div>
        <Badge variant="outline" className={cn("gap-1 font-medium", map.text)}>
          <span className={cn("h-1.5 w-1.5 rounded-full", map.dot)} />
          {map.label}
        </Badge>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-[11px] text-muted-foreground">
        <span>Referência: {ref}</span>
        <Icon className={cn("h-4 w-4", map.text)} />
      </div>
    </div>
  );
}

function StepDocumentos({ data, update }: { data: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  const docs = [
    { key: "contrato", label: "Contrato Social Consolidado" },
    { key: "cnpj", label: "Cartão CNPJ" },
    { key: "resp", label: "Documento do Responsável (RG/CNH)" },
    { key: "end", label: "Comprovante de Endereço" },
  ];

  const handleFile = (key: string, file: File | null) => {
    if (!file) return;
    const entry = { name: file.name, size: file.size, status: "uploading" as const, progress: 0 };
    update("documentos", { ...data.documentos, [key]: entry });
    let p = 0;
    const id = setInterval(() => {
      p += 12;
      const newDocs = { ...data.documentos };
      if (p >= 100) {
        clearInterval(id);
        update("documentos", { ...newDocs, [key]: { ...entry, progress: 100, status: "analise" } });
        setTimeout(() => {
          update("documentos", { ...newDocs, [key]: { ...entry, progress: 100, status: "aprovado" } });
        }, 1200);
      } else {
        update("documentos", { ...newDocs, [key]: { ...entry, progress: p } });
      }
    }, 200);
  };

  return (
    <div className="space-y-4">
      {docs.map((d) => (
        <DropZone key={d.key} label={d.label} entry={data.documentos[d.key]} onFile={(f) => handleFile(d.key, f)} onRemove={() => {
          const copy = { ...data.documentos }; delete copy[d.key]; update("documentos", copy);
        }} />
      ))}
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-xs text-muted-foreground">
        Arquivos aceitos: PDF, JPG, PNG. Tamanho máximo de 10MB por documento. Todos os arquivos são criptografados e armazenados em servidores nacionais.
      </div>
    </div>
  );
}

function DropZone({ label, entry, onFile, onRemove }: { label: string; entry?: FormState["documentos"][string]; onFile: (f: File | null) => void; onRemove: () => void }) {
  const [drag, setDrag] = useState(false);
  const statusMap = {
    uploading: { label: "Enviando", color: "text-primary" },
    recebido: { label: "Recebido", color: "text-primary" },
    analise: { label: "Em análise", color: "text-warning-foreground" },
    aprovado: { label: "Aprovado", color: "text-success" },
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{label}</p>
        {entry && <span className={cn("text-xs font-semibold", statusMap[entry.status].color)}>{statusMap[entry.status].label}</span>}
      </div>
      {!entry ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files?.[0] ?? null); }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed py-8 text-center transition-colors",
            drag ? "border-primary bg-primary-soft" : "border-border bg-muted/30 hover:bg-muted/60",
          )}
        >
          <CloudUpload className="h-6 w-6 text-primary" />
          <p className="text-sm text-foreground">
            Arraste o arquivo ou <span className="font-semibold text-primary">selecione do computador</span>
          </p>
          <p className="text-[11px] text-muted-foreground">PDF, JPG ou PNG até 10MB</p>
          <input type="file" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} accept=".pdf,.jpg,.jpeg,.png" />
        </label>
      ) : (
        <div className="rounded-md border border-border bg-muted/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-primary-soft text-primary">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{entry.name}</p>
                <p className="text-[11px] text-muted-foreground">{(entry.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onRemove} aria-label="Remover">
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          <Progress value={entry.progress} className="mt-3 h-1.5 bg-primary-soft" />
        </div>
      )}
    </div>
  );
}

function StepPlano() {
  const inclusos = [
    "Credenciamento Assistido por especialistas",
    "Plataforma CADBRASIL completa",
    "Consulta automatizada de Certidões",
    "Assistente Inteligente com IA",
    "Análise de Editais com IA",
    "Gestão Documental centralizada",
    "Gestão Contratual e prazos",
    "Central de Atendimento dedicada",
    "Suporte Especializado em licitações",
  ];
  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary-deep to-primary p-7 text-primary-foreground shadow-lg">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> Habilitação Oficial CADBRASIL
        </div>
        <h3 className="mt-3 text-2xl font-bold">Licença Anual de Credenciamento</h3>
        <p className="mt-1 text-sm opacity-90">
          Acesso completo à plataforma oficial e suporte operacional contínuo para participação em licitações públicas em todo o território nacional.
        </p>
        <div className="mt-6 flex items-end gap-2">
          <span className="text-4xl font-bold">R$ 985,00</span>
          <span className="pb-1 text-sm opacity-80">/ vigência anual</span>
        </div>
        <div className="mt-4 rounded-md bg-white/10 px-3 py-2 text-xs">
          Pagamento único anual · Emissão de Nota Fiscal · Cancelamento conforme contrato
        </div>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded bg-white/15 px-2 py-1">SICAF integrado</span>
          <span className="rounded bg-white/15 px-2 py-1">PNCP compatível</span>
          <span className="rounded bg-white/15 px-2 py-1">Lei 14.133/21</span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <p className="text-sm font-semibold text-foreground">Inclusos na licença</p>
        <Separator className="my-3" />
        <ul className="space-y-2.5">
          {inclusos.map((i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
              {i}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-md border border-border bg-primary-soft/40 p-3 text-xs leading-relaxed text-primary-deep">
          A licença CADBRASIL contempla a habilitação assistida e suporte operacional, não constituindo mera assinatura de software.
        </div>
      </div>
    </div>
  );
}

function StepRevisao({ data, update }: { data: FormState; update: <K extends keyof FormState>(k: K, v: FormState[K]) => void }) {
  return (
    <div className="space-y-5">
      <ReviewBlock title="Empresa">
        <ReviewItem k="CNPJ" v={data.cnpj || "—"} />
        <ReviewItem k="Razão Social" v={data.razaoSocial || "—"} />
        <ReviewItem k="Nome Fantasia" v={data.nomeFantasia || "—"} />
        <ReviewItem k="Situação" v={data.situacao || "—"} />
      </ReviewBlock>
      <ReviewBlock title="Responsável Legal">
        <ReviewItem k="Nome" v={data.nome || "—"} />
        <ReviewItem k="CPF" v={data.cpf || "—"} />
        <ReviewItem k="Email" v={data.email || "—"} />
        <ReviewItem k="Telefone" v={data.telefone || "—"} />
      </ReviewBlock>
      <ReviewBlock title="Endereço">
        <ReviewItem k="CEP" v={data.cep || "—"} />
        <ReviewItem k="Endereço" v={[data.rua, data.numero, data.complemento].filter(Boolean).join(", ") || "—"} />
        <ReviewItem k="Cidade/UF" v={[data.cidade, data.estado].filter(Boolean).join(" / ") || "—"} />
      </ReviewBlock>
      <ReviewBlock title="Licença CADBRASIL">
        <ReviewItem k="Licença Anual CADBRASIL" v="R$ 985,00" />
      </ReviewBlock>

      <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-primary-soft/30 p-4">
        <Checkbox checked={data.declaracao} onCheckedChange={(c) => update("declaracao", Boolean(c))} className="mt-0.5" />
        <span className="text-sm leading-relaxed text-foreground">
          Declaro, sob as penas da lei, que as informações e documentos fornecidos são verdadeiros e estou ciente das responsabilidades civis e penais previstas na legislação vigente, em especial no art. 299 do Código Penal.
        </span>
      </label>
    </div>
  );
}

/* ---------------- SUCCESS ---------------- */

function SuccessScreen() {
  return (
    <div className="min-h-screen bg-background">
      <TopBar />
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-16 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-lg animate-scale-in">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
            <BadgeCheck className="h-10 w-10 text-success" />
          </div>
          <h2 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
            Credenciamento Recebido com Sucesso
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
            Seu processo foi encaminhado para análise da equipe especializada da CADBRASIL. Você receberá atualizações por email institucional.
          </p>

          <div className="mx-auto mt-6 inline-flex items-center gap-3 rounded-lg border border-border bg-primary-soft/40 px-5 py-3 text-left">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Número do Processo</p>
              <p className="font-mono text-base font-semibold text-primary-deep">CAD-2026-00001254</p>
            </div>
          </div>

          <ul className="mx-auto mt-8 max-w-md space-y-2 text-left text-sm">
            {["Análise documental", "Validação cadastral", "Liberação da plataforma", "Início do acompanhamento SICAF"].map((s) => (
              <li key={s} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> {s}
              </li>
            ))}
          </ul>

          <Button className="mt-8 h-11 bg-primary px-6 hover:bg-primary-deep">Acessar Portal do Fornecedor</Button>
        </div>
      </main>
    </div>
  );
}

/* ---------------- SHARED PRIMITIVES ---------------- */

function Field({ label, required, hint, status, statusLabel, children, className }: { label: string; required?: boolean; hint?: string; status?: "ok"; statusLabel?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label} {required && <span className="text-destructive">*</span>}
        </Label>
        {status === "ok" && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-success">
            <CheckCircle2 className="h-3 w-3" /> {statusLabel}
          </span>
        )}
      </div>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function ReadOnly({ label, value, loading, badge }: { label: string; value: string; loading?: boolean; badge?: "success" }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      {loading ? (
        <div className="h-5 w-3/4 animate-pulse rounded bg-muted" />
      ) : badge === "success" && value ? (
        <Badge className="bg-success text-success-foreground hover:bg-success">{value}</Badge>
      ) : (
        <p className="text-sm font-medium text-foreground">{value || "—"}</p>
      )}
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
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{k}</dt>
      <dd className="text-sm font-medium text-foreground">{v}</dd>
    </div>
  );
}

function InstitutionalFooter() {
  return (
    <footer className="mt-10 border-t border-border bg-muted/20 py-8 text-xs text-muted-foreground">
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-3 items-start">
          <div>
            <p className="text-sm font-bold tracking-tight text-foreground">CADBRASIL</p>
            <p className="mt-2 max-w-xs leading-relaxed">
              Plataforma privada de credenciamento e assessoria para licitações públicas. Sem vínculo com órgãos governamentais.
            </p>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">Conformidade</p>
            <p className="mt-2 leading-relaxed">
              LGPD · Lei 13.709/2018 · Dados criptografados em trânsito e em repouso.
            </p>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">Suporte institucional</p>
            <p className="mt-2 leading-relaxed">
              <a href="mailto:privacidade@cadbrasil.com.br" className="hover:text-primary hover:underline">privacidade@cadbrasil.com.br</a>
              <span className="mx-1">·</span>
              <a href="tel:551121220202" className="hover:text-primary hover:underline">(11) 2122-0202</a>
            </p>
            <p className="mt-2 text-[11px]">© 2026 CADBRASIL · Todos os direitos reservados</p>
          </div>
        </div>
      </div>
    </footer>
  );
}