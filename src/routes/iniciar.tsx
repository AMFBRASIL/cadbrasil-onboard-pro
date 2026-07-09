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
import { TopBar, Header, InstitutionalFooter, WhatsAppFloating } from "@/components/cadastro/LayoutParts";


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
    id: "portais",
    title: "Você conhece os portais de licitações?",
    subtitle: "PNCP, ComprasNet e portais de estados e prefeituras.",
    help: {
      title: "Onde encontrar licitações públicas?",
      body:
        "As compras públicas são publicadas em diferentes portais. O PNCP (Portal Nacional de Contratações Públicas) centraliza editais, contratos e atas de órgãos federais. O ComprasNet é usado para pregões eletrônicos do governo federal. Estados, municípios e prefeituras também têm seus próprios portais de licitação. Não conhecer todos não impede sua participação — nós te orientamos onde buscar as melhores oportunidades.",
    },
    options: [
      {
        value: "sim",
        label: "Sim, já acompanho editais",
        description: "Conheço o PNCP, ComprasNet ou outros portais.",
        icon: CheckCircle2,
        aptoImpact: "positive",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
      },
      {
        value: "talvez",
        label: "Já ouvi falar de alguns",
        description: "Conheço superficialmente, mas não operei.",
        icon: FileSearch,
        aptoImpact: "neutral",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
      },
      {
        value: "nao",
        label: "Não conheço ainda",
        description: "Nunca acessei portais de licitações.",
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
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />

      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs md:text-sm font-medium text-primary bg-primary-soft/60 px-3 py-1.5 rounded-full">
            <Sparkles className="h-3.5 w-3.5" />
            Preparação do SICAF Comprasnet
          </div>
          <div className="flex-1 min-w-[160px]">
            <Progress value={progress} className="h-2 bg-primary-soft" />
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            {isFinal ? "Concluído" : `Etapa ${step + 1} de ${totalSteps}`}
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 md:py-14 lg:px-8">

        {!isFinal && currentQuestion && (
          <Card className="p-6 md:p-10 border shadow-sm">
            <section>
              <div className="mx-auto max-w-3xl">
                <div className="mb-8 flex items-start justify-between gap-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      {currentQuestion.title}
                    </h1>
                    <p className="text-muted-foreground mt-2 text-base md:text-lg">
                      {currentQuestion.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setHelpOpen(currentQuestion.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:border-primary hover:text-primary transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    O que é?
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
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
                            className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                              selected ? "bg-primary text-primary-foreground" : `${opt.iconBg ?? "bg-primary/10"} ${opt.iconColor ?? "text-primary"}`
                            }`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-base md:text-lg">
                              {opt.label}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">
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

                <div className="mt-8 flex items-center justify-between">
                  {step > 0 ? (
                    <Button variant="ghost" onClick={handleBack} size="sm">
                      <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                    </Button>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Suas respostas não são armazenadas
                  </span>
                </div>
              </div>
            </section>
          </Card>
        )}



        {isFinal && (
          <section>
            <Card className="overflow-hidden border-2 p-0">
              <div
                className={`p-6 md:p-10 ${
                  apto
                    ? "bg-success text-success-foreground"
                    : "bg-destructive text-destructive-foreground"
                }`}
              >
                <div className="flex items-start gap-4 md:gap-6">
                  <div
                    className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center ${
                      apto ? "bg-white/20" : "bg-white/20"
                    }`}
                  >
                    {apto ? (
                      <CheckCircle2 className="h-7 w-7" />
                    ) : (
                      <XCircle className="h-7 w-7" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs md:text-sm font-semibold uppercase tracking-wider opacity-90 mb-2">
                      Diagnóstico CADBRASIL
                    </div>
                    <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
                      {apto
                        ? "Você está pronto para licitar!"
                        : "Ainda não é o momento"}
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm md:text-base opacity-95">
                      {apto
                        ? "Sua situação indica alta prontidão. Vamos ativar seu acesso e começar a receber editais."
                        : motivo}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 md:p-10">
                {apto && (
                  <div className="grid gap-3 md:grid-cols-3">
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
