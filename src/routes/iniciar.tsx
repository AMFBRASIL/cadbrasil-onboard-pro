import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Gavel,
  Building2,
  User,
  FileSearch,
  ShieldCheck,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/iniciar")({
  head: () => ({
    meta: [
      { title: "Iniciar Cadastro — Onboarding CADBRASIL" },
      {
        name: "description",
        content:
          "Descubra em poucos passos se você está apto a participar de licitações públicas. Onboarding rápido e gratuito da CADBRASIL.",
      },
      { property: "og:title", content: "Iniciar Cadastro — Onboarding CADBRASIL" },
      {
        property: "og:description",
        content:
          "Responda 5 perguntas rápidas e veja se sua empresa está pronta para licitar com órgãos públicos.",
      },
    ],
  }),
  component: IniciarPage,
});

type OptionValue = "sim" | "nao" | "talvez" | "cpf" | "cnpj";

interface Option {
  value: OptionValue;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  aptoImpact: "positive" | "neutral" | "negative";
  iconBg?: string;
  iconColor?: string;
}


interface Question {
  id: string;
  title: string;
  subtitle: string;
  help: {
    title: string;
    body: string;
  };
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "licitacao",
    title: "Você pretende participar de licitações públicas?",
    subtitle: "Vamos entender seu objetivo com o credenciamento.",
    help: {
      title: "O que é participar de licitação?",
      body:
        "Licitação é o processo pelo qual órgãos públicos (governo federal, estados, prefeituras, autarquias e empresas estatais) contratam produtos e serviços. Participando, sua empresa pode vender para o maior comprador do Brasil — que movimenta mais de R$ 38 bilhões por ano em compras públicas.",
    },
    options: [
      {
        value: "sim",
        label: "Sim, quero vender ao governo",
        description: "Já decidi e quero começar o quanto antes.",
        icon: Gavel,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "talvez",
        label: "Ainda estou avaliando",
        description: "Quero entender melhor antes de decidir.",
        icon: FileSearch,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        value: "nao",
        label: "Não tenho interesse",
        description: "Estou apenas explorando a plataforma.",
        icon: XCircle,
        aptoImpact: "negative",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
      },
    ],
  },
  {
    id: "tipoPessoa",
    title: "Você tem empresa aberta ou fará cadastro como CPF?",
    subtitle: "O tipo de pessoa define o caminho no SICAF.",
    help: {
      title: "Pessoa Física (CPF) x Pessoa Jurídica (CNPJ)",
      body:
        "Pessoa Jurídica (CNPJ) — incluindo MEI, ME, EPP e empresas de maior porte — tem acesso a praticamente todas as licitações. Pessoa Física (CPF) só pode participar de modalidades específicas, como leilões e prestação de serviços autônomos. Para 90% das oportunidades, ter um CNPJ é essencial. Se ainda não tem empresa, ajudamos com a abertura.",
    },
    options: [
      {
        value: "cnpj",
        label: "Tenho empresa (CNPJ)",
        description: "MEI, ME, EPP, LTDA ou outro tipo societário.",
        icon: Building2,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "cpf",
        label: "Farei com CPF",
        description: "Ainda não tenho empresa aberta.",
        icon: User,
        aptoImpact: "neutral",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
      },
    ],
  },
  {
    id: "pncp",
    title: "Você conhece o PNCP?",
    subtitle: "Portal Nacional de Contratações Públicas.",
    help: {
      title: "O que é o PNCP?",
      body:
        "O PNCP (Portal Nacional de Contratações Públicas) é o portal oficial criado pela Lei nº 14.133/2021 (Nova Lei de Licitações). Ele centraliza a publicação de editais, atas de registro de preços e contratos de todos os órgãos públicos do Brasil. É onde sua empresa encontra as oportunidades — não conhecer o PNCP não impede sua participação, nós te orientamos.",
    },
    options: [
      {
        value: "sim",
        label: "Sim, já uso o PNCP",
        description: "Acompanho editais e conheço a plataforma.",
        icon: CheckCircle2,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "talvez",
        label: "Já ouvi falar",
        description: "Conheço superficialmente, mas nunca operei.",
        icon: FileSearch,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        value: "nao",
        label: "Não conheço",
        description: "Nunca ouvi falar do PNCP.",
        icon: XCircle,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
    ],
  },
  {
    id: "sicaf",
    title: "Você já possui o SICAF ativo no ComprasNet?",
    subtitle: "SICAF é o cadastro obrigatório para licitar com o governo federal.",
    help: {
      title: "O que é o SICAF?",
      body:
        "O SICAF (Sistema de Cadastramento Unificado de Fornecedores) é a habilitação oficial obrigatória para participar de licitações federais no ComprasNet. Ele valida sua regularidade fiscal, trabalhista, jurídica e econômica. Sem SICAF ativo (Níveis I a VI), sua empresa não consegue enviar propostas em pregões eletrônicos federais. A CADBRASIL faz esse credenciamento completo por você.",
    },
    options: [
      {
        value: "sim",
        label: "Sim, tenho SICAF ativo",
        description: "Preciso apenas de manutenção ou renovação.",
        icon: ShieldCheck,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "nao",
        label: "Não, ainda não tenho",
        description: "Preciso do credenciamento completo.",
        icon: XCircle,
        aptoImpact: "neutral",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
      },
      {
        value: "talvez",
        label: "Tenho mas está inapto",
        description: "Meu cadastro está desatualizado ou vencido.",
        icon: AlertTriangle,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
    ],
  },
  {
    id: "certificado",
    title: "Você possui Certificado Digital (e-CNPJ ou e-CPF)?",
    subtitle: "Necessário para assinar propostas e documentos oficiais.",
    help: {
      title: "Certificado Digital A1 ou A3",
      body:
        "O Certificado Digital é a assinatura eletrônica com validade jurídica exigida para acessar o portal ComprasNet, assinar propostas e formalizar contratos. Existem dois tipos: A1 (arquivo no computador, validade de 1 ano) e A3 (token/cartão, validade de até 3 anos). Se ainda não tem, orientamos como obter com preços especiais.",
    },
    options: [
      {
        value: "sim",
        label: "Sim, tenho certificado válido",
        description: "e-CNPJ ou e-CPF dentro da validade.",
        icon: CheckCircle2,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "nao",
        label: "Não tenho",
        description: "Preciso adquirir um certificado.",
        icon: XCircle,
        aptoImpact: "neutral",
        iconBg: "bg-rose-100",
        iconColor: "text-rose-600",
      },
      {
        value: "talvez",
        label: "Tenho mas está vencido",
        description: "Preciso renovar meu certificado.",
        icon: AlertTriangle,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
    ],
  },
];


const CADASTRO_URL = "https://cadastro.cadbrasil.com.br";

function IniciarPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, OptionValue>>({});
  const [helpOpen, setHelpOpen] = useState<string | null>(null);

  const totalSteps = QUESTIONS.length;
  const isFinal = step >= totalSteps;
  const progress = isFinal ? 100 : (step / totalSteps) * 100;

  const currentQuestion = QUESTIONS[step];
  const activeHelp = helpOpen
    ? QUESTIONS.find((q) => q.id === helpOpen)?.help
    : null;

  const { apto, score, motivo } = useMemo(() => {
    const licitacao = answers.licitacao;
    const tipo = answers.tipoPessoa;

    if (licitacao === "nao") {
      return {
        apto: false,
        score: 0,
        motivo:
          "Você indicou que não pretende participar de licitações. Sem esse objetivo, o credenciamento SICAF não é necessário.",
      };
    }

    let positives = 0;
    let total = 0;
    for (const q of QUESTIONS) {
      const v = answers[q.id];
      if (!v) continue;
      const opt = q.options.find((o) => o.value === v);
      if (!opt) continue;
      total += 1;
      if (opt.aptoImpact === "positive") positives += 1;
    }
    const scorePct = total > 0 ? Math.round((positives / total) * 100) : 0;

    if (tipo === "cpf") {
      return {
        apto: true,
        score: Math.max(scorePct, 40),
        motivo:
          "Você pode participar de modalidades específicas com CPF, mas a maioria das licitações exige CNPJ. Recomendamos abrir uma empresa (MEI é rápido e gratuito) para desbloquear todas as oportunidades.",
      };
    }

    return {
      apto: true,
      score: Math.max(scorePct, 60),
      motivo:
        "Sua empresa está apta para participar de licitações públicas! Vamos cuidar do seu credenciamento SICAF completo e te preparar para vencer editais.",
    };
  }, [answers]);

  function handleSelect(value: OptionValue) {
    const q = currentQuestion;
    setAnswers((prev) => ({ ...prev, [q.id]: value }));
    setTimeout(() => setStep((s) => s + 1), 180);
  }

  function handleBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function handleRestart() {
    setAnswers({});
    setStep(0);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-soft/40 via-background to-background">
      <header className="border-b bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              CB
            </div>
            <div>
              <div className="text-sm font-bold leading-none">CADBRASIL</div>
              <div className="text-xs text-muted-foreground">Onboarding</div>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            Preparação do SICAF Comprasnet
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {isFinal ? "Concluído" : `Etapa ${step + 1} de ${totalSteps}`}
          </div>
        </div>
        <div className="max-w-4xl mx-auto px-4 pb-3">
          <Progress value={progress} className="h-2" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 md:py-14">
        {!isFinal && currentQuestion && (
          <section>
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
                <Sparkles className="h-3.5 w-3.5" />
                Pergunta {step + 1}
              </div>
              <div className="flex items-start justify-between gap-4">
                <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
                  {currentQuestion.title}
                </h1>
                <button
                  type="button"
                  onClick={() => setHelpOpen(currentQuestion.id)}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs md:text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  O que é?
                </button>
              </div>
              <p className="text-muted-foreground mt-2 md:text-lg">
                {currentQuestion.subtitle}
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {currentQuestion.options.map((opt) => {
                const Icon = opt.icon;
                const selected = answers[currentQuestion.id] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`group relative text-left rounded-2xl border-2 p-5 transition-all bg-card hover:border-primary hover:shadow-md hover:-translate-y-0.5 ${
                      selected
                        ? "border-primary ring-2 ring-primary/20 shadow-md"
                        : "border-border"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-primary/10 text-primary group-hover:bg-primary/15"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm md:text-base">
                          {opt.label}
                        </div>
                        <div className="text-xs md:text-sm text-muted-foreground mt-0.5">
                          {opt.description}
                        </div>
                      </div>
                      <ArrowRight
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          selected
                            ? "text-primary translate-x-0.5"
                            : "text-muted-foreground group-hover:text-primary"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            {step > 0 && (
              <div className="mt-8 flex justify-center">
                <Button variant="ghost" onClick={handleBack} size="sm">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                </Button>
              </div>
            )}
          </section>
        )}

        {isFinal && (
          <section>
            <Card className="p-6 md:p-10 border-2">
              <div className="text-center">
                <div
                  className={`inline-flex h-16 w-16 items-center justify-center rounded-full mb-4 ${
                    apto
                      ? "bg-success/15 text-success"
                      : "bg-destructive/15 text-destructive"
                  }`}
                >
                  {apto ? (
                    <CheckCircle2 className="h-9 w-9" />
                  ) : (
                    <XCircle className="h-9 w-9" />
                  )}
                </div>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                  {apto
                    ? "Você está apto a participar de licitações"
                    : "Ainda não é o momento"}
                </h2>
                <p className="text-muted-foreground mt-3 max-w-xl mx-auto md:text-lg">
                  {motivo}
                </p>
              </div>

              {apto && (
                <div className="mt-8 grid gap-3 md:grid-cols-3">
                  <StatBadge label="Aderência" value={`${score}%`} />
                  <StatBadge label="Órgãos ativos" value="220k+" />
                  <StatBadge label="Prazo médio" value="24h" />
                </div>
              )}

              <div className="mt-8 flex flex-col items-center gap-3">
                {apto ? (
                  <a
                    href={CADASTRO_URL}
                    className="w-full max-w-md inline-flex items-center justify-center gap-2 h-14 rounded-xl bg-primary text-primary-foreground font-semibold text-base md:text-lg hover:bg-primary-deep transition-colors shadow-lg shadow-primary/20"
                  >
                    Iniciar Cadastro CADBRASIL
                    <ArrowRight className="h-5 w-5" />
                  </a>
                ) : (
                  <Button variant="outline" onClick={handleRestart}>
                    Refazer perguntas
                  </Button>
                )}
                <button
                  type="button"
                  onClick={handleRestart}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                >
                  Refazer o onboarding
                </button>
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  Suas respostas
                </div>
                <ul className="space-y-2">
                  {QUESTIONS.map((q) => {
                    const v = answers[q.id];
                    const opt = q.options.find((o) => o.value === v);
                    return (
                      <li
                        key={q.id}
                        className="flex items-start justify-between gap-4 text-sm"
                      >
                        <span className="text-muted-foreground">{q.title}</span>
                        <span className="font-medium text-right">
                          {opt?.label ?? "—"}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </Card>
          </section>
        )}
      </main>

      <Dialog open={!!helpOpen} onOpenChange={(o) => !o && setHelpOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <div className="h-11 w-11 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-2">
              <HelpCircle className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl">{activeHelp?.title}</DialogTitle>
            <DialogDescription className="text-sm md:text-base leading-relaxed text-muted-foreground pt-2">
              {activeHelp?.body}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4 text-center">
      <div className="text-2xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
