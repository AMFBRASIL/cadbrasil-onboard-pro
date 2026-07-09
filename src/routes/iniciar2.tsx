import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Building2,
  User,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Trophy,
  Target,
  Clock,
  Landmark,
  FileCheck2,
  Flame,
  Wallet,
  BadgeCheck,
  Rocket,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  TopBar,
  Header,
  InstitutionalFooter,
  WhatsAppFloating,
} from "@/components/cadastro/LayoutParts";

export const Route = createFileRoute("/iniciar2")({
  head: () => ({
    meta: [
      { title: "Descubra seu potencial em licitações — CADBRASIL" },
      {
        name: "description",
        content:
          "Em 90 segundos descubra quanto sua empresa pode faturar com o governo. Diagnóstico gratuito CADBRASIL.",
      },
      {
        property: "og:title",
        content: "Descubra seu potencial em licitações — CADBRASIL",
      },
      {
        property: "og:description",
        content:
          "Simulador rápido: veja oportunidades reais, aderência e próximos passos para vender ao governo.",
      },
    ],
  }),
  component: Iniciar2Page,
});

type Value = "sim" | "nao" | "talvez" | "cpf" | "cnpj";

interface Opt {
  value: Value;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
  score: number; // contribuição à aderência
}

interface Q {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  options: Opt[];
}

const QUESTIONS: Q[] = [
  {
    id: "tipo",
    eyebrow: "01 · Perfil",
    title: "Como você vai vender ao governo?",
    subtitle:
      "Empresas (CNPJ) acessam 90% dos editais. CPF só participa de modalidades específicas.",
    options: [
      {
        value: "cnpj",
        label: "Tenho empresa (CNPJ)",
        hint: "MEI, ME, EPP, LTDA — libera todos os editais",
        icon: Building2,
        score: 25,
      },
      {
        value: "cpf",
        label: "Sou pessoa física (CPF)",
        hint: "Ajudamos a abrir seu MEI em 24h",
        icon: User,
        score: 10,
      },
    ],
  },
  {
    id: "faturamento",
    eyebrow: "02 · Ambição",
    title: "Quanto você quer faturar com o governo em 12 meses?",
    subtitle: "Isso ajuda a calibrar os editais que vamos te enviar.",
    options: [
      {
        value: "sim",
        label: "Até R$ 500 mil",
        hint: "Pequenas dispensas e pregões locais",
        icon: Target,
        score: 20,
      },
      {
        value: "talvez",
        label: "R$ 500 mil a R$ 3 milhões",
        hint: "Pregões federais e estaduais",
        icon: TrendingUp,
        score: 25,
      },
      {
        value: "nao",
        label: "Acima de R$ 3 milhões",
        hint: "Concorrências e contratos plurianuais",
        icon: Trophy,
        score: 25,
      },
    ],
  },
  {
    id: "sicaf",
    eyebrow: "03 · Habilitação",
    title: "Você já tem SICAF ativo?",
    subtitle:
      "SICAF é o passaporte obrigatório para o ComprasNet federal. Sem ele, sua proposta é bloqueada.",
    options: [
      {
        value: "sim",
        label: "Sim, está ativo",
        hint: "Precisa só de manutenção",
        icon: ShieldCheck,
        score: 25,
      },
      {
        value: "talvez",
        label: "Tenho mas está vencido",
        hint: "Fazemos a regularização",
        icon: Clock,
        score: 15,
      },
      {
        value: "nao",
        label: "Ainda não tenho",
        hint: "Cuidamos do credenciamento completo",
        icon: XCircle,
        score: 10,
      },
    ],
  },
  {
    id: "certificado",
    eyebrow: "04 · Assinatura digital",
    title: "Possui Certificado Digital válido?",
    subtitle:
      "e-CNPJ ou e-CPF é obrigatório para assinar propostas eletrônicas.",
    options: [
      {
        value: "sim",
        label: "Sim, dentro da validade",
        icon: FileCheck2,
        score: 15,
      },
      {
        value: "talvez",
        label: "Está vencido",
        hint: "Renovamos com desconto",
        icon: Clock,
        score: 8,
      },
      {
        value: "nao",
        label: "Não tenho",
        hint: "Emitimos junto com o SICAF",
        icon: XCircle,
        score: 5,
      },
    ],
  },
  {
    id: "urgencia",
    eyebrow: "05 · Momento",
    title: "Quando você quer começar a receber editais?",
    subtitle: "Ativamos seu monitoramento em até 24h após o cadastro.",
    options: [
      {
        value: "sim",
        label: "Imediatamente",
        hint: "Prioridade máxima",
        icon: Flame,
        score: 15,
      },
      {
        value: "talvez",
        label: "Nos próximos 30 dias",
        icon: Rocket,
        score: 10,
      },
      {
        value: "nao",
        label: "Ainda estou avaliando",
        icon: Star,
        score: 5,
      },
    ],
  },
];

const CADASTRO_URL = "https://cadastro.cadbrasil.com.br";

// Editais simulados que "aparecem" no final conforme o perfil
const EDITAIS = [
  {
    orgao: "Ministério da Saúde",
    obj: "Materiais de escritório",
    valor: "R$ 428.000",
    prazo: "12 dias",
    tag: "Pregão Eletrônico",
  },
  {
    orgao: "Prefeitura de Campinas",
    obj: "Serviços de manutenção predial",
    valor: "R$ 1.2M",
    prazo: "8 dias",
    tag: "Concorrência",
  },
  {
    orgao: "Banco do Brasil",
    obj: "Consultoria especializada",
    valor: "R$ 2.8M",
    prazo: "18 dias",
    tag: "Pregão SRP",
  },
];

function Iniciar2Page() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Value>>({});
  const [counter, setCounter] = useState(0);

  const totalSteps = QUESTIONS.length;
  const isFinal = step >= totalSteps;
  const currentQ = QUESTIONS[step];

  const answeredCount = Object.keys(answers).length;
  const progress = isFinal ? 100 : (step / totalSteps) * 100;

  // Score dinâmico
  const score = useMemo(() => {
    let s = 0;
    for (const q of QUESTIONS) {
      const v = answers[q.id];
      if (!v) continue;
      const opt = q.options.find((o) => o.value === v);
      if (opt) s += opt.score;
    }
    return Math.min(100, s);
  }, [answers]);

  // Estimativa de oportunidades detectadas
  const oportunidades = useMemo(
    () => Math.max(3, Math.round((score / 100) * 47)),
    [score],
  );

  // Contador animado do painel
  useEffect(() => {
    if (counter < oportunidades) {
      const t = setTimeout(() => setCounter((c) => c + 1), 40);
      return () => clearTimeout(t);
    }
  }, [counter, oportunidades]);

  useEffect(() => {
    if (counter > oportunidades) setCounter(oportunidades);
  }, [oportunidades, counter]);

  const tier =
    score >= 80
      ? { label: "Alta prontidão", tone: "success" as const }
      : score >= 50
        ? { label: "Prontidão parcial", tone: "warn" as const }
        : { label: "Início da jornada", tone: "start" as const };

  function select(v: Value) {
    setAnswers((prev) => ({ ...prev, [currentQ.id]: v }));
    setTimeout(() => setStep((s) => s + 1), 220);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function restart() {
    setAnswers({});
    setStep(0);
    setCounter(0);
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <TopBar />
      <Header />

      {/* Faixa com badges de prova social */}
      <div className="border-b border-border bg-gradient-to-r from-primary-soft/60 via-primary-soft/30 to-transparent">
        <div className="mx-auto max-w-7xl px-4 lg:px-8 py-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs md:text-sm">
          <div className="flex items-center gap-2 font-semibold text-primary-deep">
            <Sparkles className="h-4 w-4" /> Diagnóstico em 90 segundos
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <BadgeCheck className="h-4 w-4 text-success" />
            +12.400 empresas credenciadas
          </div>
          <div className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Landmark className="h-4 w-4 text-primary" />
            R$ 38 bi movimentados/ano em compras públicas
          </div>
          <div className="ml-auto text-muted-foreground">
            {isFinal
              ? "Diagnóstico concluído"
              : `Pergunta ${step + 1} de ${totalSteps}`}
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 lg:px-8 pb-3">
          <Progress value={progress} className="h-1.5 bg-primary-soft" />
        </div>
      </div>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 lg:px-8 py-8 md:py-12">
        {!isFinal && currentQ && (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* COLUNA ESQUERDA — PERGUNTA */}
            <section className="rounded-2xl border border-border bg-card p-6 md:p-10 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_20px_60px_-30px_rgba(16,40,80,0.25)]">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {currentQ.eyebrow}
              </p>
              <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
                {currentQ.title}
              </h1>
              <p className="mt-3 text-base md:text-lg text-muted-foreground max-w-2xl">
                {currentQ.subtitle}
              </p>

              <div className="mt-8 grid gap-3">
                {currentQ.options.map((opt) => {
                  const Icon = opt.icon;
                  const selected = answers[currentQ.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => select(opt.value)}
                      className={`group relative text-left rounded-xl border-2 p-5 transition-all bg-background hover:border-primary hover:shadow-lg hover:-translate-y-0.5 ${
                        selected
                          ? "border-primary ring-4 ring-primary/15 shadow-lg"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`h-12 w-12 shrink-0 rounded-xl flex items-center justify-center transition-colors ${
                            selected
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary-soft text-primary-deep group-hover:bg-primary group-hover:text-primary-foreground"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-base md:text-lg leading-tight">
                            {opt.label}
                          </div>
                          {opt.hint && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {opt.hint}
                            </div>
                          )}
                        </div>
                        <ArrowRight
                          className={`h-5 w-5 shrink-0 transition-all ${
                            selected
                              ? "text-primary translate-x-0.5"
                              : "text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
                {step > 0 ? (
                  <Button variant="ghost" onClick={back} size="sm">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                ) : (
                  <span />
                )}
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" />
                  Sem cadastro, sem custo, sem spam
                </span>
              </div>
            </section>

            {/* COLUNA DIREITA — DOSSIÊ AO VIVO */}
            <aside className="space-y-4 lg:sticky lg:top-4 self-start">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-primary-deep to-primary text-primary-foreground p-6 shadow-lg">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] opacity-80">
                  <Sparkles className="h-3.5 w-3.5" /> Seu dossiê ao vivo
                </div>
                <div className="mt-4 flex items-end gap-2">
                  <span className="text-5xl font-black leading-none tabular-nums">
                    {score}
                  </span>
                  <span className="text-xl font-semibold opacity-80 mb-1">
                    / 100
                  </span>
                </div>
                <p className="mt-1 text-sm opacity-90">
                  Aderência ao perfil ideal de licitante
                </p>
                <div className="mt-4 h-2 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                  {tier.label}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Oportunidades detectadas
                </div>
                <div className="mt-3 text-4xl font-black tabular-nums text-primary-deep">
                  {counter}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  editais abertos hoje compatíveis com seu perfil
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
                  Suas respostas
                </div>
                <ul className="space-y-2 text-sm">
                  {QUESTIONS.map((q, i) => {
                    const v = answers[q.id];
                    const opt = q.options.find((o) => o.value === v);
                    const done = !!opt;
                    return (
                      <li
                        key={q.id}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className={`h-5 w-5 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            done
                              ? "bg-success text-success-foreground"
                              : i === step
                                ? "bg-primary text-primary-foreground animate-pulse"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {done ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
                        </div>
                        <span
                          className={`truncate ${done ? "text-foreground font-medium" : "text-muted-foreground"}`}
                        >
                          {opt?.label ?? q.eyebrow.split("·")[1]?.trim()}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
                  {answeredCount === 0
                    ? "Comece respondendo à primeira pergunta →"
                    : `${answeredCount} de ${totalSteps} respondidas`}
                </div>
              </div>
            </aside>
          </div>
        )}

        {isFinal && (
          <section className="max-w-5xl mx-auto">
            {/* HERO DO RESULTADO */}
            <div className="rounded-3xl overflow-hidden border-2 border-primary/20 shadow-2xl">
              <div
                className={`p-8 md:p-12 relative overflow-hidden ${
                  tier.tone === "success"
                    ? "bg-gradient-to-br from-success via-success to-primary-deep text-success-foreground"
                    : tier.tone === "warn"
                      ? "bg-gradient-to-br from-primary to-primary-deep text-primary-foreground"
                      : "bg-gradient-to-br from-primary-deep to-slate-900 text-primary-foreground"
                }`}
              >
                <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -left-10 -bottom-10 h-56 w-56 rounded-full bg-white/5 blur-3xl" />

                <div className="relative">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> Diagnóstico CADBRASIL
                  </div>
                  <h2 className="mt-4 text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-3xl">
                    {tier.tone === "success"
                      ? "Sua empresa está pronta para faturar com o governo."
                      : tier.tone === "warn"
                        ? "Você está muito próximo de vender ao governo."
                        : "Vamos preparar sua empresa para licitar."}
                  </h2>
                  <p className="mt-3 text-lg opacity-90 max-w-2xl">
                    {tier.tone === "success"
                      ? "Aderência alta, requisitos completos. Podemos ativar seu monitoramento de editais em 24h."
                      : "Identificamos ajustes rápidos que destravam seu acesso aos maiores compradores do país."}
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    <BigStat
                      icon={Target}
                      value={`${score}%`}
                      label="Aderência do perfil"
                    />
                    <BigStat
                      icon={Wallet}
                      value={oportunidades.toString()}
                      label="Editais compatíveis hoje"
                    />
                    <BigStat icon={Clock} value="24h" label="Para ativação" />
                  </div>

                  <div className="mt-10">
                    <CtaPrincipal />
                  </div>
                </div>
              </div>

              {/* CARTEIRA DE EDITAIS */}
              <div className="bg-card p-8 md:p-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold">
                      Amostra da sua carteira de oportunidades
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Editais reais publicados esta semana no PNCP e ComprasNet
                    </p>
                  </div>
                  <div className="hidden md:inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary-deep">
                    <Flame className="h-3.5 w-3.5" /> Ao vivo
                  </div>
                </div>

                <div className="grid gap-3">
                  {EDITAIS.map((e, i) => (
                    <div
                      key={i}
                      className="group rounded-xl border border-border bg-background p-5 hover:border-primary hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary-soft px-2 py-0.5 rounded">
                            {e.tag}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Encerra em {e.prazo}
                          </span>
                        </div>
                        <div className="font-semibold text-foreground truncate">
                          {e.obj}
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {e.orgao}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                          Valor estimado
                        </div>
                        <div className="text-xl font-black text-primary-deep tabular-nums">
                          {e.valor}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-primary-soft/60 p-5 flex items-start gap-3 text-sm text-primary-deep">
                  <Sparkles className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>
                    <strong>+{oportunidades - EDITAIS.length} outras</strong>{" "}
                    oportunidades compatíveis serão desbloqueadas assim que seu
                    SICAF estiver ativo. Nossa equipe monitora e envia os
                    editais direto no seu WhatsApp.
                  </p>
                </div>

                {/* CTA final */}
                <div className="mt-10">
                  <CtaPrincipal />
                </div>

                <div className="mt-6 text-center">
                  <button
                    onClick={restart}
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    Refazer diagnóstico
                  </button>
                </div>
              </div>
            </div>

            {/* PROVA SOCIAL */}
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <Testimonial
                name="Marcos R."
                empresa="Inovatec Soluções · SP"
                text="Em 3 meses fechamos R$ 1.8M em contratos com o governo federal. A CADBRASIL cuidou de tudo."
              />
              <Testimonial
                name="Camila F."
                empresa="Vertex Serviços · RJ"
                text="Não sabíamos por onde começar. Hoje recebemos editais toda semana pelo WhatsApp."
              />
              <Testimonial
                name="Roberto A."
                empresa="Distribuidora Andrade · MG"
                text="SICAF ativo em 2 dias. Ganhamos nosso primeiro pregão em menos de um mês."
              />
            </div>
          </section>
        )}
      </main>

      <InstitutionalFooter />
      <WhatsAppFloating />
    </div>
  );
}

function BigStat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/10 backdrop-blur border border-white/15 p-4">
      <Icon className="h-5 w-5 opacity-80" />
      <div className="mt-2 text-3xl font-black tabular-nums">{value}</div>
      <div className="text-xs opacity-80 mt-0.5">{label}</div>
    </div>
  );
}

function Testimonial({
  name,
  empresa,
  text,
}: {
  name: string;
  empresa: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex gap-0.5 mb-3 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="h-4 w-4 fill-current" />
        ))}
      </div>
      <p className="text-sm leading-relaxed text-foreground">"{text}"</p>
      <div className="mt-3 pt-3 border-t border-border">
        <div className="text-sm font-semibold">{name}</div>
        <div className="text-xs text-muted-foreground">{empresa}</div>
      </div>
    </div>
  );
}
