import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  FileText,
  Loader2,
  LogIn,
  Sparkles,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { getPortalPropostaUrl } from "@/lib/portal";
import { salvarProposta } from "@/lib/proposta";
import {
  PROPOSTA_BASE_ANUAL,
  PROPOSTA_MERCADO_REF,
  PROPOSTA_MODULOS_BASE,
  PROPOSTA_MODULOS_OPCIONAIS,
  calcularTotalProposta,
  formatPrecoBrl,
  type PropostaModulo,
} from "@/lib/proposta-modulos";
import { getTrackingForPayload, trackPortalClick } from "@/lib/tracking";

type Props = {
  protocolo?: string;
};

type FluxoPhase = "idle" | "processing" | "portal" | "error";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function PropostaConfigurador({ protocolo }: Props) {
  const [ativos, setAtivos] = useState<string[]>([]);
  const [modalModulo, setModalModulo] = useState<PropostaModulo | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [salvo, setSalvo] = useState<{
    protocoloProposta: string;
    valorTotal: number;
  } | null>(null);

  const [phase, setPhase] = useState<FluxoPhase>("idle");
  const [processQueue, setProcessQueue] = useState<PropostaModulo[]>([]);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const total = useMemo(() => calcularTotalProposta(ativos), [ativos]);
  const economia = Math.max(0, PROPOSTA_MERCADO_REF - total);
  const extrasAtivos = PROPOSTA_MODULOS_OPCIONAIS.filter((m) =>
    ativos.includes(m.id),
  );

  const progressPct =
    processQueue.length === 0
      ? 0
      : Math.round((doneIds.length / processQueue.length) * 100);

  function toggle(id: string) {
    setAtivos((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    setSalvo(null);
  }

  async function handleGerarProposta() {
    setError(null);

    if (!protocolo?.trim()) {
      setError(
        "Protocolo do cadastro não encontrado. Acesse esta página a partir da conclusão do cadastro.",
      );
      return;
    }

    const queue = [
      ...PROPOSTA_MODULOS_BASE,
      ...PROPOSTA_MODULOS_OPCIONAIS.filter((m) => ativos.includes(m.id)),
    ];

    setProcessQueue(queue);
    setDoneIds([]);
    setCurrentId(null);
    setPhase("processing");
    setSaving(true);

    const savePromise = salvarProposta({
      data: {
        protocoloCadastro: protocolo,
        modulosExtrasIds: ativos,
        tracking: getTrackingForPayload(),
      },
    });

    try {
      for (const modulo of queue) {
        setCurrentId(modulo.id);
        await sleep(650);
        setDoneIds((prev) => [...prev, modulo.id]);
      }
      setCurrentId(null);

      const res = await savePromise;

      if (!res.success) {
        setError(res.error);
        setPhase("error");
        return;
      }

      setSalvo({
        protocoloProposta: res.protocoloProposta,
        valorTotal: res.valorTotal,
      });

      await sleep(450);
      setPhase("portal");
    } catch (e) {
      console.error("[PropostaConfigurador]", e);
      setError("Não foi possível gravar a proposta. Tente novamente.");
      setPhase("error");
    } finally {
      setSaving(false);
    }
  }

  const portalHref = getPortalPropostaUrl({
    protocoloProposta: salvo?.protocoloProposta,
    protocoloCadastro: protocolo,
  });

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm lg:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-deep">
                <Sparkles className="h-3.5 w-3.5" />
                Proposta personalizada · anual
              </span>
              {protocolo ? (
                <span className="rounded-full border border-border bg-muted/40 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                  Protocolo {protocolo}
                </span>
              ) : null}
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground lg:text-4xl">
              Monte sua proposta CADBRASIL
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground lg:text-base">
              O pacote padrão já inclui SICAF, Gestor de certidões e Gestor de
              editais por{" "}
              <strong className="text-foreground">
                {formatPrecoBrl(PROPOSTA_BASE_ANUAL)}/ano
              </strong>
              . Marque os módulos extras — ao gerar, a proposta fica em aberto no
              Portal do Fornecedor para você escolher o pagamento.
            </p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  1. Pacote padrão incluso
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Já contratado no credenciamento — não pode ser removido.
                </p>
              </div>
              <span className="shrink-0 rounded-lg bg-success/10 px-3 py-1.5 text-sm font-bold text-success">
                {formatPrecoBrl(PROPOSTA_BASE_ANUAL)}/ano
              </span>
            </div>

            <div className="mt-5 space-y-3">
              {PROPOSTA_MODULOS_BASE.map((m) => (
                <ModuloCard
                  key={m.id}
                  modulo={m}
                  checked
                  locked
                  onInfo={() => setModalModulo(m)}
                />
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 lg:p-8">
            <h2 className="text-lg font-bold text-foreground">
              2. Amplie sua operação
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Marque os módulos que deseja adicionar. Cada seleção sobe o valor
              anual da proposta.
            </p>

            <div className="mt-5 space-y-3">
              {PROPOSTA_MODULOS_OPCIONAIS.map((m) => (
                <ModuloCard
                  key={m.id}
                  modulo={m}
                  checked={ativos.includes(m.id)}
                  onToggle={() => toggle(m.id)}
                  onInfo={() => setModalModulo(m)}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-6">
          <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-b from-primary-deep to-slate-900 p-6 text-primary-foreground shadow-xl shadow-primary/20">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
              <Wallet className="h-3.5 w-3.5" />
              Sua proposta
            </div>

            <p className="mt-5 text-xs text-white/60">Mercado (pacotes fechados)</p>
            <p className="text-lg font-semibold text-white/45 line-through">
              {formatPrecoBrl(PROPOSTA_MERCADO_REF)}
              <span className="text-sm font-normal">/ano</span>
            </p>

            <p className="mt-4 text-xs text-white/60">Sua configuração</p>
            <p className="text-4xl font-black tracking-tight">
              {formatPrecoBrl(total)}
              <span className="text-base font-semibold text-white/70">/ano</span>
            </p>

            <p className="mt-2 text-sm text-emerald-300">
              {PROPOSTA_MODULOS_BASE.length + extrasAtivos.length} recursos ·{" "}
              {economia > 0
                ? `economia de até ${formatPrecoBrl(economia)}/ano`
                : "pacote sob medida"}
            </p>

            <ul className="mt-5 space-y-2 border-t border-white/15 pt-5 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <span>
                  Pacote base ({formatPrecoBrl(PROPOSTA_BASE_ANUAL)})
                </span>
              </li>
              {extrasAtivos.map((m) => (
                <li key={m.id} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                  <span className="flex-1">
                    {m.nome}{" "}
                    <span className="text-white/60">
                      +{formatPrecoBrl(m.precoAnual)}
                    </span>
                  </span>
                </li>
              ))}
              {extrasAtivos.length === 0 ? (
                <li className="text-xs text-white/50">
                  Nenhum módulo extra selecionado ainda.
                </li>
              ) : null}
            </ul>

            <ul className="mt-5 space-y-2 text-xs text-white/75">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Valores anuais · sem surpresa mensal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Proposta em aberto no portal
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
                Escolha o pagamento no sistema
              </li>
            </ul>

            {error && phase === "idle" ? (
              <p className="mt-4 rounded-lg bg-red-500/20 px-3 py-2 text-xs text-red-100">
                {error}
              </p>
            ) : null}

            {salvo ? (
              <p className="mt-4 rounded-lg bg-emerald-500/20 px-3 py-2 text-xs text-emerald-100">
                Proposta salva · {salvo.protocoloProposta} ·{" "}
                {formatPrecoBrl(salvo.valorTotal)}/ano
              </p>
            ) : null}

            <Button
              type="button"
              size="lg"
              disabled={saving || phase === "processing"}
              onClick={() => void handleGerarProposta()}
              className="mt-6 h-14 w-full bg-white text-base font-bold text-primary-deep hover:bg-white/90 disabled:opacity-70"
            >
              {saving || phase === "processing" ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processando…
                </>
              ) : (
                <>
                  Gerar proposta
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </Button>
            <p className="mt-3 text-center text-[11px] leading-relaxed text-white/55">
              Ativa os módulos, grava a proposta e libera o acesso ao Portal do
              Fornecedor para pagamento.
            </p>
          </div>
        </aside>
      </div>

      {/* Modal: processando módulos */}
      <Dialog
        open={phase === "processing" || phase === "error"}
        onOpenChange={(open) => {
          if (!open && phase === "error") setPhase("idle");
        }}
      >
        <DialogContent
          className="sm:max-w-md"
          onPointerDownOutside={(e) => {
            if (phase === "processing") e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (phase === "processing") e.preventDefault();
          }}
        >
          {phase === "error" ? (
            <>
              <DialogHeader>
                <DialogTitle>Não foi possível gerar a proposta</DialogTitle>
                <DialogDescription>
                  {error ?? "Tente novamente em instantes."}
                </DialogDescription>
              </DialogHeader>
              <Button
                className="mt-2 w-full font-semibold"
                onClick={() => {
                  setPhase("idle");
                  void handleGerarProposta();
                }}
              >
                Tentar novamente
              </Button>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Processando sua proposta
                </DialogTitle>
                <DialogDescription>
                  Estamos ativando cada módulo selecionado e registrando a
                  proposta no seu cadastro.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {doneIds.length} de {processQueue.length} módulos
                    </span>
                    <span className="font-semibold text-foreground">
                      {progressPct}%
                    </span>
                  </div>
                  <Progress value={progressPct} className="h-2.5" />
                </div>

                <ul className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {processQueue.map((m) => {
                    const done = doneIds.includes(m.id);
                    const current = currentId === m.id;
                    return (
                      <li
                        key={m.id}
                        className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          done
                            ? "border-success/30 bg-success/5"
                            : current
                              ? "border-primary/40 bg-primary-soft/50"
                              : "border-border bg-muted/20 opacity-60"
                        }`}
                      >
                        {done ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                        ) : current ? (
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                        ) : (
                          <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                        )}
                        <span className="min-w-0 flex-1 font-medium text-foreground">
                          {m.nome}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {done
                            ? "Ativado"
                            : current
                              ? "Processando…"
                              : "Na fila"}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <p className="text-center text-xs text-muted-foreground">
                  Aguarde — em seguida você acessa o Portal do Fornecedor para
                  escolher o pagamento.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: acessar portal / proposta em aberto */}
      <Dialog
        open={phase === "portal"}
        onOpenChange={(open) => {
          if (!open) setPhase("idle");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 ring-8 ring-success/5">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <DialogTitle className="text-center text-xl">
              Proposta gerada com sucesso
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Sua proposta ficou{" "}
              <strong className="text-foreground">em aberto</strong> no Portal
              do Fornecedor. Ao entrar, o sistema identifica a proposta e libera
              a escolha da forma de pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-2 space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
              {salvo ? (
                <>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Protocolo da proposta
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold text-primary-deep">
                    {salvo.protocoloProposta}
                  </p>
                  <p className="mt-2 text-2xl font-black text-foreground">
                    {formatPrecoBrl(salvo.valorTotal)}
                    <span className="text-sm font-semibold text-muted-foreground">
                      /ano
                    </span>
                  </p>
                </>
              ) : null}
              {protocolo ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Cadastro: {protocolo}
                </p>
              ) : null}
            </div>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Módulos processados e vinculados ao seu cliente
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                Proposta com status <strong className="text-foreground">Gerada</strong>{" "}
                (em aberto para pagamento)
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                No portal você escolhe PIX, boleto ou cartão
              </li>
            </ul>

            <Button
              asChild
              size="lg"
              className="h-14 w-full text-base font-bold"
              onClick={() => trackPortalClick("cta_principal")}
            >
              <a href={portalHref} target="_blank" rel="noopener noreferrer">
                <LogIn className="h-5 w-5" />
                Acessar Portal do Fornecedor
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>

            <p className="text-center text-[11px] text-muted-foreground">
              Use o mesmo e-mail e senha criados no cadastro. Se já estiver
              logado, a proposta em aberto aparece na área financeira.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: detalhe do módulo */}
      <Dialog
        open={Boolean(modalModulo)}
        onOpenChange={(open) => {
          if (!open) setModalModulo(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {modalModulo ? (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6 text-left text-xl">
                  {modalModulo.nome}
                </DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed">
                  {modalModulo.resumo}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-4">
                <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Investimento anual
                  </p>
                  <p className="mt-1 text-2xl font-black text-primary-deep">
                    {modalModulo.inclusoBase
                      ? `Incluso no pacote ${formatPrecoBrl(PROPOSTA_BASE_ANUAL)}`
                      : `+ ${formatPrecoBrl(modalModulo.precoAnual)}`}
                  </p>
                </div>

                <div>
                  <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-primary" />
                    Como funciona
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {modalModulo.detalhes.map((d) => (
                      <li
                        key={d}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {d}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Benefícios
                  </h3>
                  <ul className="mt-2 space-y-2">
                    {modalModulo.beneficios.map((b) => (
                      <li
                        key={b}
                        className="flex items-start gap-2 text-sm text-foreground"
                      >
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>

                {!modalModulo.inclusoBase ? (
                  <Button
                    className="w-full font-semibold"
                    onClick={() => {
                      if (!ativos.includes(modalModulo.id)) {
                        toggle(modalModulo.id);
                      }
                      setModalModulo(null);
                    }}
                  >
                    {ativos.includes(modalModulo.id)
                      ? "Já está na proposta"
                      : `Adicionar · +${formatPrecoBrl(modalModulo.precoAnual)}/ano`}
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function ModuloCard({
  modulo,
  checked,
  locked,
  onToggle,
  onInfo,
}: {
  modulo: PropostaModulo;
  checked: boolean;
  locked?: boolean;
  onToggle?: () => void;
  onInfo: () => void;
}) {
  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 transition-colors ${
        checked
          ? "border-primary/40 bg-primary-soft/40"
          : "border-border bg-background hover:border-primary/25"
      }`}
    >
      <div className="pt-0.5">
        <Checkbox
          checked={checked}
          disabled={locked}
          onCheckedChange={() => onToggle?.()}
          aria-label={modulo.nome}
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-foreground">{modulo.nome}</p>
            <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
              {modulo.resumo}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {modulo.inclusoBase ? (
              <span className="text-xs font-semibold uppercase tracking-wide text-success">
                Incluso
              </span>
            ) : (
              <span className="text-sm font-bold text-primary-deep">
                +{formatPrecoBrl(modulo.precoAnual)}
                <span className="block text-[10px] font-medium text-muted-foreground">
                  /ano
                </span>
              </span>
            )}
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mt-2 h-8 px-2 text-xs text-primary hover:text-primary-deep"
          onClick={onInfo}
        >
          <CircleHelp className="h-3.5 w-3.5" />
          Entender este recurso
        </Button>
      </div>
    </div>
  );
}
